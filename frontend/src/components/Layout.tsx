import React, { useState } from 'react';
import { Target, MapPin, BarChart3, Menu, LogOut, Leaf, ShieldAlert } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
    user: { id: string, name: string, role: string, email: string } | null;
    onLogout: () => void;
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { path: '/camps', label: 'Camps', icon: MapPin },
        { path: '/dashboard', label: 'Gràfics', icon: BarChart3, adminOnly: true },
        { path: '/admin', label: 'Administració', icon: ShieldAlert, adminOnly: true },
    ];

    const filteredNavItems = navItems.filter(item => {
        if (item.adminOnly && user?.role !== 'admin') return false;
        return true;
    });

    if (!user) return <>{children}</>;

    return (
        <div className="flex h-screen h-[100dvh] bg-slate-50 overflow-hidden text-slate-900 pb-[env(safe-area-inset-bottom)]">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Tablet & Desktop) */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white transform transition-transform duration-300 ease-in-out border-r border-slate-800/50
        lg:translate-x-0 lg:static lg:inset-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex items-center gap-3 px-8 h-20 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-sm">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20">
                        <Leaf className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        CalibreIO
                    </span>
                </div>

                <nav className="mt-6 px-4 space-y-1 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-none">
                    {filteredNavItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex items-center w-full px-4 py-3 text-left rounded-xl transition-all duration-200 group relative ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                <span className="ml-3 text-sm transition-transform duration-200 group-hover:translate-x-1">{item.label}</span>
                                {isActive && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="absolute bottom-6 left-4 right-4 space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-md shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white ring-2 ring-emerald-500/20 border-2 border-slate-800/50 bg-slate-800">
                                <span className="font-bold text-lg">{user.email.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate" title={user.email}>{user.email.split('@')[0]}</p>
                                <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">{user.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-slate-800 active:scale-95"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Tancar Sessió
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="flex items-center justify-between p-4 lg:px-8 h-20 bg-white/70 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-2 lg:hidden">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20">
                                <Leaf className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-tight text-slate-900">CalibreIO</span>
                        </div>
                        <h1 className="hidden lg:block text-2xl font-bold text-slate-800 capitalize">
                            {filteredNavItems.find(i => location.pathname.startsWith(i.path))?.label || 'Inici'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center bg-slate-100 rounded-full px-1.5 py-1 text-slate-500 text-xs font-bold ring-1 ring-slate-200">
                            <span className="px-2 py-0.5 rounded-full bg-white shadow-sm ring-1 ring-slate-200 text-emerald-500 uppercase tracking-wider">
                                {user.role}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-auto bg-slate-50 px-4 py-6 md:px-8 md:py-8 lg:pb-12 scroll-smooth pb-32 lg:pb-8">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </div>

                {/* Bottom Navigation (Mobile Only) */}
                <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 px-2 py-2 flex items-center justify-around lg:hidden pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                    {filteredNavItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 relative ${isActive ? 'text-emerald-500 scale-110' : 'text-slate-400 active:scale-95'}`}
                            >
                                <item.icon className={`w-6 h-6 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : ''}`} />
                                <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
                                {isActive && (
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </main>
        </div>
    );
}
