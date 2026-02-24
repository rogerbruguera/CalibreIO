import { useState, useEffect } from 'react';
import api from '../api';
import { Users, BookOpen, UserPlus, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface User {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

interface Variety {
    id: string;
    name: string;
}

interface Subvariety {
    id: string;
    variety_id: string;
    name: string;
}

export default function Admin() {
    const [activeTab, setActiveTab] = useState<'users' | 'catalog'>('users');
    const [loading, setLoading] = useState(false);

    // Users State
    const [users, setUsers] = useState<User[]>([]);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('producer');
    const [showPassword, setShowPassword] = useState(false);

    // Catalog State
    const [varieties, setVarieties] = useState<Variety[]>([]);
    const [subvarieties, setSubvarieties] = useState<Subvariety[]>([]);
    const [newVarietyName, setNewVarietyName] = useState('');
    const [newSubvarietyName, setNewSubvarietyName] = useState('');
    const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else {
            fetchCatalog();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            alert(err.response?.data?.error || 'Error carregant usuaris');
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalog = async () => {
        setLoading(true);
        try {
            const [varRes, subRes] = await Promise.all([
                api.get('/catalog/varieties'),
                api.get('/catalog/subvarieties')
            ]);
            setVarieties(varRes.data);
            setSubvarieties(subRes.data);
            if (varRes.data.length > 0 && !selectedVarietyId) {
                setSelectedVarietyId(varRes.data[0].id);
            }
        } catch (err: any) {
            console.error('Error fetching catalog:', err);
            alert('Error carregant catàleg');
        } finally {
            setLoading(false);
        }
    };

    // User Actions
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/users', { email: newUserEmail, password: newUserPassword, role: newUserRole });
            setNewUserEmail('');
            setNewUserPassword('');
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error en crear usuari');
        }
    };

    const handleDeleteUser = async (id: string, email: string) => {
        if (!confirm(`Segur que vols eliminar l'usuari ${email}? Es perdran els seus camps i controls asociats.`)) return;
        try {
            await api.delete(`/users/${id}`);
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error eliminant usuari');
        }
    };

    // Catalog Actions
    const handleCreateVariety = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/catalog/varieties', { name: newVarietyName });
            setNewVarietyName('');
            fetchCatalog();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error en crear varietat');
        }
    };

    const handleDeleteVariety = async (id: string) => {
        if (!confirm('Segur que vols eliminar aquesta varietat? Podria trencar camps existents.')) return;
        try {
            await api.delete(`/catalog/varieties/${id}`);
            fetchCatalog();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error eliminant varietat');
        }
    };

    const handleCreateSubvariety = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedVarietyId) return alert('Selecciona una varietat primer');
        try {
            await api.post('/catalog/subvarieties', { variety_id: selectedVarietyId, name: newSubvarietyName });
            setNewSubvarietyName('');
            fetchCatalog();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error en crear subvarietat');
        }
    };

    const handleDeleteSubvariety = async (id: string) => {
        if (!confirm('Segur que vols eliminar aquesta subvarietat?')) return;
        try {
            await api.delete(`/catalog/subvarieties/${id}`);
            fetchCatalog();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error eliminant subvarietat');
        }
    };

    const renderUsersTab = () => (
        <div className="space-y-6 animate-in fade-in">
            {/* Create User Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-600" />
                    Nou Usuari / Productor
                </h3>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Usuari</label>
                        <input
                            type="text"
                            required
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Ex: pere"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Contrasenya</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg pl-3 pr-10 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Rol</label>
                        <select
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                            <option value="producer">Productor (Socio)</option>
                            <option value="admin">Administrador (Tècnic)</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 transition"
                    >
                        Crear Usuari
                    </button>
                </form>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Usuari</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Data de registre</th>
                            <th className="px-6 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                        {u.role === 'admin' ? 'Tècnic Admin' : 'Productor'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                    {new Date(u.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <button
                                        onClick={() => handleDeleteUser(u.id, u.email)}
                                        className="text-slate-400 hover:text-red-600 transition-colors p-2"
                                        title="Eliminar Usuari"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCatalogTab = () => {
        const currentSubvarieties = subvarieties.filter(s => s.variety_id === selectedVarietyId);

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
                {/* Varieties Column */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <BookOpen className="w-5 h-5 text-emerald-600" />
                        1. Llista de Varietats (Genèric)
                    </h3>

                    <form onSubmit={handleCreateVariety} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            required
                            placeholder="Ex: Golden, Gala, Fuji..."
                            value={newVarietyName}
                            onChange={(e) => setNewVarietyName(e.target.value)}
                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button type="submit" className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700">
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                        {varieties.map(v => (
                            <div
                                key={v.id}
                                onClick={() => setSelectedVarietyId(v.id)}
                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${selectedVarietyId === v.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}
                            >
                                <span className={`font-bold ${selectedVarietyId === v.id ? 'text-emerald-800' : 'text-slate-700'}`}>
                                    {v.name}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteVariety(v.id); }}
                                    className="text-slate-400 hover:text-red-500 p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Subvarieties Column */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        2. Subvarietats (Específic p/ {varieties.find(v => v.id === selectedVarietyId)?.name || '...'})
                    </h3>

                    {selectedVarietyId ? (
                        <>
                            <form onSubmit={handleCreateSubvariety} className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Smoothee, Brookfield, Fubrax..."
                                    value={newSubvarietyName}
                                    onChange={(e) => setNewSubvarietyName(e.target.value)}
                                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                                    <Plus className="w-5 h-5" />
                                </button>
                            </form>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                                {currentSubvarieties.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic text-center py-4">Cap subvarietat registrada.</p>
                                ) : (
                                    currentSubvarieties.map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                                            <span className="font-medium text-slate-700">{s.name}</span>
                                            <button
                                                onClick={() => handleDeleteSubvariety(s.id)}
                                                className="text-slate-400 hover:text-red-500 p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 italic text-center p-4">
                            Selecciona una varietat a l'esquerra per afegir o veure subvarietats.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        Panell d'Administració
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm">Gestiona els comptes d'usuaris i manté el catàleg mestre de la base de dades.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl max-w-sm">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Users className="w-4 h-4" /> Usuaris
                </button>
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm transition-all ${activeTab === 'catalog' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <BookOpen className="w-4 h-4" /> Catàleg Arbres
                </button>
            </div>

            {loading && <div className="text-center py-8 text-slate-400 animate-pulse">Carregant dades...</div>}

            {!loading && (
                <div>
                    {activeTab === 'users' ? renderUsersTab() : renderCatalogTab()}
                </div>
            )}

        </div>
    );
}
