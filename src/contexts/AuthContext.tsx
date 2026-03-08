import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from '../services/api'
import { TOKEN_STORAGE_KEY, login as loginRequest, register as registerRequest } from '../services/api'

interface AuthContextValue {
  user: AuthResponse['user'] | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: AuthUser) => void
  loginWithCredentials: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  /** Atualiza o usuário (ex.: após completar perfil) */
  updateUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    const storedUser = localStorage.getItem('severino_user')

    if (storedToken) {
      try {
        setToken(storedToken)
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        }
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        localStorage.removeItem('severino_user')
      }
    }
  }, [])

  function persistAuth(auth: AuthResponse) {
    setUser(auth.user)
    setToken(auth.token)
    localStorage.setItem(TOKEN_STORAGE_KEY, auth.token)
    localStorage.setItem('severino_user', JSON.stringify(auth.user))
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
    // Não faz mais o login automático
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    localStorage.removeItem('severino_user')
  }

  function updateUser(newUser: AuthUser) {
    setUser(newUser)
    localStorage.setItem('severino_user', JSON.stringify(newUser))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        loginWithCredentials,
        register: handleRegister,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de AuthProvider')
  }
  return context
}

