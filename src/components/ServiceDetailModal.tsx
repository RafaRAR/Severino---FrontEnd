import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BaseModal } from './ui/BaseModal';
import { formatDate } from '../utils/date';
import { MessageSquare, Paperclip, Send } from 'lucide-react';
import { Button } from './ui/Button';
import type { Post } from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface ServiceDetailModalProps {
  post: Post | null;
  onClose: () => void;
}

// Tipo essencial para a gente controlar os comentários localmente por enquanto
interface ComentarioLocal {
  id: string;
  nomeUsuario: string;
  conteudo: string;
}

const UserAvatar = ({ user, size = 'md' }: { user: { nomeUsuario: string; autorImagemUrl?: string }, size?: 'md' | 'lg' }) => {
  const initials = user.nomeUsuario
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  const sizeClasses = size === 'lg' ? 'w-16 h-16 text-2xl' : 'w-10 h-10';

  return (
    <div className={`rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 ${sizeClasses}`}>
      {user.autorImagemUrl ? (
        <img src={user.autorImagemUrl} alt={user.nomeUsuario} className="w-full h-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
};

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ post, onClose }) => {
  const { user } = useAuth();
  
  // 1. Estados essenciais para fazer a lista funcionar
  const [comentarios, setComentarios] = useState<ComentarioLocal[]>([
    { id: '1', nomeUsuario: 'José', conteudo: 'Gostei, muito bom!' } // Mantive o José para a tela não começar vazia!
  ]);
  const [novoComentario, setNovoComentario] = useState('');

  // 2. Função essencial para adicionar o comentário digitado na lista
  const handleEnviarComentario = () => {
    if (!novoComentario.trim()) return;

    const comentarioCriado: ComentarioLocal = {
      id: Date.now().toString(), // Gera um ID temporário
      nomeUsuario: 'Você', // Como ainda não conectamos a API, fica genérico
      conteudo: novoComentario
    };

    setComentarios([...comentarios, comentarioCriado]);
    setNovoComentario(''); // Limpa a barra de digitação
  };

  if (!post) return null;

  return (
<BaseModal isOpen={!!post} onClose={onClose} title={post.titulo}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-2 pr-4">
          <div className="flex items-center gap-4 mb-6">
            <UserAvatar user={post} size="lg" />
            <div>
              {/* Mostra o nome completo do cadastro, ou cai para o nome de utilizador básico se falhar */}
              <p className="font-bold text-xl text-gray-800">
                {post.cadastro?.nome || post.nomeUsuario}
              </p>
              
              {/* Mostra a cidade/endereço se o backend enviar */}
              {post.cadastro?.endereco && (
                <p className="text-sm text-gray-600 mb-1">{post.cadastro.endereco}</p>
              )}
              
              <p className="text-sm text-gray-500">{formatDate(post.dataCriacao)}</p>
            </div>
          </div>
          
          <p className="text-gray-700 whitespace-pre-wrap break-words">{post.conteudo}</p>

          {/* AS TAGS ENTRAM AQUI 👇 LOGO ABAIXO DO CONTEÚDO */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag) => (
                <span 
                  key={tag.id} 
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {tag.nome}
                </span>
              ))}
            </div>
          )}
          {/* FIM DA SEÇÃO DE TAGS */}

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          {post.imagemUrl && (
            <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              <img src={post.imagemUrl} alt={post.titulo} className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {post.impulsionar && (
              <span className="bg-red-100 text-red-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full w-fit">Urgente</span>
            )}
            {post.categoria && (
              <span className="bg-teal-100 text-teal-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full w-fit">
                Categoria: {post.categoria}
              </span>
            )}
            <div className="flex items-center gap-1 text-gray-600">
              <MessageSquare size={16} />
              {/* O número de comentários agora acompanha o tamanho da lista real */}
              <span className="text-sm">{comentarios.length} comentários</span>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-800 mb-2">Comentários</h4>
            
            {/* 3. A lista agora é gerada dinamicamente pelo map */}
            <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto pr-2">
              {comentarios.map((c) => (
                <div key={c.id} className='bg-gray-100 p-2 rounded-lg'>
                  <p className='text-xs font-bold'>{c.nomeUsuario}</p>
                  <p className='text-sm break-words'>{c.conteudo}</p>
                </div>
              ))}
            </div>

            {user ? (
              <div className="relative">
                <input
                  type="text"
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)} // Salva o que está sendo digitado
                  onKeyDown={(e) => e.key === 'Enter' && handleEnviarComentario()} // Permite enviar com a tecla Enter
                  placeholder="Adicione um comentário..."
                  className="w-full border-gray-300 rounded-lg p-2 pr-20 text-sm"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                  <button className="p-1 text-gray-500 hover:text-gray-700">
                    <Paperclip size={18} />
                  </button>
                  <button 
                    onClick={handleEnviarComentario} // Permite enviar pelo botão
                    className="p-1 text-blue-500 hover:text-blue-700"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">Faça login para dar um lance ou comentar.</p>
                <Link to="/login">
                  <Button variant="primary" className="w-full">
                    Entrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t flex justify-between items-center">
        {/* Opcional: mostrar o telefone na interface */}
        <div className="text-sm text-gray-600">
           {post.cadastro?.contato && <span>📞 {post.cadastro.contato}</span>}
        </div>

        {/* Botão de contacto inteligente */}
        {post.cadastro?.contato ? (
          <a 
            /* Transforma o número num link direto para o WhatsApp (remove parênteses e traços) */
            href={`https://wa.me/55${post.cadastro.contato.replace(/\D/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button>
              Entrar em Contacto
            </Button>
          </a>
        ) : (
          <Button disabled title="Este utilizador não disponibilizou um número">
            Contacto Indisponível
          </Button>
        )}
      </div>
    </BaseModal>
  );
};