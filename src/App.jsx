import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, AlertCircle, Zap, Clock, Code2 } from 'lucide-react';
import './App.css';

// Simple hash function for caching
const getHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
};

function App() {
  // Removed initial localStorage loading for code to clear it every new opening
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(() => localStorage.getItem('scd_language') || 'javascript');
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('scd_tab') || 'bugs');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // Persist state to localStorage on changes
  useEffect(() => {
    localStorage.setItem('scd_code', code);
  }, [code]);

  useEffect(() => {
    localStorage.setItem('scd_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('scd_tab', activeTab);
  }, [activeTab]);

  // ✅ ADDED: API URL from .env
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Please enter some code to analyze.');
      return;
    }

    const cacheKey = `cache_${language}_${getHash(code)}`;
    const savedResult = localStorage.getItem(cacheKey);
    
    if (savedResult) {
       console.log("Frontend: Cache hit!");
       setResults(JSON.parse(savedResult));
       setError('');
       return;
    }

    setLoading(true);
    setError('');
    
    try {
      // ✅ UPDATED: using API_URL and pure backend key system
      const response = await axios.post(`${API_URL}/analyze`, {
        code,
        language
      });
      
      setResults(response.data);
      // Cache the result
      localStorage.setItem(cacheKey, JSON.stringify(response.data));
      
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze code. Please ensure the backend is running and the API key is configured.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-container">
          <Code2 size={28} className="logo-icon" />
          <h1>Smart Code Debugger</h1>
        </div>
        <div className="header-actions">
           <div className="badge">AI-Powered Analysis</div>
        </div>
      </header>

      <main className="main-content">
        <div className="editor-section glass-panel">
          <div className="editor-header">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="language-selector"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c++">C++</option>
              <option value="typescript">TypeScript</option>
            </select>
            <button 
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <span className="loader"></span>
              ) : (
                <>
                  <Play size={16} /> Analyze Code
                </>
              )}
            </button>
          </div>
          
          <div className="textarea-container">
            <textarea
              className="code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              spellCheck="false"
            />
          </div>
        </div>


        <div className="results-section glass-panel">
          {error && (
            <div className="error-message fade-in">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {!results && !error && !loading && (
            <div className="empty-state fade-in">
              <div className="empty-icon-container">
                <Zap size={48} className="empty-icon" />
              </div>
              <h3>Ready to Analyze</h3>
              <p>Paste your code and click analyze to get AI-powered insights on bugs, optimization, and time complexity.</p>
            </div>
          )}
          
          {loading && (
             <div className="loading-state fade-in">
                <div className="glow-loader"></div>
                <p>Analyzing your code...</p>
             </div>
          )}

          {results && !loading && (
            <div className="results-container fade-in">
              <div className="results-header">
                <h2>Analysis Results</h2>
                {results.qualityScore && (
                  <div className={`quality-score score-${results.qualityScore >= 8 ? 'high' : results.qualityScore >= 5 ? 'medium' : 'low'}`}>
                    Score: {results.qualityScore}/10
                  </div>
                )}
              </div>
              
              <div className="tabs">
                <button 
                  className={`tab ${activeTab === 'bugs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('bugs')}
                >
                  <AlertCircle size={16} /> Bugs & Issues
                </button>
                <button 
                  className={`tab ${activeTab === 'optimization' ? 'active' : ''}`}
                  onClick={() => setActiveTab('optimization')}
                >
                  <Zap size={16} /> Optimization
                </button>
                <button 
                  className={`tab ${activeTab === 'complexity' ? 'active' : ''}`}
                  onClick={() => setActiveTab('complexity')}
                >
                  <Clock size={16} /> Time Complexity
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'bugs' && (
                  <div className="content-pane fade-in">
                    <h3>Detected Issues</h3>
                    <p className="whitespace-pre-line">{results.bugs || "No bugs detected!"}</p>
                    {results.problematicLines && results.problematicLines.length > 0 && (
                      <div className="lines-alert">
                        <strong>Problematic Lines:</strong> {results.problematicLines.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'optimization' && (
                  <div className="content-pane fade-in">
                    <h3>Suggested Improvements</h3>
                    <p className="whitespace-pre-line">{results.optimization || "Code looks fully optimized!"}</p>
                  </div>
                )}

                {activeTab === 'complexity' && (
                  <div className="content-pane fade-in time-complexity">
                    <h3>Estimated Complexity</h3>
                    <div className="complexity-badge">
                      {results.complexity || "O(1)"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;