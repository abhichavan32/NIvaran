import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const { isSuperAdmin } = useAuth();

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const res = await usersAPI.getAll(params);
      setUsers(res.data.results || res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (!isSuperAdmin) return <div className="empty-state"><h3>Access denied</h3></div>;

  return (
    <div>
      <div className="page-header"><h1>User Management</h1><p>Manage all registered users</p></div>
      <div className="filters-bar">
        <select className="form-control" value={roleFilter} onChange={e=>{setRoleFilter(e.target.value)}} style={{width:'auto'}}>
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="area_admin">Area Admins</option>
          <option value="super_admin">Super Admins</option>
        </select>
      </div>
      {loading ? <div className="loading"><div className="spinner"></div></div> : (
        <div className="table-container"><table><thead><tr>
          <th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Area</th><th>Issues</th><th>Joined</th>
        </tr></thead><tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td style={{fontWeight:500}}>{u.username}</td>
              <td>{u.first_name} {u.last_name}</td>
              <td>{u.email}</td>
              <td><span className="badge badge-category" style={u.role==='super_admin'?{background:'var(--danger-light)',color:'var(--danger)'}:u.role==='area_admin'?{background:'var(--warning-light)',color:'var(--warning)'}:{}}>{u.role.replace('_',' ')}</span></td>
              <td>{u.area || '-'}</td>
              <td>{u.issues_count || 0}</td>
              <td style={{whiteSpace:'nowrap'}}>{new Date(u.date_joined).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
            </tr>
          ))}
        </tbody></table></div>
      )}
    </div>
  );
}
