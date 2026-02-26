import axios from 'axios'

const API_BASE_URL = 'https://api.severino.local' // placeholder para futura API real
const TOKEN_STORAGE_KEY = 'severino_token'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function mockRequest<T>(data: T, ms = 900): Promise<T> {
  await delay(ms)
  return data
}

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { email, password } = payload

  if (password.length < 8) {
    await delay(600)
    throw new Error('Credenciais inválidas. Verifique e tente novamente.')
  }

  // Aqui futuramente você pode substituir por:
  // const { data } = await api.post<AuthResponse>('/auth/login', payload)
  // return data

  return mockRequest({
    token: 'mock-jwt-token',
    user: {
      id: '1',
      name: 'Usuário Severino',
      email,
    },
  })
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { name, email, password } = payload

  if (password.length < 8) {
    await delay(600)
    throw new Error('Senha muito fraca. Use pelo menos 8 caracteres.')
  }

  // Mock de criação de usuário
  return mockRequest({
    token: 'mock-jwt-token',
    user: {
      id: '2',
      name,
      email,
    },
  })
}

export { TOKEN_STORAGE_KEY }

