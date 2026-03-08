import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { Home } from './pages/Home';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { CompleteProfileModal } from './components/CompleteProfileModal';
import { useEffect, useState } from 'react';
import { getPerfil } from './services/api';

function isProfileComplete(user: { profileComplete?: boolean; cpf?: string; tipoPerfil?: string } | null): boolean {
  if (!user) return false;
  if (user.profileComplete === true) return true;
  return !!(user.cpf && user.tipoPerfil);
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

export function App() {
  const { isAuthenticated, user, updateUser } = useAuth();
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowCompleteProfile(false);
      return;
    }
    if (isProfileComplete(user)) {
      setShowCompleteProfile(false);
      return;
    }
    getPerfil()
      .then((fullUser) => {
        const complete = fullUser ? isProfileComplete(fullUser) : false;
        if (complete && fullUser) {
          updateUser(fullUser)
        }
        setShowCompleteProfile(!complete);
      })
      .catch(() => {
        setShowCompleteProfile(true);
      });
  }, [isAuthenticated, user, updateUser]);

  function handleProfileComplete(updatedUser: Parameters<typeof updateUser>[0]) {
    updateUser(updatedUser);
    setShowCompleteProfile(false);
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registrar" element={<RegisterPage />} />
        <Route path="/verificar-email" element={<VerifyEmail />} />
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/resetar-senha" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
      </Routes>
      <CompleteProfileModal
        isOpen={showCompleteProfile && isAuthenticated}
        onClose={() => setShowCompleteProfile(false)}
      />
    </BrowserRouter>
  );
}

