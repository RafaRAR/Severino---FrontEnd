import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type {
  AuthResponse,
  AuthUser,
  CadastroPayload,
  CadastroResponse,
  LoginPayload,
  RegisterPayload,
} from '../services/api'
import {
  TOKEN_STORAGE_KEY,
  getCadastro,
  login as loginRequest,
  register as registerRequest,
} from '../services/api'

export type ModalType = 'login' | 'cadastro' | 'recuperarSenha' | 'editProfile' | 'verifyEmail'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  profile: CadastroResponse | null
  isProfileComplete: boolean
  openModal: ModalType | null
  emailForVerification: string | null
  setOpenModal: (modal: ModalType | null) => void
  setEmailForVerification: (email: string | null) => void
  login: (token: string, user: AuthUser) => void
  loginWithCredentials: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  updateProfile: (profile: CadastroPayload) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<CadastroResponse | null>(null)
  const [isProfileComplete, setProfileComplete] = useState(true)
  const [openModal, setOpenModal] = useState<ModalType | null>(null)
  const [emailForVerification, setEmailForVerification] = useState<string | null>(null)

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const userProfile = await getCadastro(userId)
      if (userProfile) {
        setProfile(userProfile)
        setProfileComplete(true)
        localStorage.setItem('severino_profile', JSON.stringify(userProfile))
      } else {
        setProfileComplete(false)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      setProfileComplete(false)
      localStorage.removeItem('severino_profile')
    }
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedUser = localStorage.getItem('severino_user')
    const storedProfile = localStorage.getItem('severino_profile')

    if (storedToken && storedUser) {
      try {
        const parsedUser: AuthUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)
        if (storedProfile) {
          const parsedProfile: CadastroResponse = JSON.parse(storedProfile)
          setProfile(parsedProfile)
          setProfileComplete(!!parsedProfile)
        } else {
          fetchProfile(parsedUser.id)
        }
      } catch {
        logout()
      }
    }
  }, [fetchProfile])

  function persistAuth(auth: AuthResponse) {
    setUser(auth.user)
    setToken(auth.token)
    localStorage.setItem(TOKEN_STORAGE_KEY, auth.token)
    localStorage.setItem('severino_user', JSON.stringify(auth.user))
    fetchProfile(auth.user.id)
  }

  function login(token: string, user: AuthUser) {
    persistAuth({ token, user })
  }

  async function loginWithCredentials(payload: LoginPayload) {
    const auth = await loginRequest(payload)
    persistAuth(auth)
  }

  async function handleRegister(payload: RegisterPayload) {
    await registerRequest(payload)
    // No login automatic
  }

  function logout() {
    setUser(null)
    setToken(null)
    setProfile(null)
    setProfileComplete(false)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem('severino_user')
    localStorage.removeItem('severino_profile')
  }

  function updateProfile(_newProfile: CadastroPayload) {
    if (user) {
      fetchProfile(user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        profile,
        isProfileComplete,
        openModal,
        emailForVerification,
        setOpenModal,
        setEmailForVerification,
        login,
        loginWithCredentials,
        register: handleRegister,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

