import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'road', label: 'Road & Pothole' },
  { value: 'garbage', label: 'Garbage & Waste' },
  { value: 'water', label: 'Water & Drainage' },
  { value: 'electricity', label: 'Electricity & Streetlight' },
  { value: 'sanitation', label: 'Sanitation & Hygiene' },
  { value: 'noise', label: 'Noise Pollution' },
  { value: 'encroachment', label: 'Encroachment' },
  { value: 'traffic', label: 'Traffic & Signals' },
  { value: 'parks', label: 'Parks & Public Spaces' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchIssues();
  }, [page, category, status, priority]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (category) params.category = category;
      if (status) params.status = status;
      if (priority) params.priority = priority;

      const res = await issuesAPI.getAll(params);
      setIssues(res.data.results || res.data);
      if (res.data.count) {
        setTotalPages(Math.ceil(res.data.count / 10));
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchIssues();
  };

  const handleVote = async (issueId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    try {
      const res = await issuesAPI.vote(issueId);
      setIssues(prev => prev.map(issue =>
        issue.id === issueId
          ? { ...issue, upvote_count: res.data.upvote_count, has_voted: !issue.has_voted }
          : issue
      ));
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const getCategoryIcon = (cat) => {
    const icons = {
      road: '🛣️', garbage: '🗑️', water: '💧', electricity: '💡',
      sanitation: '🧹', noise: '📢', encroachment: '🚧', traffic: '🚦',
      parks: '🌳', other: '📋'
    };
    return icons[cat] || '📋';
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Civic Issues</h1>
            <p>Browse and track civic issues in your area</p>
          </div>
          {isAuthenticated && (
            <Link to="/report" className="btn btn-primary">
              + Report Issue
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="filters-bar">
        <input
          type="text"
          className="form-control search-input"
          placeholder="Search issues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="form-control" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} style={{ width: 'auto' }}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select className="form-control" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ width: 'auto' }}>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="form-control" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} style={{ width: 'auto' }}>
          {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      {/* Issue cards */}
      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : issues.length === 0 ? (
        <div className="empty-state">
          <h3>No issues found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <>
          <div className="issue-grid">
            {issues.map(issue => (
              <Link to={`/issues/${issue.id}`} key={issue.id} className="issue-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="issue-header">
                  <h3>{issue.title}</h3>
                  <span className={`badge badge-${issue.status}`}>
                    {issue.status === 'in_progress' ? 'In Progress' : issue.status}
                  </span>
                </div>
                <p className="issue-desc">{issue.description}</p>
                <div className="issue-meta">
                  <span className="badge badge-category">
                    {getCategoryIcon(issue.category)} {issue.category}
                  </span>
                  <span className={`badge badge-${issue.priority}`}>
                    {issue.priority}
                  </span>
                </div>
                {issue.address && (
                  <div className="location-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {issue.address}
                  </div>
                )}
                <div className="issue-footer">
                  <div className="issue-stats">
                    <button
                      className={`upvote-btn ${issue.has_voted ? 'voted' : ''}`}
                      onClick={(e) => handleVote(issue.id, e)}
                    >
                      ▲ {issue.upvote_count}
                    </button>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {issue.comments_count || 0}
                    </span>
                  </div>
                  <div className="issue-date">{formatDate(issue.created_at)}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={page === pageNum ? 'active' : ''}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
