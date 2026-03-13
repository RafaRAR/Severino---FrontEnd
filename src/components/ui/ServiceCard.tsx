import React from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { formatDate } from '../../utils/date';
import type { Post as ApiPost } from '../../services/api';
import { Button } from './Button';

// Extend the Post type to include the 'type' property for local use
interface Post extends ApiPost {
  type?: 'pedidos' | 'profissionais';
}

interface ServiceCardProps {
  post: Post;
  onClick: () => void;
}

const UserAvatar = ({ user }: { user: { nomeUsuario: string; autorImagemUrl?: string } }) => {
  const initials = user.nomeUsuario
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 flex-shrink-0">
      {user.autorImagemUrl ? (
        <img src={user.autorImagemUrl} alt={user.nomeUsuario} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

export const ServiceCard: React.FC<ServiceCardProps> = ({ post, onClick }) => {
  const isPedido = post.type === 'pedidos';

  const renderBadge = () => {
    if (!post.impulsionar) return null;

    if (post.role === 'Cliente') {
        return <div className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">URGENTE</div>;
    }

    if (post.role === 'Prestador') {
        return <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">PATROCINADO</div>;
    }

    return null;
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col border border-gray-100 overflow-hidden"
      onClick={onClick}
    >
        {post.imagemUrl && (
            <img src={post.imagemUrl} alt={post.titulo} className="w-full h-40 object-cover" />
        )}
      <div className="p-5 flex flex-col flex-grow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar user={post} />
            <div>
              <p className="font-bold text-gray-800 leading-tight">{post.nomeUsuario}</p>
              <p className="text-xs text-gray-500">{formatDate(post.dataCriacao)}</p>
            </div>
          </div>
          {renderBadge()}
        </div>

        {/* Body */}
        <div className="flex-grow mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{post.titulo}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.conteudo}</p>
          {post.categoria && (
            <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-1 rounded-md">
              {post.categoria}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          {isPedido ? (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Lances</span>
              <div className="flex items-center gap-1.5 text-brand-orange font-bold">
                <MessageSquare size={16} />
                <span>{post.comentarios || 0}</span>
              </div>
            </div>
          ) : (
            <div /> // Placeholder to keep alignment
          )}

          {isPedido ? (
            <Button variant="ghost" className="h-auto py-1 px-3">
              Ver Pedido
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Button variant="brand" className="w-full sm:w-auto">
              Entrar em Contato
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
