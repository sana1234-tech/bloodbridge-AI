import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmergencyRequest from './pages/EmergencyRequest';
import DonorMatch from './pages/DonorMatch';
import Analytics from './pages/Analytics';
import Donors from './pages/Donors';
import Hospitals from './pages/Hospitals';
import Login from './pages/Login';
import SignupStaff from './pages/SignupStaff';
import SignupDonor from './pages/SignupDonor';
import VerificationPanel from './pages/VerificationPanel';
import MyRequests from './pages/MyRequests';
import ReplacementDonor from './pages/ReplacementDonor';

function ProtectedRoute({ children, staffOnly = false }) {
  const { user, isVerifiedStaff, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-64 text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (staffOnly && !isVerifiedStaff) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup/staff" element={<SignupStaff />} />
          <Route path="/signup/donor" element={<SignupDonor />} />

          {/* Main app with layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/donors" element={<Donors />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/match/:requestId" element={<DonorMatch />} />

            {/* Staff-only (verified) routes */}
            <Route path="/request" element={
              <ProtectedRoute staffOnly><EmergencyRequest /></ProtectedRoute>
            } />
            <Route path="/my-requests" element={
              <ProtectedRoute staffOnly><MyRequests /></ProtectedRoute>
            } />
            <Route path="/verification" element={
              <ProtectedRoute staffOnly><VerificationPanel /></ProtectedRoute>
            } />
            <Route path="/replacement-donor" element={
              <ProtectedRoute staffOnly><ReplacementDonor /></ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
