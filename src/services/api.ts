import axios, { AxiosError } from 'axios'

const API_BASE_URL = 'https://severino-backend-lqhl.onrender.com'
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

// As rotas reais estão no backend (Render). Mantemos aqui apenas a instância Axios
// e helpers de normalização de resposta/erro.

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
  senha: string
}

export interface RegisterPayload {
  nome: string
  email: string
  senha: string
}

function normalizeAuthResponse(
  data: unknown,
  fallback: { email?: string; nome?: string },
): AuthResponse {
  const fallbackUser: AuthUser = {
    id: '',
    name: fallback.nome ?? (fallback.email ? fallback.email.split('@')[0] : 'Usuário'),
    email: fallback.email ?? '',
  }

  if (typeof data === 'string') {
    return { token: data, user: fallbackUser }
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Resposta inesperada do servidor.')
  }

  const obj = data as Record<string, unknown>

  const tokenCandidate =
    (obj.token as string | undefined) ??
    (obj.Token as string | undefined) ??
    (obj.accessToken as string | undefined) ??
    (obj.jwt as string | undefined) ??
    ''

  const userCandidate =
    (obj.user as Record<string, unknown> | undefined) ??
    (obj.usuario as Record<string, unknown> | undefined) ??
    (obj.Usuario as Record<string, unknown> | undefined) ??
    (obj.User as Record<string, unknown> | undefined)

  const user: AuthUser = {
    id:
      String(
        userCandidate?.id ??
          userCandidate?.Id ??
          obj.id ??
          obj.Id ??
          fallbackUser.id ??
          '',
      ) || '',
    name:
      String(
        userCandidate?.name ??
          userCandidate?.nome ??
          userCandidate?.Nome ??
          obj.name ??
          obj.nome ??
          obj.Nome ??
          fallbackUser.name,
      ) || fallbackUser.name,
    email:
      String(
        userCandidate?.email ??
          userCandidate?.Email ??
          obj.email ??
          obj.Email ??
          fallbackUser.email,
      ) || fallbackUser.email,
  }

  const token = String(tokenCandidate || '')

  if (!token) {
    throw new Error('Login falhou: token ausente na resposta do servidor.')
  }

  return { token, user }
}

function toErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>
    const status = axiosError.response?.status

    if (status === 401) return 'E-mail ou senha inválidos.'
    if (status === 400) return 'Dados inválidos. Verifique e tente novamente.'
    if (status === 409) return 'E-mail já cadastrado.'

    return 'Não foi possível concluir a requisição. Tente novamente em instantes.'
  }

  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado.'
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post('/api/Usuario/login', null, {
      params: {
        email: payload.email,
        senha: payload.senha,
      },
    })

    return normalizeAuthResponse(data, { email: payload.email })
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post('/api/Usuario/registrar', null, {
      params: {
        nome: payload.nome,
        email: payload.email,
        senha: payload.senha,
      },
    })

    return normalizeAuthResponse(data, { email: payload.email, nome: payload.nome })
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export { TOKEN_STORAGE_KEY }

