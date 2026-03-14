'use client';
import { useLogs }  from '../hooks/useLogs';
import { useUsers } from '../hooks/useUsers';

// Build last-7-days data from real logs
function buildWeeklyData(logs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('en-PH', { weekday: 'short' }),
      date:  d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      v:     0,
    });
  }
  logs.forEach(l => {
    const slot = days.find(d => d.date === l.date);
    if (slot) slot.v++;
  });
  return days;
}

export default function Dashboard() {
  const { logs,  loading: logsLoading  } = useLogs();
  const { users, loading: usersLoading } = useUsers();

  const todayStr   = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const todayLogs  = logs.filter(l => l.date === todayStr);
  const activeLabs = [...new Set(logs.filter(l => l.status === 'active').map(l => l.roomId))].length;
  const blocked    = users.filter(u => u.isBlocked).length;

  const roomCounts = {};
  logs.forEach(l => { roomCounts[l.roomId] = (roomCounts[l.roomId] || 0) + 1; });
  const mostUsed = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const maxRoom  = Math.max(...Object.values(roomCounts), 1);

  const weeklyData = buildWeeklyData(logs);
  const maxWeekly  = Math.max(...weeklyData.map(d => d.v), 1);

  if (logsLoading || usersLoading) return <Spinner />;

  return (
    <div className="space-y-5">

      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard icon="📋" label="Total Logs Today"  value={todayLogs.length} sub={`${logs.length} all-time`}   color="green" />
        <KpiCard icon="🧪" label="Active Labs Now"   value={activeLabs}       sub="Live count"                  color="blue"  />
        <KpiCard icon="🏆" label="Most Used Room"    value={mostUsed}         sub={`${roomCounts[mostUsed]||0} sessions`} color="gold" small />
        <KpiCard icon="🚫" label="Blocked Users"     value={blocked}          sub={`of ${users.length} professors`} color="red" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly Activity — DYNAMIC */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="font-display font-bold text-gray-800">Weekly Activity</h3>
            <p className="text-gray-400 text-xs mt-0.5">Check-ins per day (last 7 days)</p>
          </div>
          <div className="px-6 pb-6 pt-4">
            {weeklyData.every(d => d.v === 0) ? (
              <div className="flex items-center justify-center h-28 text-gray-400 text-sm">No activity this week yet</div>
            ) : (
              <div className="flex items-end gap-2" style={{ height: 110 }}>
                {weeklyData.map((d, i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    {d.v > 0 && <span className="text-[10px] text-gray-400 mb-1">{d.v}</span>}
                    <div className="chart-bar w-full" style={{ height: `${Math.max((d.v / maxWeekly) * 100, d.v > 0 ? 4 : 0)}%` }} />
                    <span className="text-[10px] text-gray-400 mt-1.5">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Room Utilization */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="font-display font-bold text-gray-800">Room Utilization</h3>
            <p className="text-gray-400 text-xs mt-0.5">Total sessions per room</p>
          </div>
          <div className="px-6 pb-6 pt-4">
            {Object.keys(roomCounts).length === 0 ? (
              <div className="flex items-center justify-center h-28 text-gray-400 text-sm">No room data yet</div>
            ) : (
              <div className="flex items-end gap-2" style={{ height: 110 }}>
                {Object.entries(roomCounts).slice(0, 6).map(([room, count], i) => (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <span className="text-[10px] text-gray-400 mb-1">{count}</span>
                    <div className="chart-bar gold w-full" style={{ height: `${(count / maxRoom) * 100}%` }} />
                    <span className="text-[10px] text-gray-400 mt-1.5">{room.replace('-', '')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent logs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="font-display font-bold text-gray-800">Recent Activity</h3>
          <p className="text-gray-400 text-xs mt-0.5">Latest lab check-ins</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-100">
                {['Professor','Room','Date','Check-In','Status'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 5).map(l => (
                <tr key={l.id} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="font-semibold text-gray-800">{l.profName}</div>
                    <div className="text-xs text-gray-400">{l.profEmail}</div>
                  </td>
                  <td className="px-6 py-3 font-mono font-semibold text-xs" style={{ color: '#1a6b42' }}>{l.roomId}</td>
                  <td className="px-6 py-3 text-gray-500 text-xs">{l.date}</td>
                  <td className="px-6 py-3 font-mono text-xs text-gray-600">{l.startTime}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: l.status === 'active' ? '#e8f5ee' : '#f3f4f6',
                                   color:      l.status === 'active' ? '#1a6b42' : '#6b7280' }}>
                      {l.status === 'active' ? '🟢 Active' : '⚪ Checked Out'}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">No logs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color, small }) {
  const colors = {
    green: { bg: '#e8f5ee', text: '#1a6b42' },
    blue:  { bg: '#eff6ff', text: '#1e40af' },
    gold:  { bg: '#fdf8e8', text: '#92720f' },
    red:   { bg: '#fef2f2', text: '#b91c1c' },
  };
  const c = colors[color];
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3" style={{ background: c.bg }}>{icon}</div>
      <div className="font-display font-bold text-gray-900 mb-1" style={{ fontSize: small ? 22 : 34, lineHeight: 1 }}>{value}</div>
      <div className="text-gray-500 text-xs font-medium mb-1">{label}</div>
      <div className="text-xs font-semibold" style={{ color: c.text }}>{sub}</div>
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
