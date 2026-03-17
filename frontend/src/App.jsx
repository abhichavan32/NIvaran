import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import IssuesPage from './pages/IssuesPage';
import IssueDetailPage from './pages/IssueDetailPage';
import ReportIssuePage from './pages/ReportIssuePage';
import MyIssuesPage from './pages/MyIssuesPage';
import DashboardPage from './pages/DashboardPage';
import MapPage from './pages/MapPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import { useAuth } from './context/AuthContext';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<IssuesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
          <Route path="/report" element={<ReportIssuePage />} />
          <Route path="/my-issues" element={<MyIssuesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
      <Chatbot />
    </div>
  );
}

export default App;
