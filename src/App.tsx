import { useState } from 'react';
import LandingPage from './components/landing/LandingPage';
import MemberLounge from './MemberLounge';
import AtelierDashboard from './AtelierDashboard';
import LoginScreen from './LoginScreen';
import { useAuth } from './context/AuthContext';
import { AnimatePresence } from 'framer-motion';

function App() {
  const [view, setView] = useState<string>('facade');
  const { token } = useAuth();

  return (
    <AnimatePresence mode="wait">
      {view === 'facade' ? (
        <LandingPage key="facade" setView={setView as any} />
      ) : view === 'login' ? (
        <LoginScreen key="login" setView={setView as any} />
      ) : view === 'lounge' ? (
        token ? <MemberLounge key="lounge" setView={setView as any} /> : <LoginScreen key="login" setView={setView as any} />
      ) : (
        token ? <AtelierDashboard key="admin" setView={setView as any} /> : <LoginScreen key="login" setView={setView as any} />
      )}
    </AnimatePresence>
  );
}

export default App;
