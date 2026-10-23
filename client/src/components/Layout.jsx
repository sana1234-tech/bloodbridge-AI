import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ChatbotWidget from './ChatbotWidget';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 min-w-0">
        <Outlet />
      </main>
      <ChatbotWidget />
    </div>
  );
}
