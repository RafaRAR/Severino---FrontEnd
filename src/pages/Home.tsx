import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ServiceCard } from '../components/ui/ServiceCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { getPosts, buscarPosts, api, type Post, type Tag } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Camera, Wrench, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import ServiceDetailModal from '../components/ServiceDetailModal';
import { extractFrequentKeywords } from '../utils/textProcessing';

// Define a consistent page size
const PAGE_SIZE = 50;

// Re-usable avatar component
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

export const Home: React.FC = () => {
  const { user, profile, setOpenModal } = useAuth();

  // Feed and Modal States
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRoleForPost, setSelectedRoleForPost] = useState<'Cliente' | 'Prestador' | null>(null);

  // Search and Filter States
  const [searchText, setSearchText] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [frequentKeywords, setFrequentKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  // Loading and Pagination States
  const [isLoading, setIsLoading] = useState(true); // Initial page load
  const [isFetchingMore, setIsFetchingMore] = useState(false); // Infinite scroll fetching
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);


  // Infinite Scroll Observer
  const observer = useRef<IntersectionObserver | null>(null)

  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore]);

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
    const fetchTags = async () => {
      try {
        const { data } = await api.get<Tag[]>('/Tag');
        setAllTags(data);
      } catch (error) {
        console.error("Error fetching tags:", error);
      }
    };
    fetchTags();
  }, []);

  // Fetch posts on page change or search activation
  useEffect(() => {
    const fetchPostsAndHandleState = async () => {
      // Set loading state
      if (page === 1) setIsLoading(true);
      else setIsFetchingMore(true);

      try {
        if (isSearchActive) {
          // --- SEARCH LOGIC ---
          // Do not fetch if search term is empty, just clear posts
          if (!activeSearchTerm) {
            setPosts([]);
            setHasMore(false);
            return;
          }
          const response = await buscarPosts(activeSearchTerm, page, PAGE_SIZE);

          if (page === 1) {
            setPosts(response.data);
          } else {
            setPosts(prev => [...prev, ...response.data]);
          }
          setHasMore(response.page < response.totalPages);

        } else {
          // --- NORMAL FEED LOGIC ---
          const newPosts = await getPosts(page, PAGE_SIZE);

          if (page === 1) {
            setPosts(newPosts);
            setFrequentKeywords(extractFrequentKeywords(newPosts));
          } else {
            setPosts(prev => [...prev, ...newPosts]);
          }
          setHasMore(newPosts.length === PAGE_SIZE);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setHasMore(false); // Stop fetching on error
      } finally {
        // Reset loading state
        if (page === 1) setIsLoading(false);
        setIsFetchingMore(false);
      }
    };

    fetchPostsAndHandleState();
  }, [page, isSearchActive, activeSearchTerm]);

  // --- SEARCH TRIGGER ---
  const handleSearch = () => {
    const searchTerm = [searchText, ...selectedTags, ...selectedKeywords].join(' ').trim();
    setActiveSearchTerm(searchTerm);
    setIsSearchActive(true);
    setPage(1);
    setIsSearchDropdownOpen(false);
  };

  const clearSearchAndReturnToFeed = () => {
    setIsSearchActive(false);
    setSearchText('');
    setSelectedTags([]);
    setSelectedKeywords([]);
    setActiveSearchTerm('');
    setPage(1);
  }

  // --- UI HANDLERS ---
  const handleCreatePostClick = (role: 'Cliente' | 'Prestador') => {
    if (!user) {
      setOpenModal("login");
      return;
    }
    setSelectedRoleForPost(role);
    setIsCreateModalOpen(true);
  };

  const handleCardClick = (post: Post) => setSelectedPost(post);
  const handleCloseDetailModal = () => setSelectedPost(null);
  const handlePostCreated = () => {
    setIsCreateModalOpen(false);
    setSelectedRoleForPost(null);
    // Reset and refetch
    setIsSearchActive(false);
    setPage(1);
    setPosts([]);
    setHasMore(true);
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    );
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };

  const visibleTags = showAllTags ? allTags : allTags.slice(0, 5);

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
                    placeholder={user ? `O que você precisa hoje, ${profile?.nome.split(' ')[0]}?` : 'Buscar por serviços ou profissionais...'}
                    className="w-full bg-gray-100 border-2 border-transparent rounded-l-xl p-3 pr-4 text-brand-navy placeholder-gray-500 focus:bg-white focus:border-brand-orange focus:outline-none transition-colors"
                  />
                  <button onClick={handleSearch} className="bg-brand-orange text-white px-6 py-3 h-full rounded-r-xl font-semibold hover:bg-orange-600 transition-colors flex items-center">
                    <Search size={20} className="mr-2 hidden sm:inline" />
                    Buscar
                  </button>
                </div>

                {/* --- SEARCH DROPDOWN --- */}
                {isSearchDropdownOpen && (
                  <div className="absolute z-20 mt-2 w-full max-h-[60vh] overflow-y-auto rounded-xl border bg-white p-4 shadow-xl">
                    {/* Tags Section */}
                    <h3 className="text-sm font-semibold text-brand-navy mb-2">Serviços</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {visibleTags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.nome)}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedTags.includes(tag.nome) ? 'bg-brand-orange text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
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

                    {/* Keywords Section */}
                    {frequentKeywords.length > 0 && (
                      <>
                        <div className="border-t border-gray-100 my-3"></div>
                        <h3 className="text-sm font-semibold text-brand-navy mb-2">Palavras-Chave Populares</h3>
                        <div className="flex flex-wrap gap-2">
                          {frequentKeywords.map(keyword => (
                            <button
                              key={keyword}
                              onClick={() => toggleKeyword(keyword)}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedKeywords.includes(keyword) ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                            >
                              {keyword}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4"></div>

          {/* --- ACTION BUTTONS --- */}
          <div className="flex justify-around items-center flex-wrap gap-4">
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition font-medium" onClick={() => handleCreatePostClick('Cliente')}>
              <Camera size={20} className="text-red-500" />
              <span>Pedir Ajuda</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition font-medium" onClick={() => handleCreatePostClick('Prestador')}>
              <Wrench size={20} className="text-blue-500" />
              <span>Oferecer Serviço</span>
            </button>
            <button className="flex items-center gap-2 text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-md px-4 py-2 rounded-lg transition font-medium" onClick={() => alert('Funcionalidade de IA em breve!')}>
              <span className="font-bold text-lg">✨</span>
              <span>Criar com IA</span>
            </button>
          </div>
        </div>

        {/* --- POSTS FEED --- */}
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="animate-spin text-brand-orange" size={40} />
            <p className="ml-4 text-lg text-gray-600">Carregando anúncios...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-xl shadow-sm">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">Nenhum anúncio encontrado</h3>
            <p className="text-gray-500 mt-2">Tente alterar os termos da sua busca ou publique uma nova solicitação.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => {
                if (posts.length === index + 1) {
                  return <div ref={lastPostElementRef} key={post.id}><ServiceCard post={post} onClick={() => handleCardClick(post)} /></div>;
                } else {
                  return <ServiceCard key={post.id} post={post} onClick={() => handleCardClick(post)} />;
                }
              })}
            </div>
            {isFetchingMore && (
              <div className="flex justify-center items-center p-6">
                <Loader2 className="animate-spin text-brand-orange" size={32} />
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <div className="text-center p-10 text-gray-500">
                <p>Fim dos resultados.</p>
              </div>
            )}
          </>
        )}
      </main>

      <ServiceDetailModal post={selectedPost} onClose={handleCloseDetailModal} isOpen={!!selectedPost} />
      {isCreateModalOpen && selectedRoleForPost && (
        <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onPostCreated={handlePostCreated} roleSelecionada={selectedRoleForPost} />
      )}
    </div>
  );
};