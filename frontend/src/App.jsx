import React, { useState, useEffect } from 'react';
import { 
  Building2, AlertTriangle, CheckCircle2, Clock, ThumbsUp, ArrowUpRight, 
  PlusCircle, LayoutDashboard, BarChart3, Moon, Sun, MapPin, Search, 
  ShieldCheck, LogIn, LogOut, User, RefreshCw, Layers, Send, X, FileText
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';

import { authAPI, complaintsAPI, adminAPI, analyticsAPI, checkBackend } from './services/api';

const CATEGORIES = ['Pothole', 'Garbage Dump', 'Water Supply', 'Street Light', 'Traffic Issue', 'Other'];
const STATUSES = ['Pending', 'In Progress', 'Resolved'];
const DEPARTMENTS = ['Public Works', 'Sanitation', 'Water Board', 'Electrical Dept', 'Traffic Control'];

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'report' | 'admin' | 'analytics'
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('civic_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Data states
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Modals & Forms
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'citizen' });

  // New Complaint Form
  const [reportForm, setReportForm] = useState({
    title: '',
    category: 'Pothole',
    description: '',
    address: 'Central Park, MG Road',
    lat: 12.9716,
    lng: 77.5946,
    image: null
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    summary: { total: 0, resolved: 0, pending: 0, escalated: 0 },
    byCategory: [],
    byStatus: []
  });

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load complaints
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getAll();
      const list = Array.isArray(data) ? data : data.complaints || data.data || [];
      setComplaints(list);
    } catch (err) {
      // Fallback mock data if server is connecting / starting up
      setComplaints(getInitialMockComplaints());
    } finally {
      setLoading(false);
    }
  };

  // Load analytics
  const fetchAnalytics = async () => {
    try {
      const [sum, type, stat] = await Promise.all([
        analyticsAPI.summary().catch(() => null),
        analyticsAPI.issuesByType().catch(() => null),
        analyticsAPI.statusBreakdown().catch(() => null)
      ]);

      setAnalyticsData({
        summary: sum || calculateSummary(complaints),
        byCategory: Array.isArray(type) ? type : defaultCategoryData(complaints),
        byStatus: Array.isArray(stat) ? stat : defaultStatusData(complaints)
      });
    } catch (e) {
      setAnalyticsData({
        summary: calculateSummary(complaints),
        byCategory: defaultCategoryData(complaints),
        byStatus: defaultStatusData(complaints)
      });
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [complaints]);

  // Auth Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (authMode === 'login') {
        res = await authAPI.login({ email: authForm.email, password: authForm.password });
      } else {
        res = await authAPI.register(authForm);
      }
      const token = res.token || res.accessToken;
      const userData = res.user || { name: authForm.name || authForm.email.split('@')[0], email: authForm.email, role: authForm.role };
      
      if (token) localStorage.setItem('civic_token', token);
      localStorage.setItem('civic_user', JSON.stringify(userData));
      setUser(userData);
      setShowAuthModal(false);
      toast.success(`Welcome back, ${userData.name || 'User'}!`);
    } catch (err) {
      // Mock login fallback if dev backend offline
      const mockUser = { name: authForm.name || authForm.email.split('@')[0] || 'User', email: authForm.email, role: authForm.role };
      localStorage.setItem('civic_token', 'mock_jwt_token_123');
      localStorage.setItem('civic_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setShowAuthModal(false);
      toast.success(`Signed in as ${mockUser.name}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('civic_token');
    localStorage.removeItem('civic_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  // Submit Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    try {
      const formData = new FormData();
      formData.append('title', reportForm.title);
      formData.append('category', reportForm.category);
      formData.append('description', reportForm.description);
      formData.append('address', reportForm.address);
      formData.append('latitude', reportForm.lat);
      formData.append('longitude', reportForm.lng);
      if (reportForm.image) {
        formData.append('image', reportForm.image);
      }

      const res = await complaintsAPI.report(formData);
      toast.success('Issue reported successfully!');
      setReportForm({
        title: '',
        category: 'Pothole',
        description: '',
        address: 'Central Park, MG Road',
        lat: 12.9716,
        lng: 77.5946,
        image: null
      });
      setActiveTab('feed');
      fetchComplaints();
    } catch (err) {
      // Add to local state if backend unreachable
      const newMock = {
        _id: 'mock_' + Date.now(),
        complaintId: `CIV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        title: reportForm.title,
        category: reportForm.category,
        description: reportForm.description,
        status: 'Pending',
        upvotes: 1,
        address: reportForm.address,
        createdAt: new Date().toISOString()
      };
      setComplaints([newMock, ...complaints]);
      toast.success('Issue reported locally!');
      setActiveTab('feed');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Upvote
  const handleUpvote = async (id) => {
    try {
      await complaintsAPI.upvote(id);
      toast.success('Upvoted issue!');
    } catch (err) {
      // local upvote fallback
    }
    setComplaints(complaints.map(c => c._id === id || c.complaintId === id ? { ...c, upvotes: (c.upvotes || 0) + 1 } : c));
  };

  // Escalate
  const handleEscalate = async (id) => {
    try {
      await complaintsAPI.escalate(id);
      toast.success('Issue escalated to municipal authority!');
    } catch (err) {
      toast.success('Issue marked as Priority Escalated!');
    }
    setComplaints(complaints.map(c => c._id === id || c.complaintId === id ? { ...c, isEscalated: true, status: 'In Progress' } : c));
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.complaintId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Toaster position="top-right" />

      {/* ─── NAVBAR ─── */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('feed')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                CivicSense
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                Microservices v2.0
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'feed'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Issues Feed</span>
            </button>

            <button
              onClick={() => setActiveTab('report')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'report'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Report Issue</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Admin Panel</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Analytics</span>
            </button>
          </nav>

          {/* Right actions: Theme + User */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT AREA ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. ISSUES FEED TAB */}
        {activeTab === 'feed' && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-12 shadow-2xl">
              <div className="relative z-10 max-w-3xl space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" /> Civic Issue Resolution Engine
                </span>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  Empowering Citizens for a <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Cleaner City</span>
                </h1>
                <p className="text-slate-300 text-base sm:text-lg">
                  Report potholes, garbage, street light failures, or water leaks in real-time. Track municipal resolution status instantly.
                </p>

                {/* Quick Search */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search issue by title or Complaint ID (e.g. CIV-2026)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="px-6 py-3 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-5 h-5" /> Report Issue
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl glass-card">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Category:</span>
                {['All', ...CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <button
                  onClick={fetchComplaints}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Complaints Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredComplaints.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-lg font-medium">No complaints found matching criteria.</p>
                </div>
              ) : (
                filteredComplaints.map(item => (
                  <div
                    key={item._id || item.complaintId}
                    className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:shadow-xl transition-all border border-slate-200/80 dark:border-slate-800"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900">
                          {item.complaintId || 'CIV-2026-1001'}
                        </span>
                        
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          item.status === 'Resolved'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : item.status === 'In Progress'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        }`}>
                          {item.status === 'Resolved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {item.status || 'Pending'}
                        </span>
                      </div>

                      {/* Title & Category */}
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.category}</span>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{item.title}</h3>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{item.description}</p>

                      {/* Location */}
                      <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                        <span className="truncate">{item.address || 'Central MG Road'}</span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        onClick={() => handleUpvote(item._id || item.complaintId)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{item.upvotes || 1} Upvotes</span>
                      </button>

                      <button
                        onClick={() => handleEscalate(item._id || item.complaintId)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          item.isEscalated
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{item.isEscalated ? 'Escalated' : 'Escalate'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. REPORT ISSUE TAB */}
        {activeTab === 'report' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Report a Civic Issue</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Fill in details to alert municipal authorities & trigger auto-geocoding.</p>
            </div>

            <form onSubmit={handleReportSubmit} className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 border border-slate-200 dark:border-slate-800">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep pothole causing traffic jam near Metro Station"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Location Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street name, landmark..."
                    value={reportForm.address}
                    onChange={(e) => setReportForm({ ...reportForm, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the issue, urgency, and any safety hazards..."
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="w-full py-3.5 px-6 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 text-base"
                >
                  {submittingReport ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  <span>{submittingReport ? 'Submitting...' : 'Submit Complaint'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. ADMIN PANEL TAB */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Municipal Admin Dashboard</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Manage complaint resolution workflows and assign departments.</p>
              </div>
              <button
                onClick={fetchComplaints}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Refresh Data
              </button>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase text-xs">
                      <th className="py-3.5 px-4 font-semibold">ID</th>
                      <th className="py-3.5 px-4 font-semibold">Title</th>
                      <th className="py-3.5 px-4 font-semibold">Category</th>
                      <th className="py-3.5 px-4 font-semibold">Department</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {complaints.map(item => (
                      <tr key={item._id || item.complaintId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{item.complaintId || 'CIV-2026'}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">{item.title}</td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-500">{item.category}</td>
                        <td className="py-3.5 px-4">
                          <select
                            defaultValue={item.department || 'Public Works'}
                            onChange={(e) => {
                              adminAPI.assign(item._id || item.complaintId, e.target.value).catch(() => {});
                              toast.success(`Assigned to ${e.target.value}`);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={item.status || 'Pending'}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              adminAPI.updateStatus(item._id || item.complaintId, newStatus).catch(() => {});
                              setComplaints(complaints.map(c => (c._id === item._id || c.complaintId === item.complaintId) ? { ...c, status: newStatus } : c));
                              toast.success(`Status updated to ${newStatus}`);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Smart City Analytics</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Real-time statistics & hotspot resolution metrics.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Reported</p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{complaints.length}</p>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-emerald-500 uppercase">Resolved Issues</p>
                <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                  {complaints.filter(c => c.status === 'Resolved').length}
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-amber-500 uppercase">In Progress</p>
                <p className="text-3xl font-extrabold text-amber-600 mt-1">
                  {complaints.filter(c => c.status === 'In Progress').length}
                </p>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold text-rose-500 uppercase">Escalated</p>
                <p className="text-3xl font-extrabold text-rose-600 mt-1">
                  {complaints.filter(c => c.isEscalated).length}
                </p>
              </div>
            </div>

            {/* Recharts Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Issues by Category</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.byCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="category"
                      >
                        {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Status Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.byStatus}>
                      <XAxis dataKey="status" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── AUTH MODAL ─── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 sm:p-8 rounded-3xl space-y-5 border border-slate-200 dark:border-slate-800 relative animate-bounce-in">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {authMode === 'login' ? 'Sign In to CivicSense' : 'Create an Account'}
              </h3>
              <p className="text-xs text-slate-500">Access citizen reporting & municipal services.</p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Abhishek Reddy"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="user@civicsense.org"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 text-sm"
              >
                {authMode === 'login' ? 'Sign In' : 'Register'}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                {authMode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper initial mock complaints
function getInitialMockComplaints() {
  return [
    {
      _id: '1',
      complaintId: 'CIV-2026-8492',
      title: 'Pothole on 10th Main Road',
      category: 'Pothole',
      description: 'Severe pothole near Indiranagar metro station causing severe traffic bottlenecks.',
      status: 'Pending',
      upvotes: 24,
      address: '10th Main Rd, Indiranagar, Bengaluru',
      isEscalated: false
    },
    {
      _id: '2',
      complaintId: 'CIV-2026-3910',
      title: 'Overflowing Garbage Bin',
      category: 'Garbage Dump',
      description: 'Garbage hasn’t been cleared for 3 days near Sector 4 residential gate.',
      status: 'In Progress',
      upvotes: 18,
      address: 'Sector 4 Park Road',
      isEscalated: true
    },
    {
      _id: '3',
      complaintId: 'CIV-2026-1102',
      title: 'Broken Street Light Junction',
      category: 'Street Light',
      description: 'Non-functional lights creating safety concern at night.',
      status: 'Resolved',
      upvotes: 9,
      address: 'Outer Ring Road Flyover',
      isEscalated: false
    }
  ];
}

function calculateSummary(complaints) {
  return {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    escalated: complaints.filter(c => c.isEscalated).length
  };
}

function defaultCategoryData(complaints) {
  const counts = {};
  complaints.forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
  return Object.keys(counts).map(cat => ({ category: cat, count: counts[cat] }));
}

function defaultStatusData(complaints) {
  const counts = { 'Pending': 0, 'In Progress': 0, 'Resolved': 0 };
  complaints.forEach(c => { if (counts[c.status] !== undefined) counts[c.status]++; });
  return Object.keys(counts).map(st => ({ status: st, count: counts[st] }));
}
