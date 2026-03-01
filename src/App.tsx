import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'

type Screen = 'login' | 'register'

export function App() {
  const { isAuthenticated, user, logout } = useAuth()
  const [screen, setScreen] = useState<Screen>('login')

  if (isAuthenticated) {
    const displayName = user?.name?.split(' ')?.[0] || 'bem-vindo'
    const displayEmail = user?.email || ''
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-50">
        <div className="w-full max-w-xl rounded-2xl bg-slate-900/80 p-8 shadow-2xl shadow-black/60">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Olá, {displayName} 👋
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Você está autenticado no <span className="text-sky-400">Severino</span>. A partir daqui
            entra o dashboard/marketplace do seu TCC.
          </p>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm">
            <div>
              {displayEmail ? (
                <p className="font-medium text-slate-100">{displayEmail}</p>
              ) : (
                <p className="font-medium text-slate-100">Sessão ativa</p>
              )}
              <p className="text-xs text-slate-500">Token armazenado em localStorage</p>
            </div>
            <button
              onClick={logout}
              className="text-xs font-medium text-slate-400 underline-offset-4 hover:text-sky-400 hover:underline"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'register') {
    return <RegisterPage onBackToLogin={() => setScreen('login')} />
  }

  return <LoginPage onGoToRegister={() => setScreen('register')} />
}

