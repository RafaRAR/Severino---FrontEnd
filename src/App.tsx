import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/Login'
import { RegisterPage } from './pages/Register'
import { Home } from './pages/Home'
import { CompleteProfileModal } from './components/CompleteProfileModal'
import { getPerfil } from './services/api'

type Screen = 'login' | 'register'

function isProfileComplete(user: { profileComplete?: boolean; cpf?: string; tipoPerfil?: string } | null): boolean {
  if (!user) return false
  if (user.profileComplete === true) return true
  return !!(user.cpf && user.tipoPerfil)
}

export function App() {
  const { isAuthenticated, user, updateUser } = useAuth()
  const [screen, setScreen] = useState<Screen>('login')
  const [showCompleteProfile, setShowCompleteProfile] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setShowCompleteProfile(false)
      return
    }
    if (isProfileComplete(user)) {
      setShowCompleteProfile(false)
      return
    }
    getPerfil()
      .then((fullUser) => {
        const complete = fullUser ? isProfileComplete(fullUser) : false
        setShowCompleteProfile(!complete)
      })
      .catch(() => {
        setShowCompleteProfile(true)
      })
  }, [isAuthenticated, user])

  function handleProfileComplete(updatedUser: Parameters<typeof updateUser>[0]) {
    updateUser(updatedUser)
    setShowCompleteProfile(false)
  }

  if (isAuthenticated) {
    return (
      <>
        <Home />
        <CompleteProfileModal
          isOpen={showCompleteProfile}
          onClose={() => setShowCompleteProfile(false)}
          onComplete={handleProfileComplete}
        />
      </>
    )
  }

  if (screen === 'register') {
    return <RegisterPage onBackToLogin={() => setScreen('login')} />
  }

  return <LoginPage onGoToRegister={() => setScreen('register')} />
}

