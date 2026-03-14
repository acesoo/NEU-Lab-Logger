'use client';
import { useState } from 'react';
import { useLogs }  from '../hooks/useLogs';

function buildWeeklyData(logs) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('en-PH', { weekday: 'short' }),
      date:  d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
      v: 0,
    });
  }
  logs.forEach(l => {
    const slot = days.find(d => d.date === l.date);
    if (slot) slot.v++;
  });
  return days;
}

function buildMonthlyData(logs) {
  const weeks = [
    { label: 'Wk 1', v: 0 }, { label: 'Wk 2', v: 0 },
    { label: 'Wk 3', v: 0 }, { label: 'Wk 4', v: 0 },
  ];
  const now = new Date();
  logs.forEach(l => {
    if (!l.rawTimestamp) return;
    const d = l.rawTimestamp.toDate ? l.rawTimestamp.toDate() : new Date(l.rawTimestamp);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      const week = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
      weeks[week].v++;
    }
  });
  return weeks;
}

function buildDailyData(logs) {
  const todayStr = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const hours = Array.from({ length: 12 }, (_, i) => ({
    label: `${(i + 7) % 12 || 12}${i + 7 < 12 ? 'a' : 'p'}`,
    v: 0,
  }));
  logs.filter(l => l.date === todayStr).forEach(l => {
    if (!l.rawTimestamp) return;
    const d = l.rawTimestamp.toDate ? l.rawTimestamp.toDate() : new Date(l.rawTimestamp);
    const h = d.getHours();
    if (h >= 7 && h < 19) hours[h - 7].v++;
  });
  return hours;
}

export default function ReportsPage() {
  const { logs, loading } = useLogs();
  const [range, setRange] = useState('weekly');

  const roomCounts = {};
  logs.forEach(l => { roomCounts[l.roomId] = (roomCounts[l.roomId] || 0) + 1; });
  const maxRoom = Math.max(...Object.values(roomCounts), 1);

  const profCounts = {};
  logs.forEach(l => { profCounts[l.profName] = (profCounts[l.profName] || 0) + 1; });
  const topProfs = Object.entries(profCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const chartData = range === 'weekly'
    ? buildWeeklyData(logs)
    : range === 'monthly'
    ? buildMonthlyData(logs)
    : buildDailyData(logs);

  const maxChart  = Math.max(...chartData.map(d => d.v), 1);
  const hasData   = chartData.some(d => d.v > 0);

  const chartTitle = range === 'daily' ? "Today's Hourly Activity"
    : range === 'weekly' ? 'Last 7 Days'
    : 'This Month by Week';

  const exportCSV = () => {
    const header = 'Room ID,Total Sessions';
    const rows   = Object.entries(roomCounts).map(([r, c]) => `${r},${c}`);
    const blob   = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const a      = document.createElement('a');
    a.href       = URL.createObjectURL(blob);
    a.download   = 'neu_lab_report.csv';
    a.click();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-display font-bold text-gray-800">Report Range</h3>
          <p className="text-gray-400 text-xs mt-0.5">Filter data by time period</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map(r => (
              <button key={r} onClick={() => setRange(r)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
                style={{ background: range === r ? '#1a6b42' : 'transparent',
                         borderColor: '#1a6b42', color: range === r ? 'white' : '#1a6b42' }}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: '#1a6b42', boxShadow: '0 3px 8px rgba(26,107,66,0.25)' }}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Room utilization bars */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="font-display font-bold text-gray-800">Room Utilization</h3>
            <p className="text-gray-400 text-xs mt-0.5">Total sessions per lab</p>
          </div>
          <div className="p-6 space-y-4">
            {Object.keys(roomCounts).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
            ) : Object.entries(roomCounts).map(([room, count]) => (
              <div key={room}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-mono text-xs font-semibold" style={{ color: '#1a6b42' }}>{room}</span>
                  <span className="text-xs text-gray-400">{count} sessions</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                       style={{ width: `${(count / maxRoom) * 100}%`, background: 'linear-gradient(90deg, #1a6b42, #2ea864)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top professors */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="font-display font-bold text-gray-800">Top Professors</h3>
            <p className="text-gray-400 text-xs mt-0.5">By number of sessions</p>
          </div>
          <div>
            {topProfs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-16">No data yet</p>
            ) : topProfs.map(([name, count], i) => {
              const medalColors = ['#c9a227','#9ca3af','#cd7f32'];
              return (
                <div key={name} className="flex items-center px-6 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0"
                       style={{ background: medalColors[i] || '#e5e7eb', color: i < 3 ? 'white' : '#6b7280' }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 text-sm font-semibold text-gray-800">{name}</div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#e8f5ee', color: '#1a6b42' }}>
                    {count} sessions
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Trend chart — DYNAMIC */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-gray-800">
              {range === 'daily' ? "Today's Activity" : range === 'weekly' ? 'Weekly Trend' : 'Monthly Trend'}
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              {chartTitle} · {logs.filter(l => {
                if (range === 'daily') {
                  const todayStr = new Date().toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric'});
                  return l.date === todayStr;
                }
                return true;
              }).length} check-ins shown
            </p>
          </div>
          {!hasData && (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">No data for this period</span>
          )}
        </div>
        <div className="px-6 pb-6 pt-4">
          <div className="flex items-end gap-3" style={{ height: 140 }}>
            {chartData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                {d.v > 0 && <span className="text-xs text-gray-400 mb-1">{d.v}</span>}
                <div className="chart-bar w-full transition-all duration-500"
                     style={{ height: `${Math.max((d.v / maxChart) * 100, d.v > 0 ? 3 : 0)}%`,
                              opacity: d.v === 0 ? 0.15 : 1 }} />
                <span className="text-xs text-gray-400 mt-2">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
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
