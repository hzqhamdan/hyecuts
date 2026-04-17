import { useState } from 'react';
import LandingPage from './LandingPage';
import MemberLounge from './MemberLounge';
import AtelierDashboard from './AtelierDashboard';
import AdminLogin from './AdminLogin';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [view, setView] = useState<'facade' | 'lounge' | 'admin' | 'login'>('facade');

  return (
    <AnimatePresence mode="wait">
      {view === 'facade' ? (
        <LandingPage key="facade" setView={setView} />
      ) : view === 'lounge' ? (
        <MemberLounge key="lounge" setView={setView} />
      ) : view === 'login' ? (
        <AdminLogin key="login" setView={setView} />
      ) : (
        <AtelierDashboard key="admin" setView={setView} />
      )}
    </AnimatePresence>
  );
}

export default App;
