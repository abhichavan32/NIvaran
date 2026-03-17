import { useState, useEffect } from 'react';
import { issuesAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getMarkerIcon = (status) => {
  const colors = { pending: '#d97706', in_progress: '#0891b2', resolved: '#16a34a' };
  const color = colors[status] || '#64748b';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function MapPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchMapData(); }, []);

  const fetchMapData = async () => {
    try {
      const res = await issuesAPI.getMapData();
      setIssues(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter);
  const center = issues.length > 0
    ? [issues.reduce((s,i)=>s+i.latitude,0)/issues.length, issues.reduce((s,i)=>s+i.longitude,0)/issues.length]
    : [18.52, 73.85];

  return (
    <div>
      <div className="page-header">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div><h1>Issue Map</h1><p>View civic issues on the map</p></div>
          <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
            <span style={{fontSize:'12px',color:'var(--gray-500)'}}>Filter:</span>
            {['all','pending','in_progress','resolved'].map(s => (
              <button key={s} className={`btn btn-sm ${filter===s?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter(s)}>
                {s==='all'?'All':s==='in_progress'?'In Progress':s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:'8px',marginBottom:'12px',fontSize:'12px',color:'var(--gray-500)'}}>
        <span style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:12,height:12,borderRadius:'50%',background:'#d97706',display:'inline-block'}}></span> Pending</span>
        <span style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:12,height:12,borderRadius:'50%',background:'#0891b2',display:'inline-block'}}></span> In Progress</span>
        <span style={{display:'flex',alignItems:'center',gap:'4px'}}><span style={{width:12,height:12,borderRadius:'50%',background:'#16a34a',display:'inline-block'}}></span> Resolved</span>
      </div>
      {loading ? <div className="loading"><div className="spinner"></div></div> : (
        <div className="map-container">
          <MapContainer center={center} zoom={12} style={{height:'100%',width:'100%'}}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            {filtered.map(issue => (
              <Marker key={issue.id} position={[issue.latitude, issue.longitude]} icon={getMarkerIcon(issue.status)}>
                <Popup>
                  <div style={{fontSize:'13px'}}>
                    <strong><a href={`/issues/${issue.id}`}>{issue.title}</a></strong>
                    <div style={{marginTop:'4px',display:'flex',gap:'4px'}}>
                      <span className={`badge badge-${issue.status}`}>{issue.status}</span>
                      <span className={`badge badge-${issue.priority}`}>{issue.priority}</span>
                    </div>
                    {issue.address && <div style={{marginTop:'4px',color:'#64748b'}}>{issue.address}</div>}
                    <div style={{marginTop:'4px',color:'#94a3b8'}}>▲ {issue.upvote_count} upvotes</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
