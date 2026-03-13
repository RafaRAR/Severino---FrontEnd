import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceCard } from '../components/ui/ServiceCard';
import { ServiceDetailModal } from '../components/ServiceDetailModal';
import { CreatePostModal } from '../components/CreatePostModal';
import { getAllPosts, type Post as ApiPost, type Post } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Camera, Wrench } from 'lucide-react';

// Adicionando o tipo para os posts e um tipo local para incluir a aba
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

  useEffect(() => {
    fetchPosts();
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

  const filteredPosts = posts.filter(post => post.role === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">

        {/* Create Post Trigger */}
        <div className="bg-white shadow-sm rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            {user ? <UserAvatar user={{ nome: user.name, foto: profile?.imagemUrl || undefined }} /> : <div className="w-12 h-12 rounded-full bg-gray-300" />}
            <div
              className="bg-gray-100 text-gray-500 text-left w-full py-3 px-4 rounded-full"
            >
              {user ? `Qual problema você precisa resolver hoje, ${user.name.split(' ')[0]}?` : 'Qual problema você precisa resolver hoje?'}
            </div>
          </div>
          <div className="border-t border-gray-100 my-3"></div>
          <div className="flex justify-around">
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition" onClick={() => handleCreatePostClick('Cliente')}>
              <Camera size={20} className="text-red-500" />
              <span>Pedir Ajuda</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition" onClick={() => handleCreatePostClick('Prestador')}>
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
