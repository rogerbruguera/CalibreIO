import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Fields from './components/Fields';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to recover session
    const storedUser = localStorage.getItem('calibre_user');
    const token = localStorage.getItem('calibre_token');

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('calibre_user');
        localStorage.removeItem('calibre_token');
      }
    } else {
      // if token doesn't exist, purge user just in case
      localStorage.removeItem('calibre_user');
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (_token: string, userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('calibre_token');
    localStorage.removeItem('calibre_user');
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50">Carregant...</div>;

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Navigate to="/camps" replace />} />
            <Route path="/camps" element={<Fields />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/camps" replace />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
}

export default App;
