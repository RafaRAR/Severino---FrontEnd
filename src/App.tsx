import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { Home } from './pages/Home';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { CompleteProfileModal } from './components/CompleteProfileModal';
import Header from './components/layout/Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <>
      <Header />
      {children}
    </>
  ) : (
    <Navigate to="/login" />
  );
}

export function App() {
  const { isAuthenticated, isProfileComplete } = useAuth();

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Routes>
        <Route  path="/login" element={<LoginPage />} />
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
        isOpen={isAuthenticated && !isProfileComplete}
        onClose={() => {
          // A lógica de fechar o modal deve ser tratada no contexto
          // ou o usuário deve ser deslogado se ele fechar sem completar.
        }}
      />
    </BrowserRouter>
  );
}

