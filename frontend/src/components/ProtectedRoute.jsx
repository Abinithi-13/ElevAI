import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PageLoader } from './Spinner.jsx';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader label="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <Outlet />;
}
