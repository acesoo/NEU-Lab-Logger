'use client';
import { useState }   from 'react';
import { useUsers }   from '../hooks/useUsers';

export default function UsersPage() {
  const { users, loading, toggleBlock } = useUsers();
  const [search,  setSearch]  = useState('');
  const [toast,   setToast]   = useState(null);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) ||
           u.email?.toLowerCase().includes(q) ||
           u.dept?.toLowerCase().includes(q);
  });

  const handleToggle = async (email, currentStatus) => {
    await toggleBlock(email, currentStatus);
    const msg = currentStatus ? `User unblocked successfully.` : `User has been blocked.`;
    setToast({ msg, type: currentStatus ? 'success' : 'error' });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-white px-5 py-4 rounded-xl shadow-2xl text-sm font-medium slide-up"
             style={{ borderLeft: `4px solid ${toast.type === 'error' ? '#dc2626' : '#1a6b42'}` }}>
          <span>{toast.type === 'error' ? '🚫' : '✅'}</span>
          <span className="text-gray-700">{toast.msg}</span>
        </div>
      )}

      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-display font-bold text-gray-800">Professor Accounts</h3>
          <p className="text-gray-400 text-xs mt-0.5">Manage access for {users.length} faculty members</p>
        </div>
        <div className="flex gap-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: '#e8f5ee', color: '#1a6b42' }}>
            ✅ {users.filter(u => !u.isBlocked).length} Active
          </span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: '#fef2f2', color: '#dc2626' }}>
            🚫 {users.filter(u => u.isBlocked).length} Blocked
          </span>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-100">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search professors…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-green-600"
            style={{ borderColor: '#e5e7eb', color: '#374151', background: '#f9fafb' }}
          />
        </div>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">No professors found</div>
        ) : filtered.map(u => (
          <div key={u.id}
               className="flex items-center px-6 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 mr-3"
                 style={{ background: u.isBlocked ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#2ea864,#1a6b42)' }}>
              {u.name?.[0] || '?'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800">{u.name}</div>
              <div className="text-xs text-gray-400">{u.email}{u.dept ? ` · ${u.dept}` : ''}</div>
            </div>

            {/* Role badge */}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full mr-4 hidden sm:inline-flex"
                  style={{ background: '#f3f4f6', color: '#6b7280' }}>
              {u.role}
            </span>

            {/* Status badge */}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full mr-4"
                  style={{
                    background: u.isBlocked ? '#fef2f2' : '#e8f5ee',
                    color:      u.isBlocked ? '#dc2626' : '#1a6b42',
                  }}>
              {u.isBlocked ? 'Blocked' : 'Active'}
            </span>

            {/* Toggle */}
            <button
              onClick={() => handleToggle(u.email, u.isBlocked)}
              className={`toggle-track ${u.isBlocked ? 'blocked' : 'on'}`}
              title={u.isBlocked ? 'Click to unblock' : 'Click to block'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-green-600 animate-spin" />
    </div>
  );
}
