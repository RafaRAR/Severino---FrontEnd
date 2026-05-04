import { useState, useEffect } from "react";
import { MapPin, Phone, Trash2, Edit2, MessageSquare, ChevronLeft, ChevronRight, BadgeCheck, Send } from "lucide-react";
import { ChatModal } from './ChatModal';
import { type Post, type Comentario, getComentariosPorPost, criarComentario, deletarComentario, deletePost } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/date";
import { Button } from "./ui/Button";
import ModalOverlay from "./ModalOverlay";

interface Props { post: Post | null; isOpen: boolean; onClose: () => void; onPostDeleted?: (postId: number) => void; }

export default function ServiceDetailModal({ post, isOpen, onClose, onPostDeleted }: Props) {
  const { user, profile } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatPrestadorId, setChatPrestadorId] = useState<number | null>(null);
  const [chatLanceInicial, setChatLanceInicial] = useState<number>(0);
  const [chatLanceId, setChatLanceId] = useState<number | null>(null);
  const [chatLanceConteudo, setChatLanceConteudo] = useState<string>("");
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [novoValorDeLance, setNovoValorDeLance] = useState<number | string>('');
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isPostOwner = Number(user?.id) === Number(post?.usuarioId);
  const jaFezProposta = comentarios.some((c) => Number(c.usuario.id) === Number(user?.id));
  const postPermiteLances = post?.status === 0;

  const isPrestador = profile?.tipoUsuario === 1 || localStorage.getItem("tipoUsuario") === "1";
  const isAdmin = profile?.tipoUsuario === 2;

  // ─── Permissões de exclusão ───────────────────────────────────────────────
  const podeExcluirPost = isAdmin || isPostOwner;
  const podeExcluirComentario = (comentarioUsuarioId: number) =>
    isAdmin || isPostOwner || Number(user?.id) === comentarioUsuarioId;

  useEffect(() => { setCurrentImageIndex(0); }, [post?.id]);
  useEffect(() => {
    if (!post?.id) return;
    const carregar = async () => {
      try { const data = await getComentariosPorPost(post.id); setComentarios(data); } catch (e) { setComentarios([]); }
    };
    carregar();
  }, [post?.id]);

  const atualizarValorNaLista = (idLance: number, novoValor: number) => {
    setComentarios((prev) => prev.map((c) => c.id === idLance ? { ...c, valorDeLance: novoValor } : c));
  };

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim() || !user?.id || !post?.id || !novoValorDeLance) return;
    setCarregandoComentarios(true);
    try {
      await criarComentario(user.id, { postId: Number(post.id), conteudo: novoComentario, valorDeLance: Number(novoValorDeLance) });
      setNovoComentario(""); setNovoValorDeLance('');
      const data = await getComentariosPorPost(post.id); setComentarios(data);
    } catch (e) { } finally { setCarregandoComentarios(false); }
  };

  const handleDeletarPost = async () => {
    if (!post || !window.confirm("Tem certeza que deseja excluir este post?")) return;
    try {
      await deletePost(String(post.id));
      onPostDeleted?.(post.id);
      onClose();
    } catch (e) { alert("Não foi possível excluir o post."); }
  };

  const handleDeletarComentario = async (comentarioId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta proposta?")) return;
    try {
      await deletarComentario(comentarioId);
      setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
    } catch (e) { alert("Não foi possível excluir a proposta."); }
  };

  const abrirChatComPrestador = (prestadorId: number, valorLance: number, lanceId: number, conteudo: string) => {
    setChatPrestadorId(prestadorId); setChatLanceInicial(valorLance); setChatLanceId(lanceId); setChatLanceConteudo(conteudo); setIsChatOpen(true);
  };

  if (!post) return null;
  const imagens = post.imagens || [];

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="relative aspect-video w-full bg-gray-100 rounded-xl overflow-hidden">
              {imagens.length > 0 ? (
                <>
                  <img src={imagens[currentImageIndex].url} className="w-full h-full object-cover" alt="" />
                  {imagens.length > 1 && (
                    <>
                      <button onClick={() => setCurrentImageIndex(p => p === 0 ? imagens.length - 1 : p - 1)} className="absolute left-2 top-1/2 bg-black/50 text-white rounded-full p-1.5"><ChevronLeft size={20} /></button>
                      <button onClick={() => setCurrentImageIndex(p => p === imagens.length - 1 ? 0 : p + 1)} className="absolute right-2 top-1/2 bg-black/50 text-white rounded-full p-1.5"><ChevronRight size={20} /></button>
                    </>
                  )}
                </>
              ) : <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>}
            </div>

            {/* Título + botão de excluir post */}
            <div className="flex items-start justify-between gap-3 mt-4">
              <h2 className="font-display text-2xl font-bold">{post.titulo}</h2>
              {podeExcluirPost && (
                <button
                  onClick={handleDeletarPost}
                  className="flex-shrink-0 p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  title="Excluir post"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <p className="text-sm mt-2 whitespace-pre-wrap">{post.conteudo}</p>
          </div>
          <div className="space-y-4">
            {post.cadastro?.contato ? (
              <a href={`https://wa.me/55${post.cadastro.contato.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" className="w-full"><Phone className="w-5 h-5" /> Chamar no WhatsApp</Button>
              </a>
            ) : <Button disabled className="w-full">Contato indisponível</Button>}
          </div>
        </div>
        {post.role === "Cliente" && (
          <div className="mt-8 border-t pt-6">
            <h3 className="font-display text-lg font-bold mb-4">Propostas Recebidas</h3>

            {!isPostOwner && isPrestador && !jaFezProposta && postPermiteLances && (
              <div className="bg-secondary rounded-xl p-4 mb-6">
                <textarea className="w-full border rounded-xl px-4 py-3 h-20 resize-none mb-3" placeholder="Como você vai resolver..." value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} disabled={carregandoComentarios} />
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1 max-w-[160px]"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">R$</span><input type="number" className="w-full border rounded-xl pl-9 pr-4 py-3 text-sm" placeholder="0,00" value={novoValorDeLance} onChange={(e) => setNovoValorDeLance(e.target.value)} disabled={carregandoComentarios} /></div>
                  <Button size="lg" onClick={handleEnviarComentario} disabled={carregandoComentarios}><Send className="w-4 h-4" /> Enviar Proposta</Button>
                </div>
              </div>
            )}

            {!isPostOwner && isPrestador && isAdmin && (
              <>
                {!postPermiteLances && (
                  <div className="bg-gray-100 p-4 rounded-xl border border-gray-300 mb-6 text-center">
                    <p className="text-gray-600 font-medium">
                      {post.status === 1 ? "✅ Este serviço já foi concluído." :
                        post.status === 2 ? "⏰ Este post expirou." :
                          "⏳ Este serviço já está em andamento com outro profissional."}
                    </p>
                  </div>
                )}
                {postPermiteLances && jaFezProposta && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-6 text-center">
                    <p className="text-blue-700 font-medium">
                      ✅ Sua proposta já foi enviada. Aguarde o contato do cliente ou abra o chat!
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="space-y-4">
              {comentarios.filter(c => isPostOwner || Number(user?.id) === c.usuario.id).length === 0 && !isPostOwner && !isAdmin && (
                <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-xl border border-dashed">
                  🔒 Os lances de outros profissionais são confidenciais.<br />
                  {isPrestador ? "Faça a sua proposta acima!" : "Somente prestadores de serviço podem enviar propostas."}
                </p>
              )}

              {comentarios.filter(c => isPostOwner || isAdmin || Number(user?.id) === c.usuario.id).map((c) => {
                const isCommentOwner = Number(user?.id) === c.usuario.id;
                return (
                  <div key={c.id} className="bg-card border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">{c.usuario.nome.charAt(0).toUpperCase()}</div>
                      <span className="text-sm font-bold">{c.usuario.nome}</span>
                      {/* Botões de ação do comentário: edit só para o dono, delete para quem tiver permissão */}
                      <div className="flex gap-2 ml-auto">
                        {isCommentOwner && (
                          <button onClick={() => {}}><Edit2 size={14} /></button>
                        )}
                        {podeExcluirComentario(c.usuario.id) && (
                          <button onClick={() => handleDeletarComentario(c.id)} className="text-red-500 hover:text-red-700 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm mb-3">{c.conteudo}</p>
                    <div className="text-2xl font-bold text-green-600 mb-3">R$ {c.valorDeLance.toFixed(2).replace(".", ",")}</div>
                    {(isPostOwner || isCommentOwner) && (
                      <div className="flex gap-2">
                        {isPostOwner && post.status === 0 && (
                          <Button size="sm" onClick={() => alert("Aceito!")}>Aceitar Proposta</Button>
                        )}
                        <Button
                          variant={post.status === 1 || post.status === 2 || post.status === 3 ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => abrirChatComPrestador(c.usuario.id, c.valorDeLance, c.id, c.conteudo)}
                          disabled={post.status === 1 || post.status === 2}
                        >
                          {post.status === 1 || post.status === 2 ? (
                            post.status === 1 ? "✅ Negociação Concluída" : "⏳ Expirado"
                          ) : (
                            <><MessageSquare className="w-4 h-4 mr-2" />{isPostOwner ? "Chamar no Chat" : "Abrir Chat"}</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {user && chatPrestadorId && chatLanceId !== null && (
        <ChatModal
          isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} postId={post.id.toString()}
          tituloPost={post.titulo} usuarioAtualId={user.id} donoDoPostId={post.usuarioId}
          prestadorSelecionadoId={chatPrestadorId} lanceInicial={chatLanceInicial}
          lanceId={chatLanceId} lanceConteudo={chatLanceConteudo}
          postStatus={post.status}
          onValorAtualizado={atualizarValorNaLista}
        />
      )}
    </ModalOverlay>
  );
}