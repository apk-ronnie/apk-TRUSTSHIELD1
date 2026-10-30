import React, { useState } from 'react';
import api from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  FileText,
  Lock,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';

// Preset sample communications for testing
const SAMPLE_TEMPLATES = [
  {
    title: 'Phishing: Urgent Wire Request',
    text: `From: CEO Executive Office <exec-board@secure-acme-corp.co>
To: sarah.jenkins@acme-corp.com
Subject: URGENT: Wire Transfer Authorization Required Before 5 PM

Sarah,

I am in confidential acquisition meetings all afternoon. We urgently need to wire $84,500 to our strategic legal partner to avoid closing penalties.
Wire Routing details:
Bank: Global Commerce First
Account: 9482-1049-5501
Routing: 021000089

Please process immediately from our primary treasury account. Do not call my cell as I am in executive negotiations, email me the confirmation wire slip immediately.

Best regards,
Michael Vance
Chief Executive Officer
Direct Cell: +1 (555) 392-8819`
  },
  {
    title: 'Support Ticket: PII Exposure',
    text: `Customer Support Escalation #88491
Customer: Jonathan R. Hayes
Email: j.hayes@outlook.com
Phone: (415) 890-3321
SSN: 482-91-8840

Issue:
"Hello support, I was billed twice for my subscription renewals. My credit card on file ends in 9102. Can you please verify my identity with my Social Security Number 482-91-8840 and update my billing address at 742 Evergreen Terrace, Springfield? Please send the confirmation to my personal email j.hayes@outlook.com or call me at 415-890-3321."`
  },
  {
    title: 'Safe: Internal Team Standup Note',
    text: `Subject: Engineering Sprint Review & Retro - Thursday 10 AM

Hey team,

Just a friendly reminder that our sprint retro is scheduled for tomorrow at 10:00 AM in Conference Room B and on Google Meet.
Please update your Jira tickets and review the deployment checklist for v2.4 before the meeting.

Looking forward to hearing everyone's thoughts on the new architecture migration!

Cheers,
DevOps Team`
  }
];

