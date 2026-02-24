import React, { useState, useEffect } from 'react';
import api from '../api';
import { Field, SizeControl } from '../types';
import { Plus, Trash2, Trees, Maximize, LineChart as LineChartIcon, X, Ruler, Calendar, AlertCircle, MapPin } from 'lucide-react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Fields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [varieties, setVarieties] = useState<{ id: string, name: string }[]>([]);
  const [subvarieties, setSubvarieties] = useState<{ id: string, variety_id: string, name: string }[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  // Analytics Modal State
  const [selectedFieldForAnalytics, setSelectedFieldForAnalytics] = useState<Field | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Size Controls Modal State
  const [selectedFieldForControls, setSelectedFieldForControls] = useState<Field | null>(null);
  const [fieldSizeControls, setFieldSizeControls] = useState<SizeControl[]>([]);
  const [controlsLoading, setControlsLoading] = useState(false);
  const [sizeControlForm, setSizeControlForm] = useState({
    date: new Date().toISOString().split('T')[0],
    zone: '',
    numApples: 10,
    appleSizes: Array(10).fill('')
  });

  // Formulari
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    rowWidth: '',      // m
    treeDistance: '',  // m
    treeType: 'Eix',
    variety: '',
    specificVariety: '',
    rootstock: '',
    plantingYear: '',
    irrigationType: ''
  });

  const fetchFields = async () => {
    try {
      const [res, varRes, subRes] = await Promise.all([
        api.get('/fields'),
        api.get('/catalog/varieties'),
        api.get('/catalog/subvarieties')
      ]);
      setFields(res.data);
      setVarieties(varRes.data);
      setSubvarieties(subRes.data);
    } catch (err) {
      console.error('Error fetching fields:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'variety' ? { specificVariety: '' } : {})
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    // Calcular marc de plantació: rowWidth x treeDistance m
    let plantationFrame = '';
    if (formData.rowWidth && formData.treeDistance) {
      plantationFrame = `${formData.rowWidth}x${formData.treeDistance}m`;
    }

    try {
      await api.post('/fields', {
        name: formData.name,
        area: formData.area ? parseFloat(formData.area) : null,
        row_width: formData.rowWidth ? parseFloat(formData.rowWidth) : null,
        plantation_frame: plantationFrame || null,
        tree_type: formData.treeType,
        variety: formData.variety || null,
        specific_variety: formData.specificVariety || null,
        rootstock: formData.rootstock || null,
        planting_year: formData.plantingYear ? parseInt(formData.plantingYear, 10) : null,
        irrigation_type: formData.irrigationType || null
      });
      setIsAdding(false);
      setFormData({ name: '', area: '', rowWidth: '', treeDistance: '', treeType: 'Eix', variety: '', specificVariety: '', rootstock: '', plantingYear: '', irrigationType: '' });
      fetchFields();
    } catch (err) {
      console.error('Error saving field:', err);
    }
  };

  const deleteField = async (id: string) => {
    if (!confirm('Segur que vols esborrar aquest camp?')) return;
    try {
      await api.delete(`/fields/${id}`);
      fetchFields();
    } catch (err) {
      console.error('Error deleting field:', err);
    }
  };

  const openSizeControls = async (field: Field) => {
    setSelectedFieldForControls(field);
    setControlsLoading(true);
    try {
      const res = await api.get(`/size-controls?field_id=${field.id}`);
      setFieldSizeControls(res.data);
    } catch (err) {
      console.error('Error loading controls:', err);
    } finally {
      setControlsLoading(false);
    }
  };

  const handleSizeControlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSizeControlForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNumApplesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseInt(e.target.value) || 0;
    const validNum = Math.min(Math.max(1, num), 50);
    const newSizes = Array(validNum).fill('');
    for (let i = 0; i < Math.min(validNum, sizeControlForm.appleSizes.length); i++) {
      newSizes[i] = sizeControlForm.appleSizes[i];
    }
    setSizeControlForm(prev => ({ ...prev, numApples: validNum, appleSizes: newSizes }));
  };

  const handleAppleSizeChange = (index: number, value: string) => {
    const newSizes = [...sizeControlForm.appleSizes];
    newSizes[index] = value;
    setSizeControlForm(prev => ({ ...prev, appleSizes: newSizes }));
  };

  const handleSizeControlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldForControls || !sizeControlForm.date) return;

    const validSizes = sizeControlForm.appleSizes.filter(s => parseFloat(s) > 0);
    if (validSizes.length === 0) return alert('Introdueix almenys un calibre vàlid.');

    const average = validSizes.reduce((acc, val) => acc + parseFloat(val), 0) / validSizes.length;

    try {
      const res = await api.post('/size-controls', {
        field_id: selectedFieldForControls.id,
        date: sizeControlForm.date,
        zone: sizeControlForm.zone || null,
        average_size: average,
        sample_size: validSizes.length,
        measurements: validSizes.map(Number)
      });

      setFieldSizeControls(prev => [res.data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setSizeControlForm({ date: new Date().toISOString().split('T')[0], zone: '', numApples: 10, appleSizes: Array(10).fill('') });

    } catch (err) {
      console.error('Error saving control:', err);
      alert('Error en guardar el control.');
    }
  };

  const deleteSizeControl = async (id: string) => {
    if (!confirm('Segur que vols esborrar aquest registre?')) return;
    try {
      await api.delete(`/size-controls/${id}`);
      setFieldSizeControls(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting control:', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Carregant camps...</div>;

  const openAnalytics = async (field: Field) => {
    setSelectedFieldForAnalytics(field);
    setAnalyticsLoading(true);
    try {
      // 1. Fetch user's field data
      const fieldDataRes = await api.get(`/size-controls?field_id=${field.id}`);

      // 2. Fetch global average (reference) for this variety.
      // If the field has no variety assigned, we can't fetch a global curve.
      let globalData: any[] = [];
      if (field.variety) {
        const globalDataRes = await api.get(`/size-controls/global-average?variety=${encodeURIComponent(field.variety)}`);
        globalData = globalDataRes.data;
      }

      // 3. Merge data for Chart
      const fieldRecords = fieldDataRes.data;
      const allDates = new Set<string>();

      fieldRecords.forEach((r: any) => { if (r.date) allDates.add(r.date); });
      globalData.forEach((r: any) => { if (r.date) allDates.add(r.date); });

      const sortedDates = Array.from(allDates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      // Find distinct zones for the field
      const zones = Array.from(new Set(fieldRecords.map((r: any) => r.zone || 'General')));
      const zoneColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

      const fieldDatasets = zones.map((zoneName, index) => {
        const color = zoneColors[index % zoneColors.length];
        return {
          label: `El Teu Camp (${zoneName})`,
          data: sortedDates.map(d => {
            const records = fieldRecords.filter((r: any) => r.date === d && (r.zone || 'General') === zoneName);
            if (records.length === 0) return null;
            const avg = records.reduce((sum: number, r: any) => sum + Number(r.average_size), 0) / records.length;
            return Number(avg.toFixed(2));
          }),
          borderColor: color,
          backgroundColor: color,
          tension: 0.3,
          spanGaps: true,
          borderWidth: 3
        };
      });

      const globalDataset = sortedDates.map(d => {
        const rec = globalData.find(g => g.date === d);
        return rec ? Number(rec.aggregated_average) : null;
      });

      setAnalyticsData({
        labels: sortedDates,
        datasets: [
          ...fieldDatasets,
          {
            label: `Mitjana Referència (${field.variety || 'Cap'})`,
            data: globalDataset,
            borderColor: '#94a3b8', // slate-400
            backgroundColor: '#94a3b8',
            borderDash: [5, 5],
            tension: 0.3,
            spanGaps: true,
            borderWidth: 2
          }
        ]
      });

    } catch (err) {
      console.error("Error loading analytics:", err);
      alert("No s'han pogut carregar les dades de gràfics per aquest camp.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-800">Camps de Cultiu</h1>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors"
        >
          {isAdding ? 'Cancel·lar' : <><Plus size={20} /> Nou Camp</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Afegir Nou Camp</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Nom del Camp *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="Ex: Camp de l'Ermita" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Superfície (ha)</label>
              <input type="number" step="0.01" name="area" value={formData.area} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-green-500 focus:border-green-500 outline-none" placeholder="Ex: 2.5" />
            </div>

            {/* Noves columnes */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Varietat</label>
              <select name="variety" value={formData.variety} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 outline-none bg-white">
                <option value="">-- Sense Varietat --</option>
                {varieties.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Varietat Específica</label>
              <select
                name="specificVariety"
                value={formData.specificVariety}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 outline-none bg-white"
                disabled={!formData.variety}
              >
                <option value="">-- Sense Subvarietat --</option>
                {subvarieties.filter(s => {
                  const v = varieties.find(vary => vary.name === formData.variety);
                  return v && s.variety_id === v.id;
                }).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Peu (Rootstock)</label>
              <input type="text" name="rootstock" value={formData.rootstock} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 outline-none" placeholder="Ex: M9" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Any de Plantació</label>
              <input type="number" name="plantingYear" value={formData.plantingYear} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 outline-none" placeholder="Ex: 2018" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Tipus de Reg</label>
              <input type="text" name="irrigationType" value={formData.irrigationType} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 outline-none" placeholder="Ex: Goteig" />
            </div>

            <div className="md:col-span-2 border-t pt-4 mt-2">
              <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2"><Trees size={18} className="text-green-600" /> Dades de Plantació</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Distància entre files (m)</label>
                  <input type="number" step="0.01" name="rowWidth" value={formData.rowWidth} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 outline-none" placeholder="Ex: 3" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Dist. entre pomeres (m)</label>
                  <input type="number" step="0.01" name="treeDistance" value={formData.treeDistance} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 outline-none" placeholder="Ex: 0.6" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Tipus d'Arbre</label>
                  <select name="treeType" value={formData.treeType} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 outline-none bg-white">
                    <option value="Eix">Eix</option>
                    <option value="Doble Eix">Doble Eix</option>
                    <option value="Vas">Vas</option>
                    <option value="Multi-eix">Multi-eix</option>
                  </select>
                </div>

              </div>
              <p className="text-xs text-gray-500 mt-2">El marc de plantació es desarà automàticament com a (Files x Pomeres) m. Ex: 3x0.6m</p>
            </div>

            <div className="md:col-span-2 flex justify-end mt-4">
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium shadow-sm">
                Desar Camp
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.length === 0 ? (
          <div className="col-span-full bg-white p-8 text-center rounded-lg shadow-sm border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">Encara no hi ha cap camp registrat.</p>
            <p className="text-gray-400 text-sm mt-1">Fes clic a "Nou Camp" per començar.</p>
          </div>
        ) : (
          fields.map((field) => (
            <div key={field.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 border-b bg-gray-50 flex justify-between items-start">
                <h3 className="font-bold text-lg text-gray-800 truncate" title={field.name}>{field.name}</h3>
                <button onClick={() => deleteField(field.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="p-4 space-y-3">

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Maximize size={16} className="text-orange-500" />
                  <span>Superfície: <span className="font-medium text-gray-800">{field.area ? field.area + ' ha' : '-'}</span></span>
                </div>

                <div className="bg-green-50 p-3 rounded-md mt-2 border border-green-100">
                  <div className="text-xs uppercase font-bold text-green-700 mb-2 flex items-center gap-1"><Trees size={14} /> Dades Tècniques</div>
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-700">
                    <div>
                      <span className="block text-xs text-gray-500">Marc de plantació</span>
                      <span className="font-medium">{field.plantation_frame || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Tipus d'arbre</span>
                      <span className="font-medium">{field.tree_type || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Varietat</span>
                      <span className="font-medium">{field.variety || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Peu</span>
                      <span className="font-medium">{field.rootstock || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Any Plantació</span>
                      <span className="font-medium">{field.planting_year || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500">Reg</span>
                      <span className="font-medium">{field.irrigation_type || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t pt-3 flex gap-2">
                  <button
                    onClick={() => openAnalytics(field)}
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2 rounded-lg transition-colors text-sm"
                  >
                    <LineChartIcon size={16} />
                    Gràfic
                  </button>
                  <button
                    onClick={() => openSizeControls(field)}
                    className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors shadow-sm text-sm"
                  >
                    <Ruler size={16} />
                    Calibres
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Analytics Modal */}
      {selectedFieldForAnalytics && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <LineChartIcon className="text-emerald-500" />
                  Evolució del Camp
                </h2>
                <p className="text-slate-500">Comparativa contra la corba de referència oficial de la cooperativa.</p>
              </div>
              <button
                onClick={() => setSelectedFieldForAnalytics(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 flex-1 min-h-[400px]">
              {analyticsLoading ? (
                <div className="h-full flex items-center justify-center text-slate-400 animate-pulse">
                  Processant dades i calculant referències...
                </div>
              ) : analyticsData && analyticsData.datasets[0].data.every((v: any) => v === null) ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                  <LineChartIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">Aquest camp encara no té cap control de calibre.</p>
                  <p className="text-sm">Afegeix una nova mesura a la pestanya 'Calibres' per veure la gràfica.</p>
                </div>
              ) : analyticsData ? (
                <Line
                  data={analyticsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                      }
                    },
                    scales: {
                      y: {
                        title: { display: true, text: 'Calibre Mitjà (mm)' }
                      }
                    }
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Size Controls Modal */}
      {selectedFieldForControls && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:rounded-2xl shadow-2xl sm:max-w-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 rounded-t-3xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Ruler className="text-emerald-500 w-6 h-6" />
                  Controls de Calibre
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {selectedFieldForControls.name}
                  </span>
                  {selectedFieldForControls.variety && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                      {selectedFieldForControls.variety}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedFieldForControls(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 bg-slate-50/50">
              {/* Add New Entry Form */}
              <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm shadow-emerald-100/50 mb-6">
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Plus size={16} /> Nova Mesura
                </h3>
                <form onSubmit={handleSizeControlSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="w-full sm:flex-1 space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={14} /> Data
                      </label>
                      <input
                        type="date"
                        name="date"
                        required
                        value={sizeControlForm.date}
                        onChange={handleSizeControlChange}
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700 bg-slate-50"
                      />
                    </div>
                    <div className="w-full sm:flex-1 space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin size={14} /> Zona (Opc.)
                      </label>
                      <input
                        type="text"
                        name="zone"
                        value={sizeControlForm.zone}
                        onChange={handleSizeControlChange}
                        placeholder="Ex: Nord"
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700 bg-slate-50"
                      />
                    </div>
                    <div className="w-full sm:w-32 space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Nº Pomes
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={sizeControlForm.numApples}
                        onChange={handleNumApplesChange}
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Ruler size={14} /> Mides individuals (mm)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {sizeControlForm.appleSizes.map((size, index) => (
                        <input
                          key={index}
                          type="number"
                          step="0.01"
                          placeholder={`${index + 1}`}
                          value={size}
                          onChange={(e) => handleAppleSizeChange(index, e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-center focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-700 bg-slate-50"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center mt-2 border-t border-slate-100 pt-4 gap-4">
                    <div className="text-slate-600 bg-slate-100 px-4 py-2 rounded-lg w-full sm:w-auto text-center sm:text-left">
                      Mitjana calculada: <span className="font-bold text-xl text-emerald-600 ml-1">{
                        (() => {
                          const valid = sizeControlForm.appleSizes.filter(s => parseFloat(s) > 0);
                          return valid.length > 0 ? (valid.reduce((acc, val) => acc + parseFloat(val), 0) / valid.length).toFixed(2) : '0.00'
                        })()
                      } mm</span>
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                    >
                      Desar Registre
                    </button>
                  </div>
                </form>
              </div>

              {/* History Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 px-1">Històric de mesures</h3>

                {controlsLoading ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3"></div>
                    <p>Carregant dades...</p>
                  </div>
                ) : fieldSizeControls.length === 0 ? (
                  <div className="bg-white py-10 px-4 text-center rounded-xl border border-dashed border-slate-300 flex flex-col items-center">
                    <AlertCircle className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-slate-500 font-medium">Cap control registrat</p>
                    <p className="text-sm text-slate-400 mt-1">Introdueix la primera mesura al formulari superior</p>
                  </div>
                ) : (
                  <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <th className="p-4 rounded-tl-xl text-center">Data</th>
                            <th className="p-4 text-center">Zona</th>
                            <th className="p-4 text-center">Calibre (mm)</th>
                            <th className="p-4 rounded-tr-xl w-16"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {fieldSizeControls.map((control) => (
                            <tr key={control.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="p-4 font-medium text-slate-700 text-center">
                                {new Date(control.date).toLocaleDateString('ca-ES')}
                              </td>
                              <td className="p-4 text-slate-600 text-center text-xs font-semibold">
                                {control.zone ? (
                                  <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{control.zone}</span>
                                ) : (
                                  <span className="text-slate-400 italic">General</span>
                                )}
                              </td>
                              <td className="p-4 text-emerald-600 font-bold text-center">
                                {control.average_size} mm
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => deleteSizeControl(control.id)}
                                  className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Esborrar"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
