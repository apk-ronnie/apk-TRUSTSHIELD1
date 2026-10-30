import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  Scan,
  Users,
  Activity,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Lock
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

// Color mappings for threat types in charts
const THREAT_COLORS = {
  'Safe': '#10B981', // emerald-500
  'Phishing': '#EF4444', // red-500
  'Social Engineering': '#F59E0B', // amber-500
  'Data Extortion': '#DC2626', // red-600
  'Credential Harvesting': '#E11D48', // rose-600
  'Malware Link': '#9333EA', // purple-600
  'Sensitive Data Exposure': '#3B82F6', // blue-500
  'Unknown Threat': '#64748B' // slate-500
};

const DEFAULT_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#6366F1', '#06B6D4', '#EC4899'];

const Dashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/analysis/metrics');
      setMetrics(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch threat intelligence metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-sm text-slate-400">Loading Threat Intelligence Dashboard...</p>
      </div>
    );
  }

  const hasData = metrics && metrics.totalScans > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Welcome & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Live Security Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Security Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time analysis metrics, phishing threat classifications, and contextual PII redaction audit logs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchMetrics}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/scanner"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition duration-150 active:scale-95"
          >
            <Scan className="w-4 h-4" />
            <span>Scan New Message</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Scans */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Scanned
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">
              {metrics?.totalScans ?? 0}
            </span>
            <p className="text-xs text-slate-400 mt-1">Communications inspected</p>
          </div>
        </div>

        {/* Average Threat Score */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avg Threat Score
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-3xl font-extrabold ${
                (metrics?.averageScore ?? 0) >= 70
                  ? 'text-rose-400'
                  : (metrics?.averageScore ?? 0) >= 40
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {metrics?.averageScore ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-semibold">/ 100</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Weighted risk rating</p>
          </div>
        </div>

        {/* High Risk Interceptions */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              High Risk Attacks
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-rose-400">
              {metrics?.highRiskCount ?? 0}
            </span>
            <p className="text-xs text-slate-400 mt-1">Score &gt;= 70 flagged</p>
          </div>
        </div>

        {/* PII Redacted Total */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              PII Redacted
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-cyan-400">
              {metrics?.piiRedactedTotal ?? 0}
            </span>
            <p className="text-xs text-slate-400 mt-1">Identifiers masked</p>
          </div>
        </div>

      </div>

      {/* Visual Charts Section */}
      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Pie Chart: Threat Types Breakdown */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Threat Classification Breakdown</span>
                </h3>
                <span className="text-xs text-slate-400">All Historical Scans</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Distribution of threat types detected across analyzed textual communications.
              </p>
            </div>

            <div className="h-[280px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.threatTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metrics.threatTypeBreakdown.map((entry, index) => {
                      const color = THREAT_COLORS[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                      return <Cell key={`cell-${index}`} fill={color} stroke="#111827" strokeWidth={2} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0F19',
                      borderColor: '#1F2937',
                      borderRadius: '12px',
                      color: '#F1F5F9',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: '#F1F5F9' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line / Area Chart: Threat Scores Over Time */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Threat Severity Trend</span>
                </h3>
                <span className="text-xs text-slate-400">Recent Scans Timeline</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Chronological threat scores over recent document analyses.
              </p>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={metrics.timeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis
                    dataKey="index"
                    stroke="#64748B"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#64748B"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B0F19',
                      borderColor: '#1F2937',
                      borderRadius: '12px',
                      color: '#F1F5F9',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`Threat Score: ${val} / 100`]}
                    labelFormatter={(label) => `Scan #${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="threatScore"
                    stroke="#818CF8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#scoreGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : (
        /* Empty State */
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 mb-4">
            <Scan className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Threat Scans Yet</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
            Run your first threat analysis on a suspicious email, customer inquiry, or ticket to populate your real-time security dashboard.
          </p>
          <Link
            to="/scanner"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition"
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>Launch First Threat Scan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Recent Activity Table */}
      {hasData && metrics.recentScans?.length > 0 && (
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Recent Security Interceptions</h3>
              <p className="text-xs text-slate-400">Metadata audit trail (strictly anonymized)</p>
            </div>
            <Link
              to="/history"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">Threat Class</th>
                  <th className="py-3 px-4">Threat Score</th>
                  <th className="py-3 px-4">PII Redacted</th>
                  <th className="py-3 px-4">Original Length</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {metrics.recentScans.map((scan) => {
                  const isHigh = scan.threatScore >= 70;
                  const isMed = scan.threatScore >= 40 && scan.threatScore < 70;

                  return (
                    <tr key={scan.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-200">
                        <span className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: THREAT_COLORS[scan.threatType] || '#64748B'
                            }}
                          />
                          {scan.threatType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-xs border ${
                            isHigh
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : isMed
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {scan.threatScore} / 100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-cyan-400">
                        {scan.piiEntitiesCount} entities
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {scan.originalLength} chars
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-sans">
                        {new Date(scan.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;

