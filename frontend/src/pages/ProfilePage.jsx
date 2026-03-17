import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '', last_name: user?.last_name || '',
    email: user?.email || '', phone: user?.phone || '',
    area: user?.area || '', address: user?.address || ''
  });
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '' });
  const [message, setMessage] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true); setMessage('');
    try {
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data);
      setMessage('Profile updated successfully.');
    } catch (err) { setMessage('Error updating profile.'); }
    setLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault(); setPwMsg('');
    try {
      await authAPI.changePassword(passwords);
      setPwMsg('Password changed successfully.');
      setPasswords({ old_password: '', new_password: '' });
    } catch (err) {
      setPwMsg(err.response?.data?.old_password?.[0] || 'Error changing password.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header"><h1>Profile</h1><p>Manage your account details</p></div>
      {message && <div className="alert alert-success">{message}</div>}
      <div className="card mb-4">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Account Information</h3>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group"><label>First Name</label>
              <input className="form-control" value={formData.first_name} onChange={e=>setFormData(p=>({...p,first_name:e.target.value}))} /></div>
            <div className="form-group"><label>Last Name</label>
              <input className="form-control" value={formData.last_name} onChange={e=>setFormData(p=>({...p,last_name:e.target.value}))} /></div>
          </div>
          <div className="form-group"><label>Email</label>
            <input type="email" className="form-control" value={formData.email} onChange={e=>setFormData(p=>({...p,email:e.target.value}))} /></div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label>
              <input className="form-control" value={formData.phone} onChange={e=>setFormData(p=>({...p,phone:e.target.value}))} /></div>
            <div className="form-group"><label>Area</label>
              <input className="form-control" value={formData.area} onChange={e=>setFormData(p=>({...p,area:e.target.value}))} /></div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving...':'Save Changes'}</button>
        </form>
      </div>
      {pwMsg && <div className="alert alert-info">{pwMsg}</div>}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Change Password</h3>
        <form onSubmit={handlePasswordChange}>
          <div className="form-group"><label>Current Password</label>
            <input type="password" className="form-control" value={passwords.old_password} onChange={e=>setPasswords(p=>({...p,old_password:e.target.value}))} required /></div>
          <div className="form-group"><label>New Password</label>
            <input type="password" className="form-control" value={passwords.new_password} onChange={e=>setPasswords(p=>({...p,new_password:e.target.value}))} required /></div>
          <button type="submit" className="btn btn-secondary">Change Password</button>
        </form>
      </div>
    </div>
  );
}
