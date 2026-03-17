import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MyIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const { isAreaAdmin } = useAuth();

  useEffect(() => { fetchIssues(); }, [tab]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (isAreaAdmin) params.my_assigned = true;
      else params.my_issues = true;
      if (tab !== 'all') params.status = tab;
      const res = await issuesAPI.getAll(params);
      setIssues(res.data.results || res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="page-header">
        <h1>{isAreaAdmin ? 'Assigned Issues' : 'My Issues'}</h1>
        <p>{isAreaAdmin ? 'Issues assigned to your area' : 'Issues you have reported'}</p>
      </div>
      <div className="tabs">
        {['all','pending','in_progress','resolved'].map(t => (
          <button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
            {t==='all'?'All':t==='in_progress'?'In Progress':t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>
      {loading ? <div className="loading"><div className="spinner"></div></div> : issues.length===0 ? (
        <div className="empty-state"><h3>No issues found</h3>
          {!isAreaAdmin && <Link to="/report" className="btn btn-primary">Report an Issue</Link>}
        </div>
      ) : (
        <div className="table-container"><table><thead><tr>
          <th>Issue</th><th>Category</th><th>Status</th><th>Priority</th><th>Upvotes</th><th>Date</th>
        </tr></thead><tbody>
          {issues.map(issue => (
            <tr key={issue.id}>
              <td><Link to={`/issues/${issue.id}`} style={{fontWeight:500,color:'var(--gray-900)'}}>{issue.title}</Link></td>
              <td><span className="badge badge-category">{issue.category}</span></td>
              <td><span className={`badge badge-${issue.status}`}>{issue.status==='in_progress'?'In Progress':issue.status}</span></td>
              <td><span className={`badge badge-${issue.priority}`}>{issue.priority}</span></td>
              <td>{issue.upvote_count}</td>
              <td style={{whiteSpace:'nowrap'}}>{formatDate(issue.created_at)}</td>
            </tr>
          ))}
        </tbody></table></div>
      )}
    </div>
  );
}
