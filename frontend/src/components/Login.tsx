import React, { useState } from 'react';
import { Leaf, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import api from '../api';

interface LoginProps {
    onLoginSuccess: (token: string, user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;

            // Save globally
            localStorage.setItem('calibre_token', token);
            localStorage.setItem('calibre_user', JSON.stringify(user));

            onLoginSuccess(token, user);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al iniciar sessió');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590838843997-f018d96078e4?auto=format&fit=crop&q=80&w=2000')" }}>
            {/* Overlay to darken background image just a bit for contrast */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Leaf className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
                    Calibre<span className="text-emerald-400">IO</span>
                </h2>
                <p className="mt-2 text-center text-sm text-slate-300">
                    Plataforma de Control de Calibres per a Socis
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white/95 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700">Usuari</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 px-3 py-3 border border-slate-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-slate-50/50"
                                    placeholder="Ex: pere"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700">Contrasenya</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-slate-50/50"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? 'Iniciant...' : 'Iniciar Sessió'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
