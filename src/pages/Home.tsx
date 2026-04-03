import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ServiceCard } from '../components/ui/ServiceCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { 
  getPosts, 
  buscarPosts, 
  api, 
  type Post, 
  type Tag, 
  type PaginatedResponse,
  getEstadoVerificacaoGeral,
  avaliarVerificacao,
  getUserPosts
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Camera, Wrench, Search, ChevronDown, ChevronUp, X, Check, Ban, UserCircle } from 'lucide-react';
import ServiceDetailModal from '../components/ServiceDetailModal';
import { extractFrequentKeywords } from '../utils/textProcessing';
import { toast } from 'react-toastify';

const PAGE_SIZE = 50;

// Tipagem local expandida
export interface VerificacaoAdmin {
  id: number;
  usuarioId: number;
  nomeCadastro?: string;
  imagemUrl: string;
  situacao: number;
  dataSolicitacao: string;
  dataAvaliacao?: string | null;
  updatedBy?: { id: number; nome: string } | null;
}

const UserAvatar = ({ user }: { user: { nome: string; foto?: string } }) => {
  const initials = user.nome.split(' ').map((n) => n[0]).slice(0, 2).join('');
  return (
    <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center font-bold text-brand-navy">
      {user.foto ? (
        <img src={user.foto} alt={user.nome} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

// Sorting Helper
const sortPosts = (posts: Post[]): Post[] => {
  return [...posts].sort((a, b) => {
    const aBoosted = a.impulsionar === true;
    const bBoosted = b.impulsionar === true;
    if (aBoosted && !bBoosted) return -1;
    if (!aBoosted && bBoosted) return 1;
    return 0;
  });
};

export const Home: React.FC = () => {
  const { user, profile, setOpenModal } = useAuth();

  // Modal States
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRoleForPost, setSelectedRoleForPost] = useState<'Cliente' | 'Prestador' | null>(null);
  
  // Tab State - Adicionado 'MeusPosts'
  const [activeTab, setActiveTab] = useState<'Cliente' | 'Prestador' | 'ValidarUsuarios' | 'MeusPosts'>('Cliente');

  // Search and Filter States
  const [searchText, setSearchText] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [frequentKeywords, setFrequentKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // --- Feed State ---
  const [postsCliente, setPostsCliente] = useState<Post[]>([]);
  const [postsPrestador, setPostsPrestador] = useState<Post[]>([]);
  const [pageCliente, setPageCliente] = useState(1);
  const [pagePrestador, setPagePrestador] = useState(1);
  const [hasMoreCliente, setHasMoreCliente] = useState(true);
  const [hasMorePrestador, setHasMorePrestador] = useState(true);
  
  // --- Admin State ---
  const [verificacoes, setVerificacoes] = useState<VerificacaoAdmin[]>([]);
  const [isLoadingVerificacoes, setIsLoadingVerificacoes] = useState(false);

  // --- Meus Posts State ---
  const [meusPosts, setMeusPosts] = useState<Post[]>([]);
  const [isLoadingMeusPosts, setIsLoadingMeusPosts] = useState(false);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const isAdmin = profile?.tipoUsuario === 2;

  // --- Fetching Logic Feed ---
  const fetcher = async (term: string, page: number, role: 'Cliente' | 'Prestador'): Promise<PaginatedResponse<Post>> => {
    if (term) {
      const response = await buscarPosts(term, page, PAGE_SIZE, role);
      return { ...response, data: sortPosts(response.data) };
    }
    const postArray = await getPosts(page, PAGE_SIZE, role);
    return {
      data: sortPosts(postArray),
      page,
      pageSize: PAGE_SIZE,
      totalPages: postArray.length < PAGE_SIZE ? page : page + 1,
      total: -1
    };
  };

  const fetchInitialData = useCallback(async (term: string = '') => {
    setIsLoading(true);
    setPostsCliente([]);
    setPostsPrestador([]);
    setPageCliente(1);
    setPagePrestador(1);

    try {
      const [resCliente, resPrestador] = await Promise.all([
        fetcher(term, 1, 'Cliente'),
        fetcher(term, 1, 'Prestador')
      ]);

      setPostsCliente(resCliente.data);
      setHasMoreCliente(resCliente.page < resCliente.totalPages);

      setPostsPrestador(resPrestador.data);
      setHasMorePrestador(resPrestador.page < resPrestador.totalPages);

      if (!term) {
         setFrequentKeywords(extractFrequentKeywords([...resCliente.data, ...resPrestador.data]));
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setHasMoreCliente(false);
      setHasMorePrestador(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch das Validações (Admin)
  const fetchVerificacoes = useCallback(async () => {
    setIsLoadingVerificacoes(true);
    try {
      const response = await getEstadoVerificacaoGeral();
      const dados = Array.isArray(response) ? response : response; 
      const ordenado = dados.sort((a: VerificacaoAdmin, b: VerificacaoAdmin) => {
        if (a.situacao === 0 && b.situacao !== 0) return -1;
        if (a.situacao !== 0 && b.situacao === 0) return 1;
        return new Date(b.dataSolicitacao).getTime() - new Date(a.dataSolicitacao).getTime();
      });
      setVerificacoes(ordenado);
    } catch (error) {
      toast.error('Não foi possível carregar as validações.');
    } finally {
      setIsLoadingVerificacoes(false);
    }
  }, []);

  // Fetch dos Meus Posts
  const fetchMeusPosts = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoadingMeusPosts(true);
    try {
      // Converte o ID para string para bater com a assinatura do seu serviço
      if (!user?.id) return;
      const posts = await getUserPosts(user.id.toString());
      setMeusPosts(sortPosts(posts));
    } catch (error) {
      console.error('Erro ao buscar meus posts:', error);
      toast.error('Não foi possível carregar seus posts.');
    } finally {
      setIsLoadingMeusPosts(false);
    }
  }, [profile?.id]);

  // UseEffects de Inicialização
  useEffect(() => {
    fetchInitialData(activeSearchTerm);
  }, [activeSearchTerm, fetchInitialData]);

  // Carrega verificações ao trocar para a tab de Admin
  useEffect(() => {
    if (activeTab === 'ValidarUsuarios' && isAdmin) {
      fetchVerificacoes();
    }
  }, [activeTab, isAdmin, fetchVerificacoes]);

  // Carrega Meus Posts ao trocar para a tab de Meus Posts
  useEffect(() => {
    if (activeTab === 'MeusPosts' && profile?.id) {
      fetchMeusPosts();
    }
  }, [activeTab, profile?.id, fetchMeusPosts]);

  // Infinite scroll Cliente
  useEffect(() => {
    if (pageCliente <= 1 || activeTab !== 'Cliente') return;
    const fetchMoreClientes = async () => {
      setIsFetchingMore(true);
      try {
        const res = await fetcher(activeSearchTerm, pageCliente, 'Cliente');
        setPostsCliente(prev => sortPosts([...prev, ...res.data]));
        setHasMoreCliente(res.page < res.totalPages);
      } catch (error) {
        setHasMoreCliente(false);
      } finally {
        setIsFetchingMore(false);
      }
    };
    fetchMoreClientes();
  }, [pageCliente, activeSearchTerm, activeTab]);

  // Infinite scroll Prestador
  useEffect(() => {
    if (pagePrestador <= 1 || activeTab !== 'Prestador') return;
    const fetchMorePrestadores = async () => {
      setIsFetchingMore(true);
      try {
        const res = await fetcher(activeSearchTerm, pagePrestador, 'Prestador');
        setPostsPrestador(prev => sortPosts([...prev, ...res.data]));
        setHasMorePrestador(res.page < res.totalPages);
      } catch (error) {
        setHasMorePrestador(false);
      } finally {
        setIsFetchingMore(false);
      }
    };
    fetchMorePrestadores();
  }, [pagePrestador, activeSearchTerm, activeTab]);

  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore || activeTab === 'ValidarUsuarios' || activeTab === 'MeusPosts') return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (activeTab === 'Cliente' && hasMoreCliente) setPageCliente(p => p + 1);
        else if (activeTab === 'Prestador' && hasMorePrestador) setPagePrestador(p => p + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, activeTab, hasMoreCliente, hasMorePrestador]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    api.get<Tag[]>('/Tag').then(response => setAllTags(response.data)).catch(err => console.error("Error fetching tags:", err));
  }, []);
  
  // UI HANDLERS
  const handleSearch = () => {
    const searchTerm = [searchText, ...selectedTags, ...selectedKeywords].join(' ').trim();
    setActiveSearchTerm(searchTerm);
    setIsSearchDropdownOpen(false);
    // Se fizer uma busca, é bom voltar pro feed normal caso estivesse nos Meus Posts
    if (activeTab === 'MeusPosts' || activeTab === 'ValidarUsuarios') {
      setActiveTab('Cliente');
    }
  };
  
  const clearSearchAndReturnToFeed = () => {
    setSearchText('');
    setSelectedTags([]);
    setSelectedKeywords([]);
    setActiveSearchTerm('');
  };

  const handleCreatePostClick = (role: 'Cliente' | 'Prestador') => {
    if (!user) return setOpenModal("login");
    setSelectedRoleForPost(role);
    setIsCreateModalOpen(true);
  };

  const handlePostCreated = () => {
    setIsCreateModalOpen(false);
    setSelectedRoleForPost(null);
    fetchInitialData(activeSearchTerm);
    if (activeTab === 'MeusPosts') {
      fetchMeusPosts(); // Atualiza a aba Meus Posts também!
    }
  };

  const toggleTag = (tagName: string) => setSelectedTags(prev => prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]);
  const toggleKeyword = (keyword: string) => setSelectedKeywords(prev => prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]);

  const handleAvaliarVerificacao = async (verificacaoId: number, novaSituacao: number) => {
    if (!profile?.id) return;
    try {
      await avaliarVerificacao(verificacaoId, Number(profile.id), novaSituacao);
      toast.success(novaSituacao === 1 ? 'Usuário aprovado!' : 'Usuário rejeitado!');
      setVerificacoes(prev => prev.map(v => 
        v.id === verificacaoId 
          ? { 
              ...v, 
              situacao: novaSituacao, 
              dataAvaliacao: new Date().toISOString(), 
              updatedBy: { id: Number(profile.id), nome: profile.nome || 'Admin' } 
            } 
          : v
      ));
    } catch (error) {
      toast.error('Erro ao processar avaliação.');
    }
  };

  const visibleTags = showAllTags ? allTags : allTags.slice(0, 5);
  const currentPosts = activeTab === 'Cliente' ? postsCliente : postsPrestador;
  const hasMore = activeTab === 'Cliente' ? hasMoreCliente : hasMorePrestador;

  // Renderizador da Aba: Meus Posts
  const renderMeusPostsTab = () => {
    if (isLoadingMeusPosts) {
      return (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="animate-spin text-brand-orange" size={40} />
          <p className="ml-4 text-lg text-gray-600">Carregando seus anúncios...</p>
        </div>
      );
    }

    if (meusPosts.length === 0) {
      return (
        <div className="text-center p-10 bg-white rounded-xl shadow-sm">
          <UserCircle size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700">Você ainda não tem anúncios</h3>
          <p className="text-gray-500 mt-2 mb-6">
            Crie um anúncio oferecendo seus serviços ou pedindo ajuda.
          </p>
          <div className="flex justify-center gap-4">
            <button className="text-brand-orange hover:underline font-medium" onClick={() => handleCreatePostClick('Prestador')}>
              Oferecer Serviço
            </button>
            <span className="text-gray-300">|</span>
            <button className="text-brand-orange hover:underline font-medium" onClick={() => handleCreatePostClick('Cliente')}>
              Pedir Ajuda
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meusPosts.map((post) => (
          <ServiceCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
        ))}
      </div>
    );
  };

  // Renderizador da Aba: Admin
  const renderAdminTab = () => {
    if (isLoadingVerificacoes) {
      return (
        <div className="flex justify-center items-center p-10">
          <Loader2 className="animate-spin text-brand-orange" size={40} />
          <p className="ml-4 text-lg text-gray-600">Carregando validações...</p>
        </div>
      );
    }

    if (verificacoes.length === 0) {
      return (
        <div className="text-center p-10 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">Nenhuma solicitação de validação encontrada.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {verificacoes.map((verificacao) => (
          <div key={verificacao.id} className="bg-white rounded-xl shadow-md p-5 border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={verificacao.imagemUrl} 
                  alt={verificacao.nomeCadastro} 
                  className="w-16 h-16 rounded-lg object-cover bg-gray-100 cursor-pointer hover:opacity-80 transition"
                  onClick={() => window.open(verificacao.imagemUrl, '_blank')}
                />
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{verificacao.nomeCadastro}</h3>
                  <p className="text-sm text-gray-500">ID: {verificacao.usuarioId}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <p>
                  <strong>Data da Solicitação:</strong>{' '}
                  {new Date(verificacao.dataSolicitacao).toLocaleDateString('pt-BR')}
                </p>
                <div className="flex items-center gap-2">
                  <strong>Status:</strong> 
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    verificacao.situacao === 0 ? 'bg-yellow-100 text-yellow-800' : 
                    verificacao.situacao === 1 ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {verificacao.situacao === 0 ? 'Aguardando' : verificacao.situacao === 1 ? 'Aprovado' : 'Rejeitado'}
                  </span>
                </div>
                
                {verificacao.updatedBy && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-xs text-gray-500">
                      Atualizado por: <strong>{verificacao.updatedBy.nome}</strong> em{' '}
                      {verificacao.dataAvaliacao ? new Date(verificacao.dataAvaliacao).toLocaleDateString('pt-BR') : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {verificacao.situacao === 0 ? (
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAvaliarVerificacao(verificacao.id, 1)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition"
                >
                  <Check size={18} /> Aprovar
                </button>
                <button 
                  onClick={() => handleAvaliarVerificacao(verificacao.id, 2)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium flex justify-center items-center gap-2 transition"
                >
                  <Ban size={18} /> Rejeitar
                </button>
              </div>
            ) : (
              <button 
                onClick={() => handleAvaliarVerificacao(verificacao.id, 0)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium text-sm transition"
              >
                Desfazer Avaliação
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">

        {/* --- ADVANCED SEARCH CONTAINER --- */}
        <div className="bg-white shadow-md rounded-xl p-4 mb-6 relative">
          {/* ... (Seção de busca mantida igual, apenas com a navegação pro activeTab na busca) ... */}
          <div className="flex items-start gap-4">
            {user ? <UserAvatar user={{ nome: user.name, foto: profile?.imagemUrl }} /> : <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0" />}
            <div className="w-full">
              <div className="relative" ref={searchContainerRef}>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onFocus={() => setIsSearchDropdownOpen(true)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={user ? `O que você precisa hoje, ${profile?.nome.split(' ')[0]}?` : 'Buscar por serviços ou profissionais...'}
                    className="w-full bg-gray-100 border-2 border-transparent rounded-l-xl p-3 pr-4 text-brand-navy placeholder-gray-500 focus:bg-white focus:border-brand-orange focus:outline-none transition-colors"
                  />
                  <button onClick={handleSearch} className="bg-brand-orange text-white px-6 py-3 h-full rounded-r-xl font-semibold hover:bg-orange-600 transition-colors flex items-center">
                    <Search size={20} className="mr-2 hidden sm:inline" />
                    Buscar
                  </button>
                </div>
                 {isSearchDropdownOpen && (
                  <div className="absolute z-20 mt-2 w-full max-h-[60vh] overflow-y-auto rounded-xl border bg-white p-4 shadow-xl">
                    <h3 className="text-sm font-semibold text-brand-navy mb-2">Serviços</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {visibleTags.map(tag => (
                        <button key={tag.id} onClick={() => toggleTag(tag.nome)} className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedTags.includes(tag.nome) ? 'bg-brand-orange text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                          {tag.nome}
                        </button>
                      ))}
                    </div>
                    {allTags.length > 5 && (
                      <button onClick={() => setShowAllTags(!showAllTags)} className="text-sm text-brand-orange hover:underline flex items-center mb-4">
                        {showAllTags ? 'Ver menos' : 'Ver mais'}
                        {showAllTags ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                      </button>
                    )}
                    {frequentKeywords.length > 0 && (
                      <>
                        <div className="border-t border-gray-100 my-3"></div>
                        <h3 className="text-sm font-semibold text-brand-navy mb-2">Palavras-Chave Populares</h3>
                        <div className="flex flex-wrap gap-2">
                          {frequentKeywords.map(keyword => (
                            <button key={keyword} onClick={() => toggleKeyword(keyword)} className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedKeywords.includes(keyword) ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                              {keyword}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              {activeSearchTerm && (
                <div 
                  onClick={clearSearchAndReturnToFeed}
                  className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors mt-2 px-2 py-1 rounded-md hover:bg-red-50 cursor-pointer"
                >
                  <X size={16} />
                  <span>Limpar Filtros</span>
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-gray-100 my-4"></div>
          <div className="flex justify-around items-center flex-wrap gap-4">
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition font-medium" onClick={() => handleCreatePostClick('Cliente')}>
              <Camera size={20} className="text-red-500" />
              <span>Pedir Ajuda</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition font-medium" onClick={() => handleCreatePostClick('Prestador')}>
              <Wrench size={20} className="text-blue-500" />
              <span>Oferecer Serviço</span>
            </button>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            <button onClick={() => setActiveTab('Cliente')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'Cliente' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Pedidos de Ajuda
            </button>
            <button onClick={() => setActiveTab('Prestador')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'Prestador' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Profissionais
            </button>
            
            {/* Aba Meus Posts (Visível se logado) */}
            {profile && (
              <button onClick={() => setActiveTab('MeusPosts')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'MeusPosts' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                Meus Anúncios
              </button>
            )}

            {/* Tab protegida para Admins */}
            {isAdmin && (
              <button 
                onClick={() => setActiveTab('ValidarUsuarios')} 
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1 ${activeTab === 'ValidarUsuarios' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Validar Usuários 
                {verificacoes.filter(v => v.situacao === 0).length > 0 && activeTab !== 'ValidarUsuarios' && (
                   <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>
                )}
              </button>
            )}
          </nav>
        </div>

        {/* --- CONTENT AREA --- */}
        {activeTab === 'ValidarUsuarios' ? (
           renderAdminTab()
        ) : activeTab === 'MeusPosts' ? (
           renderMeusPostsTab()
        ) : (
          /* FEED DE POSTS NORMAL */
          isLoading ? (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="animate-spin text-brand-orange" size={40} />
              <p className="ml-4 text-lg text-gray-600">Carregando anúncios...</p>
            </div>
          ) : currentPosts.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-xl shadow-sm">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-700">Nenhum anúncio encontrado</h3>
              <p className="text-gray-500 mt-2">
                {activeSearchTerm ? "Tente alterar os termos da sua busca." : "Ainda não há anúncios nesta categoria."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentPosts.map((post, index) => {
                  if (currentPosts.length === index + 1) {
                    return <div ref={lastPostElementRef} key={post.id}><ServiceCard post={post} onClick={() => setSelectedPost(post)} /></div>;
                  }
                  return <ServiceCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />;
                })}
              </div>
              {isFetchingMore && (
                <div className="flex justify-center items-center p-6">
                  <Loader2 className="animate-spin text-brand-orange" size={32} />
                </div>
              )}
              {!hasMore && currentPosts.length > 0 && (
                <div className="text-center p-10 text-gray-500">
                  <p>Fim dos resultados.</p>
                </div>
              )}
            </>
          )
        )}
      </main>

      <ServiceDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} isOpen={!!selectedPost} />
      {isCreateModalOpen && selectedRoleForPost && (
        <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} roleSelecionada={selectedRoleForPost} />
      )}
    </div>
  );
};