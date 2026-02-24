import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Field, SizeControl } from '../types';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { BarChart3, Filter, ArrowLeft, TrendingUp } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export default function Dashboard() {
    const [fields, setFields] = useState<Field[]>([]);
    const [controls, setControls] = useState<SizeControl[]>([]);
    const [catalogVarieties, setCatalogVarieties] = useState<{ id: string, name: string, reference_fields: string[] }[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingRef, setSavingRef] = useState(false);

    // View State
    const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid');
    const [selectedVariety, setSelectedVariety] = useState<string>('');
    const [selectedFields, setSelectedFields] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fieldsRes, controlsRes, catalogRes] = await Promise.all([
                    api.get('/fields'),
                    api.get('/size-controls'),
                    api.get('/catalog/varieties')
                ]);
                setFields(fieldsRes.data);
                setControls(controlsRes.data);
                setCatalogVarieties(catalogRes.data);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived Data
    const varieties = useMemo(() => {
        const vars = new Set<string>();
        fields.forEach(f => {
            if (f.variety) vars.add(f.variety);
        });
        return Array.from(vars).sort();
    }, [fields]);

    const availableFields = useMemo(() => {
        if (!selectedVariety) return [];
        return fields.filter(f => f.variety === selectedVariety);
    }, [fields, selectedVariety]);

    // UI Handlers
    const enterDetailMode = (variety: string) => {
        setSelectedVariety(variety);
        // If there are reference fields saved, select those by default, else select all
        const catalogVar = catalogVarieties.find(v => v.name === variety);
        if (catalogVar && catalogVar.reference_fields && catalogVar.reference_fields.length > 0) {
            setSelectedFields(catalogVar.reference_fields);
        } else {
            const varsFields = fields.filter(f => f.variety === variety).map(f => f.id);
            setSelectedFields(varsFields);
        }
        setViewMode('detail');
    };

    const goBackToGrid = () => {
        setSelectedVariety('');
        setSelectedFields([]);
        setViewMode('grid');
    };

    const handleVarietyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const variety = e.target.value;
        setSelectedVariety(variety);
        if (variety) {
            setSelectedFields(fields.filter(f => f.variety === variety).map(f => f.id));
        } else {
            setSelectedFields([]);
        }
    };

    const toggleField = (fieldId: string) => {
        setSelectedFields(prev =>
            prev.includes(fieldId)
                ? prev.filter(id => id !== fieldId)
                : [...prev, fieldId]
        );
    };

    const handleSaveReference = async () => {
        if (!selectedVariety) return;
        const catalogVar = catalogVarieties.find(v => v.name === selectedVariety);
        if (!catalogVar) return alert("Error: Varietat no trobada al catàleg.");

        setSavingRef(true);
        try {
            await api.patch(`/catalog/varieties/${catalogVar.id}/reference-fields`, {
                reference_fields: selectedFields
            });
            // Update local state
            setCatalogVarieties(prev => prev.map(v =>
                v.id === catalogVar.id ? { ...v, reference_fields: selectedFields } : v
            ));
            alert("✅ Corba de referència guardada correctament! Els productors ara veuran la mitjana d'aquests camps escollits.");
        } catch (err) {
            console.error(err);
            alert("Error al guardar els camps de referència.");
        } finally {
            setSavingRef(false);
        }
    };

    // --- LOGIC: Global Averages (Grid Mode) ---
    // For each variety, calculate the cooperative's total average per date.
    const globalVarietyData = useMemo(() => {
        const dataMap: Record<string, { labels: string[], data: number[], hasData: boolean }> = {};

        varieties.forEach(variety => {
            const catalogVar = catalogVarieties.find(v => v.name === variety);
            let vFields = [];

            if (catalogVar && catalogVar.reference_fields && catalogVar.reference_fields.length > 0) {
                // Use ONLY reference fields
                vFields = catalogVar.reference_fields;
            } else {
                // Fallback to all fields if admin hasn't configured a reference yet
                vFields = fields.filter(f => f.variety === variety).map(f => f.id);
            }

            const vControls = controls.filter(c => vFields.includes(c.field_id) && c.date);

            // Group controls by date across all fields of this variety
            const controlsByDate: Record<string, number[]> = {};
            vControls.forEach(c => {
                const d = c.date;
                if (!controlsByDate[d]) controlsByDate[d] = [];
                controlsByDate[d].push(Number(c.average_size));
            });

            const sortedDates = Object.keys(controlsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

            const rawData = sortedDates.map(d => {
                const arr = controlsByDate[d];
                const avg = arr.reduce((sum, val) => sum + val, 0) / arr.length;
                return Number(avg.toFixed(2));
            });

            dataMap[variety] = {
                labels: sortedDates,
                data: rawData,
                hasData: rawData.length > 0
            };
        });

        return dataMap;
    }, [varieties, fields, controls]);

    // --- LOGIC: Detail View (Multi-Field Compare) ---
    const detailChartData = useMemo(() => {
        if (selectedFields.length === 0) return null;

        const filteredControls = controls.filter(c => selectedFields.includes(c.field_id));
        const dateSet = new Set<string>();
        filteredControls.forEach(c => { if (c.date) dateSet.add(c.date); });
        const labels = Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444'];

        const datasets = selectedFields.map((fieldId, idx) => {
            const field = fields.find(f => f.id === fieldId);
            const fieldControls = filteredControls.filter(c => c.field_id === fieldId);

            const data = labels.map(dateLabel => {
                const recordsOnDate = fieldControls.filter(c => c.date === dateLabel);
                if (recordsOnDate.length === 0) return null;
                const avg = recordsOnDate.reduce((sum, r) => sum + Number(r.average_size), 0) / recordsOnDate.length;
                return Number(avg.toFixed(2));
            });

            return {
                label: field ? field.name : 'Unknown Field',
                data,
                borderColor: colors[idx % colors.length],
                backgroundColor: colors[idx % colors.length] + '80',
                tension: 0.3,
                spanGaps: true,
            };
        });

        return { labels, datasets };
    }, [controls, selectedFields, fields]);

    const detailOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: `Comparativa Detallada: ${selectedVariety || ''}` }
        },
        scales: {
            y: { title: { display: true, text: 'Calibre Mitjà (mm)' } }
        }
    };


    if (loading) return <div className="p-8 text-center text-slate-500">Carregant gràfics...</div>;

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl premium-gradient flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        Panell d'Anàlisi Global
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">
                        {viewMode === 'grid'
                            ? "Evolució del calibre mitjà de tota la cooperativa per varietat."
                            : "Compara les corbes de creixement específiques entre diferents camps."
                        }
                    </p>
                </div>
                {viewMode === 'detail' && (
                    <button
                        onClick={goBackToGrid}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Tornar a la Vista Global
                    </button>
                )}
            </div>

            {/* GRID MODE */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {varieties.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                            No hi ha camps ni varietats registrades al sistema.
                        </div>
                    ) : (
                        varieties.map(variety => {
                            const vData = globalVarietyData[variety];
                            const chartDataset = {
                                labels: vData.labels,
                                datasets: [{
                                    label: `Mitjana Global ${variety}`,
                                    data: vData.data,
                                    borderColor: '#10b981',
                                    backgroundColor: '#10b98120',
                                    fill: true,
                                    tension: 0.4,
                                    pointRadius: 2,
                                    pointHoverRadius: 5
                                }]
                            };

                            const sparklineOptions = {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false }, tooltip: { enabled: true } },
                                scales: { x: { display: false }, y: { display: false, min: 0 } },
                                interaction: { mode: 'index' as const, intersect: false },
                            };

                            // Quick metrics calculations
                            const latestValue = vData.data.length > 0 ? vData.data[vData.data.length - 1] : 0;
                            const prevValue = vData.data.length > 1 ? vData.data[vData.data.length - 2] : null;
                            const increment = prevValue !== null ? (latestValue - prevValue).toFixed(1) : null;

                            return (
                                <div
                                    key={variety}
                                    onClick={() => enterDetailMode(variety)}
                                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-emerald-700 transition-colors">{variety}</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">{fields.filter(f => f.variety === variety).length} camps reportant</p>
                                        </div>
                                        {vData.hasData && (
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-emerald-600">{latestValue.toFixed(1)} <span className="text-sm font-normal text-slate-400">mm</span></div>
                                                {increment !== null && (
                                                    <div className="text-xs font-bold text-emerald-500 flex items-center justify-end gap-0.5 mt-0.5">
                                                        <TrendingUp className="w-3 h-3" /> +{increment} mm
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-h-[120px] bg-slate-50/50 rounded-lg p-2 relative">
                                        {!vData.hasData ? (
                                            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 italic">
                                                Sense controls registrats
                                            </div>
                                        ) : (
                                            <Line data={chartDataset} options={sparklineOptions} />
                                        )}
                                    </div>

                                    <div className="mt-4 text-center">
                                        <span className="text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Veure comparativa detallada &rarr;
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* DETAIL MODE */}
            {viewMode === 'detail' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4">
                    {/* Filters Sidebar */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 lg:col-span-1 h-fit">
                        <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
                            <Filter size={18} />
                            Filtres de Comparativa
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">1. Varietat Activa</label>
                            <select
                                value={selectedVariety}
                                onChange={handleVarietyChange}
                                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-slate-50 font-medium"
                            >
                                <option value="">-- Tria una varietat --</option>
                                {varieties.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>

                        {selectedVariety && (
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-700">2. Camps a Comparar</label>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                                    {availableFields.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">No hi ha camps amb aquesta varietat.</p>
                                    ) : (
                                        availableFields.map(f => (
                                            <label key={f.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFields.includes(f.id)}
                                                    onChange={() => toggleField(f.id)}
                                                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{f.name}</p>
                                                    <p className="text-xs text-slate-500">{f.specific_variety || 'Sense subtipus'}</p>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedVariety && (
                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleSaveReference}
                                    disabled={savingRef || selectedFields.length === 0}
                                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {savingRef ? 'Guardant...' : '⭐ Fixar com a Referència Oficial'}
                                </button>
                                <p className="text-[10px] text-slate-400 mt-2 text-center leading-tight">
                                    En guardar, configuraràs que la <b>Mitjana Global</b> d'aquesta varietat que veuen els pagesos es calculi només a partir dels camps seleccionats a dalt.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Compare Chart Area */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-3 min-h-[500px] flex flex-col">
                        {!selectedVariety ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg">Tria una varietat per començar</p>
                            </div>
                        ) : selectedFields.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                <Filter className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg">Selecciona almenys un camp a l'esquerra</p>
                            </div>
                        ) : detailChartData ? (
                            <div className="flex-1 flex flex-col relative w-full h-full min-h-[400px]">
                                <div className="flex-1 min-h-[350px]">
                                    <Line data={detailChartData} options={detailOptions} />
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

        </div>
    );
}
