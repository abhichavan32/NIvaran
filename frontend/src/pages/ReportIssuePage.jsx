import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { issuesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: '', label: 'Auto-detect (AI)' },
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

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: '', description: '', category: '',
    latitude: '', longitude: '', address: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [similarIssues, setSimilarIssues] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="empty-state">
        <h3>Please login to report an issue</h3>
        <p>You need to be logged in to submit a civic issue report.</p>
        <a href="/login" className="btn btn-primary">Login</a>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setGettingLocation(false);
      },
      (err) => {
        setError('Unable to get your location. Please enter it manually.');
        setGettingLocation(false);
      }
    );
  };

  const checkSimilar = async () => {
    if (!formData.title && !formData.description) return;
    try {
      const res = await issuesAPI.findSimilar({
        title: formData.title,
        description: formData.description,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
      });
      setSimilarIssues(res.data.similar_issues || []);
    } catch (err) {
      // silently fail
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      if (formData.category) data.append('category', formData.category);
      if (formData.latitude) data.append('latitude', formData.latitude);
      if (formData.longitude) data.append('longitude', formData.longitude);
      if (formData.address) data.append('address', formData.address);
      if (image) data.append('image', image);

      const res = await issuesAPI.create(data);
      navigate(`/issues/${res.data.id}`);
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        setError(typeof errors === 'string' ? errors : Object.values(errors).flat().join(' '));
      } else {
        setError('Failed to submit issue. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>Report a Civic Issue</h1>
        <p>Describe the problem and our AI will classify and prioritize it</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Issue Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              onBlur={checkSimilar}
              placeholder="e.g., Large pothole on Main Street"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              onBlur={checkSimilar}
              placeholder="Describe the issue in detail. Include severity, how long it's been a problem, and any safety concerns..."
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              className="form-control"
              value={formData.category}
              onChange={handleChange}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <small style={{ color: 'var(--gray-400)', fontSize: '12px' }}>
              Leave as "Auto-detect" to let our AI classify the issue
            </small>
          </div>

          {/* Similar Issues Warning */}
          {similarIssues.length > 0 && (
            <div className="alert alert-info" style={{ marginBottom: '16px' }}>
              <div>
                <strong>Similar issues found:</strong>
                <ul style={{ margin: '8px 0 0 16px', fontSize: '13px' }}>
                  {similarIssues.map(s => (
                    <li key={s.id} style={{ marginBottom: '4px' }}>
                      <a href={`/issues/${s.id}`} target="_blank" rel="noopener noreferrer">
                        {s.title}
                      </a>
                      <span style={{ color: 'var(--gray-400)', marginLeft: '8px' }}>
                        ({Math.round(s.similarity_score * 100)}% match)
                      </span>
                    </li>
                  ))}
                </ul>
                <small>Consider upvoting an existing issue instead of creating a duplicate.</small>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Location</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={getLocation} disabled={gettingLocation}>
                {gettingLocation ? 'Getting location...' : '📍 Use GPS Location'}
              </button>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  name="latitude"
                  type="text"
                  className="form-control"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Latitude"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  name="longitude"
                  type="text"
                  className="form-control"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Longitude"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              className="form-control"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address, landmark, or area name"
            />
          </div>

          <div className="form-group">
            <label>Photo (optional but recommended)</label>
            <div className="file-input-wrapper" onClick={() => document.getElementById('image-input').click()}>
              <input
                id="image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="file-preview" />
              ) : (
                <div>
                  <p>📷 Click to upload an image</p>
                  <p style={{ fontSize: '12px', color: 'var(--gray-400)' }}>JPG, PNG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Issue Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
