import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { issuesAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isSuperAdmin, isAreaAdmin, isAdmin } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [areaAdmins, setAreaAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchIssue();
    if (isSuperAdmin) {
      fetchAreaAdmins();
    }
  }, [id]);

  const fetchIssue = async () => {
    try {
      const res = await issuesAPI.getById(id);
      setIssue(res.data);
      setStatusUpdate(res.data.status);
      setResolutionNotes(res.data.resolution_notes || '');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchAreaAdmins = async () => {
    try {
      const res = await usersAPI.getAreaAdmins();
      setAreaAdmins(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await issuesAPI.vote(id);
      setIssue(prev => ({
        ...prev,
        upvote_count: res.data.upvote_count,
        has_voted: !prev.has_voted
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      await issuesAPI.addComment(id, comment);
      setComment('');
      fetchIssue();
    } catch (err) {
      console.error(err);
    }
    setCommenting(false);
  };

  const handleStatusUpdate = async () => {
    try {
      await issuesAPI.update(id, {
        status: statusUpdate,
        resolution_notes: resolutionNotes,
      });
      setMessage('Status updated successfully.');
      fetchIssue();
    } catch (err) {
      setMessage('Error updating status.');
    }
  };

  const handleAssign = async () => {
    if (!selectedAdmin) return;
    try {
      await issuesAPI.assign(id, selectedAdmin);
      setMessage('Issue assigned successfully.');
      fetchIssue();
    } catch (err) {
      setMessage('Error assigning issue.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this issue?')) return;
    try {
      await issuesAPI.delete(id);
      navigate('/');
    } catch (err) {
      setMessage('Error deleting issue.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      road: 'Road & Pothole', garbage: 'Garbage & Waste', water: 'Water & Drainage',
      electricity: 'Electricity & Streetlight', sanitation: 'Sanitation & Hygiene',
      noise: 'Noise Pollution', encroachment: 'Encroachment', traffic: 'Traffic & Signals',
      parks: 'Parks & Public Spaces', other: 'Other'
    };
    return labels[cat] || cat;
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!issue) return <div className="empty-state"><h3>Issue not found</h3></div>;

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Link to="/" style={{ color: 'var(--gray-500)', fontSize: '14px' }}>← Back to Issues</Link>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="issue-detail">
        {/* Main Content */}
        <div className="issue-detail-main">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '8px' }}>{issue.title}</h1>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${issue.status}`}>
                    {issue.status === 'in_progress' ? 'In Progress' : issue.status}
                  </span>
                  <span className={`badge badge-${issue.priority}`}>{issue.priority} priority</span>
                  <span className="badge badge-category">{getCategoryLabel(issue.category)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {isAuthenticated && (
                  <button className={`upvote-btn ${issue.has_voted ? 'voted' : ''}`} onClick={handleVote}>
                    ▲ {issue.upvote_count}
                  </button>
                )}
                {isSuperAdmin && (
                  <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
                )}
              </div>
            </div>

            {issue.image && (
              <img
                src={`http://localhost:8000${issue.image}`}
                alt={issue.title}
                className="issue-image"
              />
            )}

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '8px' }}>Description</h3>
              <p style={{ fontSize: '15px', color: 'var(--gray-600)', lineHeight: 1.7 }}>{issue.description}</p>
            </div>

            {issue.ai_category && issue.ai_category !== issue.category && (
              <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                AI suggested category: <strong>{getCategoryLabel(issue.ai_category)}</strong>
              </div>
            )}

            {issue.resolution_notes && (
              <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--success-light)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--success)', marginBottom: '8px' }}>Resolution Notes</h3>
                <p style={{ fontSize: '14px', color: 'var(--gray-700)' }}>{issue.resolution_notes}</p>
              </div>
            )}

            {issue.resolution_image && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '8px' }}>Resolution Proof</h3>
                <img
                  src={`http://localhost:8000${issue.resolution_image}`}
                  alt="Resolution proof"
                  style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--gray-200)' }}
                />
              </div>
            )}

            {/* Comments Section */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                Comments ({issue.comments?.length || 0})
              </h3>

              {isAuthenticated && (
                <form onSubmit={handleComment} style={{ marginBottom: '20px' }}>
                  <textarea
                    className="form-control"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows="3"
                    required
                  />
                  <button type="submit" className="btn btn-primary btn-sm mt-2" disabled={commenting}>
                    {commenting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              )}

              {issue.comments?.length === 0 ? (
                <p style={{ color: 'var(--gray-400)', fontSize: '14px' }}>No comments yet.</p>
              ) : (
                issue.comments?.map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-header">
                      <div>
                        <span className="author">{c.username}</span>
                        {c.user_role !== 'user' && (
                          <span className="badge badge-category" style={{ marginLeft: '8px', fontSize: '10px' }}>
                            {c.user_role === 'super_admin' ? 'Admin' : 'Area Admin'}
                          </span>
                        )}
                      </div>
                      <span className="date">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Details Card */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Details</h3>
            <div style={{ fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)' }}>Reported by</span>
                <span style={{ fontWeight: 500 }}>{issue.reporter_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)' }}>Assigned to</span>
                <span style={{ fontWeight: 500 }}>{issue.assigned_to_name || 'Unassigned'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)' }}>Priority Score</span>
                <span style={{ fontWeight: 500 }}>{issue.priority_score?.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)' }}>Created</span>
                <span style={{ fontWeight: 500 }}>{formatDate(issue.created_at)}</span>
              </div>
              {issue.resolved_at && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ color: 'var(--gray-500)' }}>Resolved</span>
                  <span style={{ fontWeight: 500 }}>{formatDate(issue.resolved_at)}</span>
                </div>
              )}
              {issue.address && (
                <div style={{ padding: '8px 0' }}>
                  <span style={{ color: 'var(--gray-500)', display: 'block', marginBottom: '4px' }}>Location</span>
                  <span style={{ fontWeight: 500 }}>{issue.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Admin Actions</h3>

              <div className="form-group">
                <label>Update Status</label>
                <select className="form-control" value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label>Resolution Notes</label>
                <textarea
                  className="form-control"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Add resolution notes..."
                  rows="3"
                />
              </div>

              <button className="btn btn-primary w-full" onClick={handleStatusUpdate}>
                Update Status
              </button>
            </div>
          )}

          {/* Assign to Area Admin */}
          {isSuperAdmin && (
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Assign to Area Admin</h3>
              <div className="form-group">
                <select className="form-control" value={selectedAdmin} onChange={(e) => setSelectedAdmin(e.target.value)}>
                  <option value="">Select Area Admin</option>
                  {areaAdmins.map(admin => (
                    <option key={admin.id} value={admin.id}>
                      {admin.first_name} {admin.last_name} ({admin.area})
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary w-full" onClick={handleAssign} disabled={!selectedAdmin}>
                Assign Issue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
