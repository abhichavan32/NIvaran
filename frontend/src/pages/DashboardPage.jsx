import { useState, useEffect } from 'react';
import { usersAPI, issuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#0891b2','#7c3aed','#db2777','#ea580c','#65a30d','#64748b'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useAuth();

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await usersAPI.getDashboardStats();
      setStats(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      const res = await issuesAPI.export();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'issues_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!stats) return <div className="empty-state"><h3>Unable to load dashboard</h3></div>;

  const categoryData = (stats.categories || []).map(c => ({
    name: c.category, value: c.count
  }));

  return (
    <div>
      <div className="action-bar">
        <div className="page-header" style={{marginBottom:0}}>
          <h1>Dashboard</h1>
          <p>Overview of civic issues and resolution progress</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}>Export CSV</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background:'var(--primary-light)',color:'var(--primary)'}}>📋</div>
          <div className="stat-value">{stats.total_issues}</div>
          <div className="stat-label">Total Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'var(--warning-light)',color:'var(--warning)'}}>⏳</div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'var(--info-light)',color:'var(--info)'}}>🔄</div>
          <div className="stat-value">{stats.in_progress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'var(--success-light)',color:'var(--success)'}}>✓</div>
          <div className="stat-value">{stats.resolved}</div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'#f0fdf4',color:'var(--success)'}}>📊</div>
          <div className="stat-value">{stats.resolution_rate}%</div>
          <div className="stat-label">Resolution Rate</div>
        </div>
        {isSuperAdmin && (
          <>
            <div className="stat-card">
              <div className="stat-icon" style={{background:'var(--primary-light)',color:'var(--primary)'}}>👥</div>
              <div className="stat-value">{stats.total_users}</div>
              <div className="stat-label">Citizens</div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h3>Issues by Category</h3></div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} tick={{fill:'#64748b'}} />
                <YAxis fontSize={12} tick={{fill:'#64748b'}} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{color:'var(--gray-400)',textAlign:'center',padding:'40px'}}>No data</p>}
        </div>

        <div className="card">
          <div className="card-header"><h3>Category Distribution</h3></div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {categoryData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{color:'var(--gray-400)',textAlign:'center',padding:'40px'}}>No data</p>}
        </div>
      </div>

      {stats.monthly_trends?.length > 0 && (
        <div className="card mt-4">
          <div className="card-header"><h3>Monthly Trend</h3></div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.monthly_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" fontSize={12} tick={{fill:'#64748b'}} />
              <YAxis fontSize={12} tick={{fill:'#64748b'}} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
