// frontend/src/components/RepoAnalyzer.jsx
import React, { useState } from 'react';
import axios from 'axios';
// import { Github, Loader2, AlertCircle, Activity, Layout, GitCommit, Settings, CheckCircle } from 'lucide-react';
import { Github, Loader2, AlertCircle, Activity, Layout, GitCommit, Settings, CheckCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE } from '../context/AppContext';

const RepoAnalyzer = () => {
  const [username, setUsername] = useState('');
  const [repo, setRepo] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!username || !repo) {
      setError('Please provide both a GitHub username and repository name.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE}/api/analyze-repo`, {
        username: username.trim(),
        repo: repo.trim(),
        job_description: jd.trim() || null
      });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      // Try to get the specific backend error, fallback to the generic one
      const backendError = err.response?.data?.detail;
      setError(backendError || 'Analysis failed. Check the repository details and backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          GitHub Repo Analyzer
        </h1>
        <p className="text-slate-400 text-lg">Evaluate your repository's readiness for job applications and portfolios.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Inputs */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">GitHub Username</label>
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="e.g. torvalds"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Repository Name</label>
              <input
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="e.g. linux"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Job Description (Optional)</label>
              <textarea
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                placeholder="Paste the target JD to get tailored repository improvement suggestions..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !username || !repo}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                loading || !username || !repo
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Github className="w-5 h-5" /> Analyze Repo</>}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-2">
          {!result ? (
            <div className="h-full bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
              <Github className="w-16 h-16 opacity-20 mb-4" />
              <p>Your repository analysis will appear here.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

              <div className="flex flex-col md:flex-row gap-6">
                {/* Overall Score */}
                <div className="flex-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex items-center justify-between">
                  <div>
                    <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Overall Readiness</h2>
                    <div className="text-5xl font-black text-white">{result.overall_score}<span className="text-2xl text-slate-500">/100</span></div>
                  </div>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl font-bold ${
                    result.letter_grade === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                    result.letter_grade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                    result.letter_grade === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {result.letter_grade}
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="flex-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                  <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-3">Detected Tech Stack</h2>
                  <div className="flex flex-wrap gap-2">
                    {result.tech_stack.map((tech, i) => (
                      <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-sm">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard icon={FileText} title="README Quality" score={result.category_scores.readme_quality} />
                <MetricCard icon={Layout} title="Repo Structure" score={result.category_scores.repository_structure} />
                <MetricCard icon={GitCommit} title="Commit Health" score={result.category_scores.commit_health} />
                <MetricCard icon={Settings} title="DevOps Readiness" score={result.category_scores.devops_readiness} />
                <MetricCard icon={CheckCircle} title="Code Quality" score={result.category_scores.code_quality} />
              </div>

              {/* Improvements */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" /> Actionable Improvements
                </h3>
                <ul className="space-y-3">
                  {result.improvements.map((item, i) => (
                    <li key={i} className="flex gap-3 text-slate-300 text-sm leading-relaxed p-3 bg-slate-800/50 rounded-xl">
                      <span className="text-blue-400 font-bold">{i + 1}.</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, title, score }) => (
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center text-center">
    <Icon className="w-6 h-6 text-slate-500 mb-2" />
    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{title}</span>
    <span className={`text-xl font-black ${score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
      {score}%
    </span>
  </div>
);

export default RepoAnalyzer;