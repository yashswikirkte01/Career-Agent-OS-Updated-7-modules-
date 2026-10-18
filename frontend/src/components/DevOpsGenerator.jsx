// frontend/src/components/DevOpsGenerator.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { Terminal, Loader2, AlertCircle, Copy, Download, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { API_BASE } from '../context/AppContext';

const DevOpsGenerator = () => {
  const [username, setUsername] = useState('');
  const [repo, setRepo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tests'); // tests, cicd, docker
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!username || !repo) {
      setError('Please provide both a GitHub username and repository name.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE}/api/generate-devops`, {
        username: username.trim(),
        repo: repo.trim()
      });
      setResult(response.data);
      setActiveTab('tests');
    } catch (err) {
      console.error(err);
      // Try to get the specific backend error, fallback to the generic one
      const backendError = err.response?.data?.detail;
      setError(backendError || 'Generation failed. Check the repository details and backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const getActiveCodeAndLanguage = () => {
    if (!result) return { code: '', language: 'text', filename: '' };
    switch (activeTab) {
      case 'tests': return { code: result.unit_test_code, language: result.language_detected.toLowerCase() === 'python' ? 'python' : 'javascript', filename: result.unit_test_file_name };
      case 'cicd': return { code: result.ci_cd_code, language: 'yaml', filename: result.ci_cd_file_name };
      case 'docker': return { code: result.dockerfile_code, language: 'docker', filename: 'Dockerfile' };
      default: return { code: '', language: 'text', filename: '' };
    }
  };

  const handleCopy = () => {
    const { code } = getActiveCodeAndLanguage();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const { code, filename } = getActiveCodeAndLanguage();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
          DevOps Kit Generator
        </h1>
        <p className="text-slate-400 text-lg">Auto-generate tests, CI/CD, and Dockerfiles for your repository.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">GitHub Username</label>
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. torvalds"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Repository Name</label>
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="e.g. linux"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !username || !repo}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                loading || !username || !repo
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20'
              }`}
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Code...</> : <><Terminal className="w-5 h-5" /> Generate Specs</>}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          {result && (
            <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl">
              <p className="text-emerald-400 text-sm font-bold uppercase mb-1">Language Detected</p>
              <p className="text-2xl font-black text-white">{result.language_detected}</p>
            </div>
          )}
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8">
          {!result ? (
            <div className="h-full bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 min-h-[500px]">
              <Terminal className="w-16 h-16 opacity-20 mb-4" />
              <p>Generated configuration files will appear here.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[500px]">

              {/* File Tabs */}
              <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800">
                <TabButton active={activeTab === 'tests'} onClick={() => setActiveTab('tests')} icon="🧪" label="Unit Tests" />
                <TabButton active={activeTab === 'cicd'} onClick={() => setActiveTab('cicd')} icon="⚙️" label="CI/CD Action" />
                <TabButton active={activeTab === 'docker'} onClick={() => setActiveTab('docker')} icon="🐳" label="Dockerfile" />
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-mono">{getActiveCodeAndLanguage().filename}</span>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Copy to clipboard">
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={handleDownload} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Download file">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Code Display */}
              <div className="flex-1 overflow-auto bg-[#1e1e1e]">
                <SyntaxHighlighter
                  language={getActiveCodeAndLanguage().language}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent' }}
                  showLineNumbers
                >
                  {getActiveCodeAndLanguage().code}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
      active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
    }`}
  >
    <span>{icon}</span> {label}
  </button>
);

export default DevOpsGenerator;