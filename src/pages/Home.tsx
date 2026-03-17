import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceCard } from '../components/ui/ServiceCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { getAllPosts, api, type Post, type Tag } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Camera, Wrench, X, Search } from 'lucide-react';
import ServiceDetailModal from '../components/ServiceDetailModal';

type PostType = 'Cliente' | 'Prestador';

const UserAvatar = ({ user }: { user: { nome: string; foto?: string } }) => {
  const initials = user.nome.split(' ').map((n) => n[0]).slice(0, 2).join('');
  return (
    <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center font-bold text-gray-600">
      {user.foto ? (
        <img src={user.foto} alt={user.nome} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

export const Home: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PostType>('Cliente');
  const [selectedRoleForPost, setSelectedRoleForPost] = useState<'Cliente' | 'Prestador' | null>(null);

  // --- ESTADOS PARA O FILTRO DE TAGS ---
  const [tagsDisponiveis, setTagsDisponiveis] = useState<Tag[]>([]);
  const [tagsFiltro, setTagsFiltro] = useState<number[]>([]);
  const [buscaTag, setBuscaTag] = useState('');
  const [dropdownAberto, setDropdownAberto] = useState(false);

  // Busca os posts
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPosts = await getAllPosts();
      setPosts(fetchedPosts.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()));
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Busca as tags na inicialização
  useEffect(() => {
    fetchPosts();
    const fetchTags = async () => {
      try {
        const { data } = await api.get<Tag[]>('/Tag');
        setTagsDisponiveis(data);
      } catch (error) {
        console.error("Erro ao carregar as tags para o filtro:", error);
      }
    };
    fetchTags();
  }, [fetchPosts]);

  const handleCreatePostClick = (role: 'Cliente' | 'Prestador') => {
    if (user) {
      setSelectedRoleForPost(role);
      setIsCreateModalOpen(true);
    } else {
      alert('Faça login para publicar na plataforma.');
      navigate('/login');
    }
  };

  const handleCardClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handleCloseDetailModal = () => {
    setSelectedPost(null);
  };

  const handlePostCreated = () => {
    setIsCreateModalOpen(false);
    setSelectedRoleForPost(null);
    fetchPosts();
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedRoleForPost(null);
  }

  // --- LÓGICA DO FILTRO DO DROPDOWN ---
  const tagsFiltradas = tagsDisponiveis.filter(tag => 
    tag.nome.toLowerCase().includes(buscaTag.toLowerCase()) &&
    !tagsFiltro.includes(tag.id)
  );

  const adicionarFiltro = (id: number) => {
    setTagsFiltro(prev => [...prev, id]);
    setBuscaTag('');
    setDropdownAberto(false);
  };

  const removerFiltro = (id: number) => {
    setTagsFiltro(prev => prev.filter(tagId => tagId !== id));
  };

  // --- LÓGICA DE FILTRAGEM DOS POSTS NA TELA ---
  const filteredPosts = posts.filter(post => {
    // 1. O post deve pertencer à aba atual (Cliente ou Prestador)
    const matchesTab = post.role === activeTab;
    
    // 2. Se não houver tags no filtro, mostra todos. 
    // Se houver, o post PRECISA ter pelo menos UMA das tags selecionadas.
    const matchesTags = tagsFiltro.length === 0 || (
      post.tags && post.tags.some(postTag => tagsFiltro.includes(postTag.id))
    );

    return matchesTab && matchesTags;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">

        {/* Create Post / Filtro Inteligente */}
        <div className="bg-white shadow-sm rounded-xl p-4 mb-6 relative">
          <div className="flex items-start gap-4">
            {user ? <UserAvatar user={{ nome: user.name, foto: profile?.imagemUrl || undefined }} /> : <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0" />}
            
            <div className="w-full">
              {/* O COMBOBOX INTERATIVO */}
              <div className="relative">
                <div className="flex items-center w-full bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-brand-navy focus-within:bg-white transition-colors">
                  <Search size={18} className="text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={buscaTag}
                    onChange={(e) => {
                      setBuscaTag(e.target.value);
                      setDropdownAberto(true);
                    }}
                    onFocus={() => setDropdownAberto(true)}
                    onBlur={() => {
                      setTimeout(() => setDropdownAberto(false), 200);
                    }}
                    placeholder={user ? `Qual problema você precisa resolver, ${profile?.nome.split(' ')[0]}?` : 'Qual problema você precisa resolver hoje?'}
                    className="bg-transparent w-full outline-none text-brand-navy placeholder-gray-500"
                  />
                </div>

                {/* Dropdown de Sugestões */}
                {dropdownAberto && tagsFiltradas.length > 0 && (
                  <ul className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                    {tagsFiltradas.map((tag) => (
                      <li
                        key={tag.id}
                        onMouseDown={(e) => {
                          e.preventDefault(); 
                          adicionarFiltro(tag.id);
                        }}
                        className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-brand-orange hover:text-white transition-colors"
                      >
                        {tag.nome}
                      </li>
                    ))}
                  </ul>
                )}
                {dropdownAberto && buscaTag && tagsFiltradas.length === 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-xl">
                    Nenhuma categoria encontrada para o filtro.
                  </div>
                )}
              </div>

              {/* Balõezinhos das tags selecionadas para o filtro */}
              {tagsFiltro.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 ml-2">
                  <span className="text-sm text-gray-500 flex items-center">Filtrando por:</span>
                  {tagsFiltro.map((tagId) => {
                    const tag = tagsDisponiveis.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span
                        key={tag.id}
                        className="flex items-center gap-1 bg-brand-orange text-white px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {tag.nome}
                        <button
                          onClick={() => removerFiltro(tag.id)}
                          className="ml-1 rounded-full p-0.5 hover:bg-orange-600 transition-colors focus:outline-none"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-100 my-4"></div>
          
          <div className="flex justify-around">
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

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('Cliente')}
              className={`px-3 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ease-in-out ${activeTab === 'Cliente'
                ? 'border-b-2 border-brand-orange text-brand-orange'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Pedidos de Ajuda
            </button>
            <button
              onClick={() => setActiveTab('Prestador')}
              className={`px-3 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ease-in-out ${activeTab === 'Prestador'
                ? 'border-b-2 border-brand-orange text-brand-orange'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Profissionais
            </button>
          </nav>
        </div>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="flex justify-center items-center p-10">
            <Loader2 className="animate-spin text-orange-500" size={40} />
            <p className="ml-4 text-lg text-gray-600">Carregando...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center p-10 bg-white rounded-xl shadow-sm">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">Nenhum anúncio encontrado</h3>
            <p className="text-gray-500 mt-2">Tente remover alguns filtros ou selecionar outra aba.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <ServiceCard
                key={post.id}
                post={post}
                onClick={() => handleCardClick(post)}
              />
            ))}
          </div>
        )}
      </main>

      <ServiceDetailModal
        post={selectedPost}
        onClose={handleCloseDetailModal}
        isOpen={!!selectedPost}
      />

      {isCreateModalOpen && (
        <CreatePostModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onPostCreated={handlePostCreated}
          roleSelecionada={selectedRoleForPost!}
        />
      )}
    </div>
  );
};