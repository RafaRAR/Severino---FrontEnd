import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BaseModal } from './ui/BaseModal';
import { formatDate } from '../utils/date';
import { MessageSquare, Paperclip, Send, Trash2, Edit2, X, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../hooks/useAuth';
import {
  type Post,
  type Comentario,
  getComentariosPorPost,
  criarComentario,
  deletarComentario,
  editarComentario
} from '../services/api';

interface ServiceDetailModalProps {
  post: Post | null;
  onClose: () => void;
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

  // Estados para os comentários
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);

  // Estados para a edição de comentários
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [textoEdicao, setTextoEdicao] = useState('');

  // Busca os comentários reais no backend assim que o modal abre
  useEffect(() => {
    if (!post?.id) return;
    const carregar = async () => {
      try {
        const data = await getComentariosPorPost(post.id);
        setComentarios(data);
      } catch (error) {
        console.error("Erro ao carregar comentários:", error);
        // 👇 A MÁGICA ACONTECE AQUI 👇
        // Se der erro 404 (post sem comentários), garantimos que a tela fique limpa!
        setComentarios([]);
      }
    };
    carregar();
  }, [post?.id]);

  // Função para criar comentário
  const handleEnviarComentario = async () => {
    if (!novoComentario.trim() || !user?.id || !post?.id) return;
    setCarregandoComentarios(true);

    try {
      await criarComentario(user.id, { postId: Number(post.id), conteudo: novoComentario });
      setNovoComentario('');
      // Recarrega a lista para buscar o id real gerado pelo banco
      const data = await getComentariosPorPost(post.id);
      setComentarios(data);
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
    } finally {
      setCarregandoComentarios(false);
    }
  };

  // Função para deletar comentário
  const handleDeletarComentario = async (comentarioId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este comentário?")) return;
    try {
      await deletarComentario(comentarioId);
      setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
    } catch (error) {
      console.error("Erro ao deletar", error);
    }
  };

  // Funções para editar comentário
  const iniciarEdicao = (comentario: Comentario) => {
    setEditandoId(comentario.id);
    setTextoEdicao(comentario.conteudo);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setTextoEdicao('');
  };

  const salvarEdicao = async (comentarioId: number) => {
    if (!textoEdicao.trim()) return;
    try {
      await editarComentario(comentarioId, textoEdicao);

      // Atualiza na tela
      setComentarios((prev) =>
        prev.map((c) => (c.id === comentarioId ? { ...c, conteudo: textoEdicao } : c))
      );
      cancelarEdicao();

    } catch (error) {
      console.error("Erro ao editar", error);
      // 👇 Adicionamos um alert para avisar se o backend recusar a requisição
      alert("Erro ao salvar o comentário. O backend retornou um erro.");
    }
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

          {/* AS TAGS */}
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

            {post.role === 'Cliente' && (
              <div className="flex items-center gap-1 text-gray-600">
                <MessageSquare size={16} />
                <span className="text-sm">{comentarios.length} comentários</span>
              </div>
            )}

          </div>

          {/* Comments Section */}
          {post.role === 'Cliente' && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold text-gray-800 mb-2">Comentários</h4>

              <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto pr-2">
                {comentarios.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Nenhum comentário ainda.</p>
                ) : (
                  comentarios.map((c) => {
                    const isDono = Number(user?.id) === c.usuario.id;
                    const isEditando = editandoId === c.id;

                    return (
                      <div key={c.id} className='bg-gray-100 p-2 rounded-lg group relative'>
                        <div className="flex justify-between items-start">
                          <p className='text-xs font-bold text-gray-700'>{c.usuario.nome}</p>

                          {/* Botões só aparecem se o usuário logado for o dono do comentário */}
                          {isDono && !isEditando && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => iniciarEdicao(c)} className="text-blue-500 hover:text-blue-700">
                                <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeletarComentario(c.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Modo Edição vs Modo Leitura */}
                        {isEditando ? (
                          <div className="mt-2 flex flex-col gap-2">
                            <input
                              type="text"
                              value={textoEdicao}
                              onChange={(e) => setTextoEdicao(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && salvarEdicao(c.id)}
                              className="w-full text-sm p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                              autoFocus
                            />
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={cancelarEdicao}
                                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-xs font-medium bg-red-50 px-2 py-1 rounded transition-colors"
                              >
                                <X size={14} /> Cancelar
                              </button>
                              <button
                                onClick={() => salvarEdicao(c.id)}
                                className="text-green-600 hover:text-green-800 flex items-center gap-1 text-xs font-medium bg-green-50 px-2 py-1 rounded transition-colors"
                              >
                                <Check size={14} /> Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className='text-sm text-gray-800 break-words mt-1'>{c.conteudo}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {user ? (
                <div className="relative">
                  <input
                    type="text"
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnviarComentario()}
                    disabled={carregandoComentarios}
                    placeholder="Adicione um comentário..."
                    className="w-full border-gray-300 rounded-lg p-2 pr-20 text-sm disabled:opacity-50"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50">
                      <Paperclip size={18} />
                    </button>
                    <button
                      onClick={handleEnviarComentario}
                      disabled={carregandoComentarios || !novoComentario.trim()}
                      className="p-1 text-blue-500 hover:text-blue-700 disabled:text-gray-400"
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
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {post.cadastro?.contato && <span>📞 {post.cadastro.contato}</span>}
        </div>

        {post.cadastro?.contato ? (
          <a
            href={`https://wa.me/55${post.cadastro.contato.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>
              Entrar em Contato
            </Button>
          </a>
        ) : (
          <Button disabled title="Este utilizador não disponibilizou um número">
            Contato Indisponível
          </Button>
        )}
      </div>
    </BaseModal>
  );
};