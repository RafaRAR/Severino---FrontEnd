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
  /** Indica se o perfil está completo (cpf, celular, endereço preenchidos) */
  profileComplete?: boolean
  cpf?: string
  celular?: string
  tipoPerfil?: 'cliente' | 'prestador'
  categoria?: string
  cep?: string
  cidade?: string
  bairro?: string
  estado?: string
  numero?: string
  complemento?: string
}

export interface CepResponse {
  localidade?: string
  bairro?: string
  uf?: string
  cidade?: string
  estado?: string
  erro?: boolean
  logradouro?: string
}

export interface CompletarPerfilPayload {
  tipoPerfil: 'cliente' | 'prestador'
  cpf: string
  celular: string
  cep: string
  cidade: string
  bairro: string
  estado: string
  numero: string
  complemento?: string
  categoria?: string
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
    const { data } = await api.post('/api/Usuario/login', payload)

    return normalizeAuthResponse(data, { email: payload.email })
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function register(payload: RegisterPayload): Promise<void> {
  try {
    await api.post('/api/Usuario/registrar', payload)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function fetchCep(cep: string): Promise<CepResponse> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) {
    throw new Error('CEP inválido.')
  }

  try {
    const { data } = await api.get<CepResponse>(`/api/cep/${digits}`)
    if (data && typeof data === 'object' && (data as Record<string, unknown>).erro === true) {
      throw new Error('CEP não encontrado.')
    }
    const res = data as CepResponse
    return {
      localidade: res.localidade ?? res.cidade,
      bairro: res.bairro,
      uf: res.uf ?? res.estado,
    }
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400)) {
      try {
        const viaCep = await axios.get<CepResponse>(`https://viacep.com.br/ws/${digits}/json/`)
        const vc = viaCep.data as CepResponse & { erro?: boolean }
        if (vc.erro) throw new Error('CEP não encontrado.')
        return {
          localidade: vc.localidade ?? vc.cidade,
          bairro: vc.bairro,
          uf: vc.uf ?? vc.estado,
          logradouro: vc.logradouro,
        }
      } catch {
        throw new Error('CEP não encontrado.')
      }
    }
    if (error instanceof Error) throw error
    throw new Error('Erro ao buscar CEP.')
  }
}

export async function getPerfil(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get<AuthUser>('/api/Usuario/perfil')
    return data ?? null
  } catch {
    return null
  }
}

export interface VerificarEmailPayload {
  email: string;
  codigo: string;
}

export interface SolicitarVerificacaoPayload {
  email: string;
}

export interface SolicitarResetPayload {
  email: string;
}

export interface ResetarSenhaPayload {
  email: string;
  codigo: string;
  novaSenha: string;
}

export async function verificarEmail(payload: VerificarEmailPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post('/api/Usuario/verificar', payload)
    return normalizeAuthResponse(data, { email: payload.email })
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function solicitarVerificacao(payload: SolicitarVerificacaoPayload): Promise<void> {
  try {
    await api.post('/api/Usuario/solicitarverificacao', payload)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function solicitarReset(payload: SolicitarResetPayload): Promise<void> {
  try {
    await api.post('/api/Usuario/solicitarreset', payload)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function resetarSenha(payload: ResetarSenhaPayload): Promise<void> {
  try {
    await api.post('/api/Usuario/resetar', payload)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function completarPerfil(payload: CompletarPerfilPayload): Promise<AuthUser> {
  try {
    const { data } = await api.put<AuthUser>('/api/Usuario/perfil', payload)
    return data
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export interface CadastroPayload {
  nome: string
  usuarioId: number
  cpf: string
  dataNascimento: string
  contato: string
  cep: string
  endereco: string
  role: string
}

export async function cadastrar(
  usuarioId: string,
  payload: CadastroPayload,
): Promise<void> {
  try {
    await api.post(`/api/cadastro/cadastrar/${usuarioId}`, payload)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function getCadastro(usuarioId: string): Promise<CadastroPayload> {
  try {
    const { data } = await api.get(`/api/cadastro/getcadastro/${usuarioId}`)
    return data
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function updateCadastro(
  usuarioId: string,
  payload: Partial<Omit<CadastroPayload, 'usuarioId'>>,
): Promise<void> {
  try {
    await api.put(`/api/cadastro/updatecadastro/${usuarioId}`, payload)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export { TOKEN_STORAGE_KEY }