const Scanner = () => {
  const [inputText, setInputText] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('redacted'); // 'redacted' | 'original'

  const handleScan = async (e) => {
    e?.preventDefault();
    if (!inputText || inputText.trim().length < 5) {
      setError('Please enter at least 5 characters to run the AI security scanner.');
      return;
    }

    try {
      setIsScanning(true);
      setError('');
      setResult(null);

      const response = await api.post('/analysis/scan', { text: inputText });
      setResult(response.data);
      setActiveTab('redacted');
    } catch (err) {
      setError(err.message || 'Failed to complete analysis. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyRedacted = async () => {
    if (!result?.redactedText) return;
    try {
      await navigator.clipboard.writeText(result.redactedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const getScoreTheme = (score) => {
    if (score >= 70) {
      return {
        badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        barBg: 'bg-rose-500',
        textColor: 'text-rose-400',
        label: 'CRITICAL THREAT',
        Icon: ShieldAlert
      };
    }
    if (score >= 40) {
      return {
        badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        barBg: 'bg-amber-500',
        textColor: 'text-amber-400',
        label: 'SUSPICIOUS / ELEVATED RISK',
        Icon: AlertTriangle
      };
    }
    return {
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      barBg: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      label: 'SAFE & VERIFIED',
      Icon: ShieldCheck
    };
  };

  const scoreTheme = result ? getScoreTheme(result.threatScore) : null;
  const ScoreIcon = scoreTheme?.Icon || Shield;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Gemini Powered
            </span>
            <span className="text-xs text-slate-500">Dual-Pass Security + Contextual Privacy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            Threat Scanner & PII Redactor
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Inspect emails, support tickets, or chat logs for social engineering threats while automatically removing personal identifiers before storage or distribution.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Original & redacted texts are kept in memory only — never stored.</span>
        </div>
      </div>

      {/* Preset Quick Load Samples */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Quick Test Templates
        </label>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_TEMPLATES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(sample.text);
                setResult(null);
                setError('');
              }}
              className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition flex items-center space-x-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>{sample.title}</span>
            </button>
          ))}
          {inputText && (
            <button
              type="button"
              onClick={() => {
                setInputText('');
                setResult(null);
                setError('');
              }}
              className="text-xs px-3 py-2 rounded-xl bg-slate-900/50 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition"
            >
              Clear Text
            </button>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl relative">
        <form onSubmit={handleScan} className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <span>Suspicious Text / Email Message</span>
            </label>
            <span className="text-xs font-mono text-slate-500">
              {inputText.length.toLocaleString()} characters
            </span>
          </div>

          <textarea
            rows={8}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste raw email contents, customer correspondence, or text here to detect phishing threats and redact sensitive PII (names, emails, phone numbers, SSNs)..."
            className="w-full bg-[#0B0F19] border border-slate-700/80 rounded-xl p-4 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y leading-relaxed"
          />

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Contextual AI preserves message grammar while masking PII entities.</span>
            </div>

            <button
              type="submit"
              disabled={isScanning || !inputText.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Scanning & Redacting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  <span>Scan & Redact</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6 pt-4 animate-in fade-in duration-300">
          
          {/* Top Threat Metric Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Threat Score Card */}
            <div className={`p-6 rounded-2xl border ${scoreTheme.badgeBg} flex flex-col justify-between`}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider opacity-80">
                  Threat Evaluation
                </span>
                <ScoreIcon className={`w-6 h-6 ${scoreTheme.textColor}`} />
              </div>

              <div className="my-4">
                <div className="flex items-baseline space-x-2">
                  <span className={`text-4xl sm:text-5xl font-extrabold ${scoreTheme.textColor}`}>
                    {result.threatScore}
                  </span>
                  <span className="text-sm font-semibold opacity-70">/ 100</span>
                </div>
                <p className={`text-xs font-bold tracking-wide mt-1 ${scoreTheme.textColor}`}>
                  {scoreTheme.label}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                <div
                  className={`h-full ${scoreTheme.barBg} transition-all duration-700 ease-out`}
                  style={{ width: `${result.threatScore}%` }}
                />
              </div>
            </div>

            {/* Threat Classification */}
            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Primary Threat Class
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-3">
                  {result.threatType}
                </h3>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>PII Entities Neutralized:</span>
                <span className="font-mono font-bold text-cyan-400 px-2 py-0.5 bg-cyan-500/10 rounded-md border border-cyan-500/20">
                  {result.metrics?.piiEntitiesCount ?? 0}
                </span>
              </div>
            </div>

            {/* Performance & Execution */}
            <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Latency & Metrics
                </span>
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Processing Time:</span>
                    <span className="font-mono text-slate-200">
                      {result.metrics?.processingTimeMs} ms
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Original Length:</span>
                    <span className="font-mono text-slate-200">
                      {result.metrics?.originalLength} chars
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Redacted Length:</span>
                    <span className="font-mono text-slate-200">
                      {result.metrics?.redactedLength} chars
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Database Storage Verified</span>
              </div>
            </div>

          </div>

          {/* AI Reasoning / Explanation */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Threat Reasoning & Intelligence Summary</span>
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed bg-[#0B0F19] p-4 rounded-xl border border-slate-800">
              {result.explanation}
            </p>
          </div>

          {/* Redacted Output Display */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              
              {/* View Tabs */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('redacted')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'redacted'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                >
                  Safe Redacted View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('original')}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'original'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                  }`}
                >
                  Original Input View
                </button>
              </div>

              {/* Copy Button */}
              {activeTab === 'redacted' && (
                <button
                  type="button"
                  onClick={handleCopyRedacted}
                  className="inline-flex items-center space-x-1.5 text-xs px-3.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-cyan-300 border border-indigo-500/30 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Redacted Text</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Display Box */}
            <div className="relative">
              <pre className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl p-4 text-slate-200 text-sm font-mono whitespace-pre-wrap break-words leading-relaxed overflow-x-auto min-h-[160px]">
                {activeTab === 'redacted' ? result.redactedText : inputText}
              </pre>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>All detected names, emails, phone numbers, and SSNs masked with [REDACTED].</span>
              <span className="font-mono">Status: Ready for safe storage or sharing</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Scanner;

