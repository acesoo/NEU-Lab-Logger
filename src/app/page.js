'use client';
import { useAuth } from '../context/AuthContext';
import Landing    from '../components/Landing';
import AppShell   from '../components/AppShell';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #0a4a2e, #1a6b42)' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'linear-gradient(135deg, #c9a227, #f0c84a)' }}>
            <span className="font-display font-bold text-xl" style={{ color: '#0a4a2e' }}>N</span>
          </div>
          <p className="text-white/60 text-sm">Loading NEU Lab Logger…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Landing />;
  return <AppShell />;
}
