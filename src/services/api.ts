import axios, { AxiosError } from 'axios'

const API_BASE_URL = 'https://severino-backend-lqhl.onrender.com/api'

// const API_BASE_URL = 'https://localhost:7023/api'
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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface CadastroPayload {
  nome: string;
  usuarioId: number;
  cpf: string;
  dataNascimento: string;
  contato: string;
  cep: string;
  endereco: string;
  tipoUsuario: number; // 0 = Cliente, 1 = Prestador
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

export interface CepResponse {
  localidade?: string
  bairro?: string
  uf?: string
  cidade?: string
  estado?: string
  erro?: boolean
  logradouro?: string
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

function toErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; title?: string; detail?: string; errors?: any }>;
    const data = axiosError.response?.data;

    if (data && typeof data === 'object') {
      if (data.message && typeof data.message === 'string') return data.message;
      if (data.error && typeof data.error === 'string') return data.error;
      if (data.title && typeof data.title === 'string') return data.title;
      if (data.detail && typeof data.detail === 'string') return data.detail;
    }

    if (typeof data === 'string' && (data as string).length > 0 && (data as string).length < 200) {
      return data;
    }

    const status = axiosError.response?.status;
    if (status === 401) return 'E-mail ou senha inválidos.';
    if (status === 400) return 'Dados inválidos. Verifique e tente novamente.';
    if (status === 409) return 'E-mail já cadastrado.';
    
    return 'Não foi possível concluir a requisição. Tente novamente em instantes.';
  }

  if (error instanceof Error) return error.message;
  return 'Ocorreu um erro inesperado.';
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post('/Usuario/login', payload)
    return normalizeAuthResponse(data, { email: payload.email })
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function register(payload: RegisterPayload): Promise<void> {
  try {
    await api.post('/Usuario/registrar', payload)
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
    const { data } = await api.get<CepResponse>(`/cep/${digits}`)
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
    const { data } = await api.post('/Usuario/verificar', payload)
    return normalizeAuthResponse(data, { email: payload.email })
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function solicitarVerificacao(payload: SolicitarVerificacaoPayload): Promise<void> {
  try {
    await api.post('/Usuario/solicitarverificacao', payload)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function solicitarReset(payload: SolicitarResetPayload): Promise<void> {
  try {
    await api.post('/Usuario/solicitarreset', payload)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function resetarSenha(payload: ResetarSenhaPayload): Promise<void> {
  try {
    await api.post('/Usuario/resetar', payload)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function cadastrar(
  usuarioId: string,
  formData: FormData,
): Promise<void> {
  try {
    await api.post(`/cadastro/cadastrar/${usuarioId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export interface CadastroResponse {
  id: number;
  usuarioId: number;
  nome: string;
  imagemUrl?: string;
  cpf: string;
  dataNascimento: string;
  contato: string;
  cep: string;
  endereco: string;
  tipoUsuario: number;      // 0 = Cliente, 1 = Prestador, 2 = Admin
  prestadorVerificado: boolean;
}

export async function getCadastro(usuarioId: string): Promise<CadastroResponse> {
  try {
    const { data } = await api.get<CadastroResponse>(`/cadastro/getcadastro/${usuarioId}`)
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
    await api.put(`/cadastro/updatecadastro/${usuarioId}`, payload)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export interface Tag {
  id: number;
  nome: string;
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: T[];
}

// --- Post (Anúncio) Endpoints ---

export interface PostPayload {
  titulo: string;
  conteudo: string;
  endereco: string;
  cep: string;
  contato: string;
  role?: string;
  impulsionar?: boolean;
}

// 🔁 NOVA INTERFACE COM MÚLTIPLAS IMAGENS
export interface Post extends PostPayload {
  id: number;
  usuarioId: number;
  nomeUsuario: string;
  dataCriacao: string;
  imagens: { id: number; url: string }[];   
  impulsionar?: boolean;
  role?: string;
  categoria?: string;
  comentarios?: number;
  tags?: Tag[];
  cadastro: {
    nome: string;
    cpf: string;
    dataNascimento: string;
    endereco: string;
    cep: string;
    contato: string;
    imagemUrl: string | null;
    prestadorVerificado: boolean | null;
  }
}

export async function createPost(
  usuarioId: string,
  formData: FormData,
): Promise<Post> {
  try {
    const { data } = await api.post<Post>(`/post/postar/${usuarioId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function getPosts(page: number = 1, pageSize: number = 50, role: 'Cliente' | 'Prestador'): Promise<Post[]> {
  try {
    const { data } = await api.get<Post[]>(`/post/getposts?page=${page}&pageSize=${pageSize}&role=${role}`);
    return data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function buscarPosts(
  termo: string,
  page: number = 1,
  pageSize: number = 50,
  role: 'Cliente' | 'Prestador'
): Promise<PaginatedResponse<Post>> {
  try {
    const { data } = await api.post<PaginatedResponse<Post>>(
      `/Post/getpost/buscar?page=${page}&pageSize=${pageSize}&role=${role}`,
      { termo },
    );
    return data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function getUserPosts(usuarioId: string): Promise<Post[]> {
  try {
    const response = await api.get<Post[]>(`/post/getposts/usuario/${usuarioId}`)

    return response.data
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function editPost(
  idpost: string,
  payload: PostPayload,
): Promise<Post> {
  try {
    const { data } = await api.put<Post>(`/post/editar/${idpost}`, payload)
    return data
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function deletePost(idpost: string): Promise<void> {
  try {
    await api.delete(`/post/deletarpost/${idpost}`)
  } catch (error) {
    throw new Error(toErrorMessage(error))
  }
}

export async function getPostById(id: string | number): Promise<Post> {
  try {
    const { data } = await api.get<Post>(`/post/getpost/${id}`);
    return data;
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

// --- COMENTÁRIOS ---

export interface Comentario {
  id: number;
  conteudo: string;
  usuario: {
    id: number;
    nome: string;
  };
  valorDeLance: number;
}

export interface ComentarioPayload {
  postId: number;
  conteudo: string;
  valorDeLance: number;
}

export async function criarComentario(usuarioId: number | string, dados: ComentarioPayload): Promise<Comentario> {
  const { data } = await api.post(`/Post/Comentario/comentar/${usuarioId}`, dados);
  return data;
}

export async function getComentariosPorPost(postId: number | string): Promise<Comentario[]> {
  const { data } = await api.get(`/Post/Comentario/getcomentarioporpost/${postId}`);
  return data;
}

export async function deletarComentario(comentarioId: number | string): Promise<void> {
  await api.delete(`/Post/Comentario/comentario/${comentarioId}`);
}

export async function editarComentario(comentarioId: number | string, conteudo: string, valorDeLance: number): Promise<Comentario> {
  const { data } = await api.put(`/Post/Comentario/editarcomentario/${comentarioId}?id=${comentarioId}`, { conteudo, valorDeLance });
  return data;
}

// --- VERIFICAÇÃO (KYC) ---

export const SituacaoVerificacao = {
  Aguardando: 0,
  Aprovado: 1,
  Rejeitado: 2,
} as const;

export type SituacaoVerificacao = typeof SituacaoVerificacao[keyof typeof SituacaoVerificacao];


export interface Verificacao {
  id: number;
  usuarioId: number;
  imagemUrl: string;
  imagemFileId?: string;
  situacao: SituacaoVerificacao;
  updatedBy?: { id: number; nome: string };
  dataSolicitacao: string;
  dataAvaliacao?: string;
  nomeCadastro?: string;
}

// Para o Usuário
export const getEstadoVerificacao = (cadastroId: number) => 
  api.get<Verificacao>(`/Verificacao/getestadoverificacao/${cadastroId}`);

// Para o Admin

  export async function getEstadoVerificacaoGeral(): Promise<Verificacao[]> {
  const response = await  api.get<Verificacao[]>('/Verificacao/getestadoverificacaogeral');

  return response.data
}

// Ação do Admin (PUT)
export const avaliarVerificacao = (verificacaoId: number, adminId: number, situacao: number) =>
  api.put(`/Verificacao/avaliar/${verificacaoId}`, { adminId, situacao });

  export async function enviarVerificacao(cadastroId: number, formData: FormData): Promise<void> {
  const response = await  api.post<Verificacao>(`/Verificacao/enviarverificacao/${cadastroId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export { TOKEN_STORAGE_KEY }