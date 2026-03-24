import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ServiceCard } from '../components/ui/ServiceCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { getPosts, buscarPosts, api, type Post, type Tag, type PaginatedResponse } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Camera, Wrench, Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import ServiceDetailModal from '../components/ServiceDetailModal';
import { extractFrequentKeywords } from '../utils/textProcessing';

const PAGE_SIZE = 50;

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

// --- Sorting Helper ---
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
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'Cliente' | 'Prestador'>('Cliente');

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

  // --- State Splitting ---
  const [postsCliente, setPostsCliente] = useState<Post[]>([]);
  const [postsPrestador, setPostsPrestador] = useState<Post[]>([]);
  const [pageCliente, setPageCliente] = useState(1);
  const [pagePrestador, setPagePrestador] = useState(1);
  const [hasMoreCliente, setHasMoreCliente] = useState(true);
  const [hasMorePrestador, setHasMorePrestador] = useState(true);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);


  // --- Fetching Logic ---
  const fetcher = async (term: string, page: number, role: 'Cliente' | 'Prestador'): Promise<PaginatedResponse<Post>> => {
    if (term) {
      const response = await buscarPosts(term, page, PAGE_SIZE, role);
      // Sort search results as well
      return { ...response, data: sortPosts(response.data) };
    }
    const postArray = await getPosts(page, PAGE_SIZE, role);
    return {
      data: sortPosts(postArray), // Sort normal feed results
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

  // Initial data load and search execution
  useEffect(() => {
    fetchInitialData(activeSearchTerm);
  }, [activeSearchTerm, fetchInitialData]);

  // Infinite scroll for Cliente
  useEffect(() => {
    if (pageCliente <= 1) return;

    const fetchMoreClientes = async () => {
      setIsFetchingMore(true);
      try {
        const res = await fetcher(activeSearchTerm, pageCliente, 'Cliente');
        setPostsCliente(prev => sortPosts([...prev, ...res.data]));
        setHasMoreCliente(res.page < res.totalPages);
      } catch (error) {
        console.error('Error fetching more client posts:', error);
        setHasMoreCliente(false);
      } finally {
        setIsFetchingMore(false);
      }
    };
    fetchMoreClientes();
  }, [pageCliente, activeSearchTerm]);

  // Infinite scroll for Prestador
  useEffect(() => {
    if (pagePrestador <= 1) return;

    const fetchMorePrestadores = async () => {
      setIsFetchingMore(true);
      try {
        const res = await fetcher(activeSearchTerm, pagePrestador, 'Prestador');
        setPostsPrestador(prev => sortPosts([...prev, ...res.data]));
        setHasMorePrestador(res.page < res.totalPages);
      } catch (error) {
        console.error('Error fetching more provider posts:', error);
        setHasMorePrestador(false);
      } finally {
        setIsFetchingMore(false);
      }
    };
    fetchMorePrestadores();
  }, [pagePrestador, activeSearchTerm]);


  // --- Infinite Scroll Observer ---
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        if (activeTab === 'Cliente' && hasMoreCliente) {
          setPageCliente(p => p + 1);
        } else if (activeTab === 'Prestador' && hasMorePrestador) {
          setPagePrestador(p => p + 1);
        }
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, activeTab, hasMoreCliente, hasMorePrestador]);


  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial tags
  useEffect(() => {
    api.get<Tag[]>('/Tag').then(response => setAllTags(response.data)).catch(err => console.error("Error fetching tags:", err));
  }, []);
  
    // --- UI HANDLERS ---
  const handleSearch = () => {
    const searchTerm = [searchText, ...selectedTags, ...selectedKeywords].join(' ').trim();
    setActiveSearchTerm(searchTerm);
    setIsSearchDropdownOpen(false);
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
    fetchInitialData(activeSearchTerm); // Refetch data
  };

  const toggleTag = (tagName: string) => setSelectedTags(prev => prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]);
  const toggleKeyword = (keyword: string) => setSelectedKeywords(prev => prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]);

  const visibleTags = showAllTags ? allTags : allTags.slice(0, 5);
  
  // --- RENDER LOGIC ---
  const currentPosts = activeTab === 'Cliente' ? postsCliente : postsPrestador;
  const hasMore = activeTab === 'Cliente' ? hasMoreCliente : hasMorePrestador;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">

        {/* --- ADVANCED SEARCH CONTAINER --- */}
        <div className="bg-white shadow-md rounded-xl p-4 mb-6 relative">
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
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button onClick={() => setActiveTab('Cliente')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'Cliente' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Pedidos de Ajuda
            </button>
            <button onClick={() => setActiveTab('Prestador')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'Prestador' ? 'border-brand-orange text-brand-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Profissionais
            </button>
          </nav>
        </div>

        {/* --- POSTS FEED --- */}
        {isLoading ? (
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
        )}
      </main>

      <ServiceDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} isOpen={!!selectedPost} />
      {isCreateModalOpen && selectedRoleForPost && (
        <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} roleSelecionada={selectedRoleForPost} />
      )}
    </div>
  );
};
