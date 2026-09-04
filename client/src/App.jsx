import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import EmergencyRequest from './pages/EmergencyRequest';
import DonorMatch from './pages/DonorMatch';
import Analytics from './pages/Analytics';
import Donors from './pages/Donors';
import Hospitals from './pages/Hospitals';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/request" element={<EmergencyRequest />} />
          <Route path="/match/:requestId" element={<DonorMatch />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/donors" element={<Donors />} />
          <Route path="/hospitals" element={<Hospitals />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
