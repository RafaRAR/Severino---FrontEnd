import React, { useState, useEffect, useCallback } from 'react';
import { ServiceCard } from '../components/ui/ServiceCard';
import { BaseModal } from '../components/ui/BaseModal';
import { Plus, Image, Phone, Loader2, Trash2, Edit, User, MapPin, Calendar, Tag } from 'lucide-react';
import { deletePost, getAllPosts, type Post } from '../services/api';
import { CreatePostModal } from '../components/CreatePostModal';
import { EditPostModal } from '../components/EditPostModal';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from '../utils/date';

// Main Home Component
export const Home: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      // Don't set loading to true here to avoid flickering on re-fetch
      const fetchedPosts = await getAllPosts();
      setPosts(fetchedPosts.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()));
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  const handleCardClick = (post: Post) => {
    setSelectedPost(post);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedPost(null);
  };

  const handlePostCreated = () => {
    setIsCreateModalOpen(false);
    fetchPosts();
  };

  const handlePostUpdated = () => {
    setIsEditModalOpen(false);
    fetchPosts();
  };

  const handleOpenEditModal = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPost || !user) return;

    // Verificar se o post pertence ao usuário logado
    if (selectedPost.usuarioId !== parseInt(user.id, 10)) {
      toast.error('Você só pode deletar seus próprios posts');
      return;
    }

    if (window.confirm('Tem certeza que deseja deletar este anúncio?')) {
      try {
        await deletePost(selectedPost.id.toString());
        setPosts(prevPosts => prevPosts.filter(post => post.id !== selectedPost.id));
        toast.success('Anúncio deletado com sucesso!');
        handleCloseViewModal();
      } catch (error) {
        console.error('Erro ao deletar post:', error);
        toast.error('Erro ao deletar o anúncio.');
      }
    }
  };

  const cleanPhoneNumber = (phone: string) => phone.replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="animate-spin text-brand-orange" size={40} />
              <p className="ml-4 text-lg text-gray-600">Carregando anúncios...</p>
            </div>
          ) : (
            posts.map((post) => (
              <ServiceCard
                key={post.id}
                post={post}
                onClick={() => handleCardClick(post)}
              />
            ))
          )}
        </div>
      </main>

      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-8 right-8 flex items-center justify-center rounded-full bg-brand-orange p-4 font-bold text-white shadow-lg transition-colors hover:bg-orange-600"
      >
        <Plus size={24} />
      </button>

      {selectedPost && (
        <BaseModal title={selectedPost.titulo} isOpen={isViewModalOpen} onClose={handleCloseViewModal}>
          <div className="bg-gray-200 mb-4 flex h-64 items-center justify-center rounded-lg">
            <Image size={80} className="text-gray-400" />
          </div>
          <p className="mb-4 text-gray-600 whitespace-pre-wrap break-words">{selectedPost.conteudo}</p>

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
            <div className="flex items-center gap-2"><User size={16} /> <span>{selectedPost.nomeUsuario}</span></div>
            <div className="flex items-center gap-2"><MapPin size={16} /> <span>{selectedPost.endereco}</span></div>
            <div className="flex items-center gap-2"><Calendar size={16} /> <span>{formatDistanceToNow(selectedPost.dataCriacao)}</span></div>
            {selectedPost.categoria && <div className="flex items-center gap-2"><Tag size={16} /> <span>{selectedPost.categoria}</span></div>}
          </div>

          <div className="flex flex-col space-y-2">
            <a
              href={`https://wa.me/55${cleanPhoneNumber(selectedPost.contato)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded bg-green-500 py-2 px-4 font-bold text-white hover:bg-green-600"
            >
              <Phone size={20} className="mr-2" />
              Chamar no WhatsApp
            </a>
            {user && selectedPost.usuarioId === parseInt(user.id, 10) && (
              <div className="flex gap-2">
                <button
                  onClick={handleOpenEditModal}
                  className="flex w-full items-center justify-center rounded bg-blue-500 py-2 px-4 font-bold text-white hover:bg-blue-600"
                >
                  <Edit size={20} className="mr-2" />
                  Editar Anúncio
                </button>
                <button
                  onClick={handleDeletePost}
                  className="flex w-full items-center justify-center rounded bg-red-500 py-2 px-4 font-bold text-white hover:bg-red-600"
                >
                  <Trash2 size={20} className="mr-2" />
                  Deletar Anúncio
                </button>
              </div>
            )}
          </div>
        </BaseModal>
      )}

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
      {selectedPost && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onPostUpdated={handlePostUpdated}
          post={selectedPost}
        />
      )}
    </div>
  );
};
