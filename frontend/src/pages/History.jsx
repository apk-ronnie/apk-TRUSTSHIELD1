import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  History as HistoryIcon,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Lock,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/analysis/history?limit=100');
      setHistory(response.data?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch scan history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredItems = history.filter((item) => {
    // Filter by threat classification
    if (filterType === 'HIGH' && item.threatScore < 70) return false;
    if (filterType === 'MEDIUM' && (item.threatScore < 40 || item.threatScore >= 70)) return false;
    if (filterType === 'SAFE' && item.threatScore >= 40) return false;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchType = item.threatType?.toLowerCase().includes(term);
      const matchId = item._id?.toLowerCase().includes(term);
      return matchType || matchId;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Compliance & Audit Trail
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Security Analysis Audit Log
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete record of organizational threat telemetry and privacy redaction events.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-xs font-medium self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-start space-x-3 text-xs text-indigo-200">
        <Lock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">
            Strict Zero-Retention Privacy Guarantee
          </p>
          <p className="text-slate-300 leading-relaxed">
            In compliance with SOC2, GDPR, and HIPAA data minimization standards, TrustShield AI never stores raw input texts or unredacted PII in our database. Only encrypted anonymized metrics, classifications, and processing metadata are retained.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by threat class or ID..."
            className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('ALL')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              filterType === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            All ({history.length})
          </button>
          <button
            onClick={() => setFilterType('HIGH')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              filterType === 'HIGH'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-rose-400'
            }`}
          >
            High Risk (&gt;=70)
          </button>
          <button
            onClick={() => setFilterType('MEDIUM')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              filterType === 'MEDIUM'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-amber-400'
            }`}
          >
            Suspicious (40-69)
          </button>
          <button
            onClick={() => setFilterType('SAFE')}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              filterType === 'SAFE'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:text-emerald-400'
            }`}
          >
            Safe (&lt;40)
          </button>
        </div>

      </div>

      {/* History Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading audit log...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <HistoryIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-300">No matching audit events</h4>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-4">Audit ID</th>
                  <th className="py-3.5 px-4">Classification</th>
                  <th className="py-3.5 px-4">Threat Score</th>
                  <th className="py-3.5 px-4">PII Neutralized</th>
                  <th className="py-3.5 px-4">Payload Size</th>
                  <th className="py-3.5 px-4">Execution Latency</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredItems.map((item) => {
                  const isHigh = item.threatScore >= 70;
                  const isMed = item.threatScore >= 40 && item.threatScore < 70;

                  return (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-400">
                        {item._id.substring(item._id.length - 8)}
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-200">
                        {item.threatType}
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
                          {item.threatScore} / 100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-cyan-400 font-sans">
                        {item.piiEntitiesCount || 0} entities
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.originalLength} bytes
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.processingTimeMs || 0} ms
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-sans">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default History;
