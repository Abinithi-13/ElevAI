import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import { PageLoader } from './components/Spinner.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Elevators from './pages/admin/Elevators.jsx';
import Technicians from './pages/admin/Technicians.jsx';
import Analytics from './pages/admin/Analytics.jsx';
import TechnicianDashboard from './pages/technician/TechnicianDashboard.jsx';
import UserDashboard from './pages/user/UserDashboard.jsx';
import ReportFault from './pages/user/ReportFault.jsx';
import Complaints from './pages/shared/Complaints.jsx';
import ComplaintDetail from './pages/shared/ComplaintDetail.jsx';
import Maintenance from './pages/shared/Maintenance.jsx';
import Predictive from './pages/shared/Predictive.jsx';
import Assistant from './pages/shared/Assistant.jsx';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return <Navigate to={user ? `/${user.role}/dashboard` : '/login'} replace />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to={`/${user.role}/dashboard`} replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="elevators" element={<Elevators />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="technicians" element={<Technicians />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="predictive" element={<Predictive />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="assistant" element={<Assistant />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['technician']} />}>
        <Route path="/technician" element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TechnicianDashboard />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="predictive" element={<Predictive />} />
          <Route path="assistant" element={<Assistant />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['user']} />}>
        <Route path="/user" element={<Layout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="report" element={<ReportFault />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="assistant" element={<Assistant />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
