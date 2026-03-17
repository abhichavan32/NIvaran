import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', phone: '', area: '', address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const errorMsg = Object.values(errors).flat().join(' ');
        setError(errorMsg);
      } else {
        setError('Registration failed. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join CivicAI to report civic issues in your area</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input id="first_name" name="first_name" type="text" className="form-control"
                value={formData.first_name} onChange={handleChange} placeholder="First name" required />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input id="last_name" name="last_name" type="text" className="form-control"
                value={formData.last_name} onChange={handleChange} placeholder="Last name" required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" className="form-control"
              value={formData.username} onChange={handleChange} placeholder="Choose a username" required />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="form-control"
              value={formData.email} onChange={handleChange} placeholder="your@email.com" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="form-control"
                value={formData.password} onChange={handleChange} placeholder="Min. 8 characters" required />
            </div>
            <div className="form-group">
              <label htmlFor="password2">Confirm Password</label>
              <input id="password2" name="password2" type="password" className="form-control"
                value={formData.password2} onChange={handleChange} placeholder="Confirm password" required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" type="tel" className="form-control"
                value={formData.phone} onChange={handleChange} placeholder="Phone number" />
            </div>
            <div className="form-group">
              <label htmlFor="area">Area</label>
              <input id="area" name="area" type="text" className="form-control"
                value={formData.area} onChange={handleChange} placeholder="Your area" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
