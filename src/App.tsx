import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { Home } from './pages/Home';

type Screen = 'login' | 'register';

export function App() {
  const { isAuthenticated } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');

  // if (isAuthenticated) {
  //   return <Home />;
  // }

  // if (screen === 'register') {
  //   return <RegisterPage onBackToLogin={() => setScreen('login')} />;
  // }

  // return <LoginPage onGoToRegister={() => setScreen('register')} />;
  return <Home />;
}

