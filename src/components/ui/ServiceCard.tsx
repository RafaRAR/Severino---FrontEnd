import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, MapPin } from 'lucide-react';
import { formatDate } from '../../utils/date';
import type { Post as ApiPost } from '../../services/api';

// Extensão do tipo Post (mantido do componente 1)
interface Post extends ApiPost {
  type?: 'pedidos' | 'profissionais';
  // Assumindo propriedades baseadas na utilização do componente 1:
  localizacao?: string;
}

interface ServiceCardProps {
  post: Post;
  onClick: () => void;
  index?: number; // Adicionado para a animação do framer-motion funcionar sem erro no TypeScript
}

// Adaptado para o tamanho reduzido (w-8 h-8) e estilo do componente 2
const UserAvatar = ({ user }: { user: { nomeUsuario: string; autorImagemUrl?: string } }) => {
  const initials = user.nomeUsuario
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0 border border-border">
      {user.autorImagemUrl ? (
        <img src={user.autorImagemUrl} alt={user.nomeUsuario} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

export const ServiceCard: React.FC<ServiceCardProps> = ({ post, onClick, index = 0 }) => {
  const isPedido = post.type === 'pedidos';

  // Lógica original de badges (mantida), mas usando as classes CSS de tema do componente 2
  const renderBadge = () => {
    if (!post.impulsionar) return null;

    if (post.role === 'Cliente') {
      return (
        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 bg-destructive text-destructive-foreground">
          URGENTE
        </span>
      );
    }

    if (post.role === 'Prestador') {
      return (
        <span className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 bg-amber-400 text-card">
          PATROCINADO
        </span>
      );
    }

    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
      onClick={onClick} // O processo original de clique através de props é mantido aqui
      className="bg-card rounded-xl shadow-sm hover:shadow-card transition-shadow duration-150 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Imagem principal seguindo o layout UI 2 */}
      {post.imagemUrl && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.imagemUrl}
            alt={post.titulo}
            className="w-full h-full object-cover border-b border-border"
          />
        </div>
      )}

      {/* Corpo do Card */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-2">
          <UserAvatar user={post} />
          <span className="text-sm font-medium text-foreground">{post.nomeUsuario}</span>
          <span className="text-xs text-muted-foreground ml-auto">{formatDate(post.dataCriacao)}</span>
        </div>

        {renderBadge()}

        <h3 className="font-display font-bold text-foreground mb-1 line-clamp-1">{post.titulo}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{post.conteudo}</p>

        {/* Categoria original adaptada ao final do texto, caso exista */}
        {post.categoria && (
          <div className="mt-auto">
            <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2.5 py-1 rounded-md">
              {post.categoria}
            </span>
          </div>
        )}
      </div>

      {/* Footer - Mesclando os ícones da UI 2 com a lógica da UI 1 */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {post.localizacao || 'Remoto'}
        </span>

        {isPedido && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> {post.comentarios || 0}
          </span>
        )}
      </div>
    </motion.div>
  );
};