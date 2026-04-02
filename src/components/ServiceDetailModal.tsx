import { useState, useEffect } from "react";
import { MapPin, Phone, Send, Trash2, Edit2, X, Check, MessageSquare, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

import {
  type Post,
  type Comentario,
  getComentariosPorPost,
  criarComentario,
  deletarComentario,
  editarComentario
} from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../utils/date";
import { Button } from "./ui/Button";
import ModalOverlay from "./ModalOverlay";

interface Props {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceDetailModal({ post, isOpen, onClose }: Props) {
  const { user, profile } = useAuth();

  // --- Estado do carrossel ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- Comentários / Propostas ---
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [novoValorDeLance, setNovoValorDeLance] = useState<number | string>('');
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");
  const [valorEdicao, setValorEdicao] = useState<number | string>('');

  // Resetar índice da imagem quando o post mudar
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [post?.id]);

  // Carregar comentários
  useEffect(() => {
    if (!post?.id) return;

    const carregar = async () => {
      try {
        const data = await getComentariosPorPost(post.id);
        setComentarios(data);
      } catch (error) {
        console.error("Erro ao carregar comentários:", error);
        setComentarios([]);
      }
    };

    carregar();
  }, [post?.id]);

  // Navegação do carrossel
  const imagens = post?.imagens || [];
  const hasMultipleImages = imagens.length > 1;

  const goPrev = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? imagens.length - 1 : prev - 1));
  };

  const goNext = () => {
    setCurrentImageIndex((prev) => (prev === imagens.length - 1 ? 0 : prev + 1));
  };

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim() || !user?.id || !post?.id || !novoValorDeLance) return;

    setCarregandoComentarios(true);

    try {
      await criarComentario(user.id, {
        postId: Number(post.id),
        conteudo: novoComentario,
        valorDeLance: Number(novoValorDeLance),
      });

      setNovoComentario("");
      setNovoValorDeLance('');

      const data = await getComentariosPorPost(post.id);
      setComentarios(data);

    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
    } finally {
      setCarregandoComentarios(false);
    }
  };

  const handleDeletarComentario = async (comentarioId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta proposta?")) return;

    try {
      await deletarComentario(comentarioId);
      setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
    } catch (error) {
      console.error("Erro ao deletar proposta", error);
    }
  };

  const iniciarEdicao = (comentario: Comentario) => {
    setEditandoId(comentario.id);
    setTextoEdicao(comentario.conteudo);
    setValorEdicao(comentario.valorDeLance);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setTextoEdicao("");
    setValorEdicao('');
  };

  const salvarEdicao = async (comentarioId: number) => {
    if (!textoEdicao.trim() || !valorEdicao) return;

    try {
      await editarComentario(comentarioId, textoEdicao, Number(valorEdicao));

      setComentarios((prev) =>
        prev.map((c) =>
          c.id === comentarioId ? { ...c, conteudo: textoEdicao, valorDeLance: Number(valorEdicao) } : c
        )
      );

      cancelarEdicao();
    } catch (error) {
      console.error("Erro ao editar proposta", error);
      alert("Erro ao salvar proposta");
    }
  };

  const handleAcceptProposal = (value: number, name: string) => {
    alert(`Proposta de ${name} no valor de R$ ${value} aceita! (funcionalidade de checkout a ser implementada)`);
  };

  if (!post) return null;
  const isPedido = post.role === "Cliente";

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* --- COLUDA DA ESQUERDA: IMAGEM/CARROSSEL + TEXTO --- */}
          <div>
            {/* Container do carrossel */}
            <div className="relative aspect-video w-full bg-gray-100 rounded-xl overflow-hidden">
              {imagens.length > 0 ? (
                <>
                  <img
                    src={imagens[currentImageIndex].url}
                    alt={`Imagem ${currentImageIndex + 1} de ${post.titulo}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Setas de navegação (exibidas apenas se houver mais de 1 imagem) */}
                  {hasMultipleImages && (
                    <>
                      <button
                        onClick={goPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={goNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight size={20} />
                      </button>
                      
                      {/* Indicadores (dots) */}
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {imagens.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`h-1.5 rounded-full transition-all ${
                              idx === currentImageIndex
                                ? "w-4 bg-white"
                                : "w-1.5 bg-white/60 hover:bg-white/80"
                            }`}
                            aria-label={`Ir para imagem ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                  Sem imagem
                </div>
              )}
            </div>

            <h2 className="font-display text-2xl font-bold text-foreground mt-4">{post.titulo}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">{post.conteudo}</p>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="bg-secondary text-muted-foreground rounded-full text-sm px-3 py-1"
                  >
                    {tag.nome}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mt-4 flex-nowrap">
              <img
                src={post.cadastro?.imagemUrl || ''}
                alt=""
                className="w-8 h-8 rounded-full border border-border shrink-0"
              />
              <span className="text-sm font-medium text-foreground truncate">
                {post.cadastro?.nome || post.nomeUsuario}
              </span>
              {post.cadastro?.endereco && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto max-w-[40%] truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {post.cadastro.endereco}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(post.dataCriacao)}
            </p>
          </div>

          {/* --- COLUNA DIREITA: BOTÃO WHATSAPP --- */}
          <div className="space-y-4">
            {post.cadastro?.contato ? (
              <a
                href={`https://wa.me/55${post.cadastro.contato.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="whatsapp" className="w-full">
                  <Phone className="w-5 h-5" />
                  Chamar no WhatsApp
                </Button>
              </a>
            ) : (
              <Button disabled className="w-full">
                <Phone className="w-5 h-5" />
                Contato indisponível
              </Button>
            )}
          </div>
        </div>

        {/* --- SEÇÃO DE PROPOSTAS (apenas para pedidos) --- */}
        {isPedido && (
          <div className="mt-8 border-t border-border pt-6">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Propostas Recebidas</h3>

            {profile?.nome !== post.cadastro?.nome && (
              <div className="bg-secondary rounded-xl p-4 mb-6">
                <textarea
                  className="w-full border border-border rounded-xl px-4 py-3 bg-card text-foreground text-sm h-20 resize-none mb-3"
                  placeholder="Descreva como você vai resolver..."
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  disabled={!user || carregandoComentarios}
                />
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1 max-w-[160px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                    <input
                      type="number"
                      className="w-full border border-border rounded-xl pl-9 pr-4 py-3 bg-card text-foreground text-sm tabular-nums"
                      placeholder="0,00"
                      value={novoValorDeLance}
                      onChange={(e) => setNovoValorDeLance(e.target.value)}
                      disabled={!user || carregandoComentarios}
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleEnviarComentario}
                    disabled={!user || carregandoComentarios}
                  >
                    <Send className="w-4 h-4" />
                    Enviar Proposta
                  </Button>
                </div>
                {!user && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                    ⚠️ Para enviar uma proposta, realize o login na plataforma.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4">
              {comentarios.length === 0 ? (
                <div className="bg-card border border-border rounded-xl shadow-sm p-4 text-center text-muted-foreground">
                  Não há propostas no momento.
                </div>
              ) : (
                comentarios.map((c) => {
                  const isDono = Number(user?.id) === c.usuario.id;
                  const isEditando = editandoId === c.id;

                  if (isEditando) {
                    return (
                      <div key={c.id} className="bg-card border border-border rounded-xl shadow-sm p-4">
                        <textarea
                          className="w-full border border-border rounded-xl px-4 py-3 bg-card text-foreground text-sm h-20 resize-none mb-3"
                          value={textoEdicao}
                          onChange={(e) => setTextoEdicao(e.target.value)}
                        />
                        <div className="flex gap-3 items-center">
                          <div className="relative flex-1 max-w-[160px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                            <input
                              type="number"
                              className="w-full border border-border rounded-xl pl-9 pr-4 py-3 bg-card text-foreground text-sm tabular-nums"
                              value={valorEdicao}
                              onChange={(e) => setValorEdicao(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={cancelarEdicao}>
                              <X size={14} /> Cancelar
                            </Button>
                            <Button size="sm" onClick={() => salvarEdicao(c.id)}>
                              <Check size={14} /> Salvar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={c.id} className="bg-card border border-border rounded-xl shadow-sm p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {c.usuario.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">{c.usuario.nome}</span>
                          </div>
                        </div>
                        {isDono && (
                          <div className="flex gap-2 ml-auto">
                            <button
                              onClick={() => iniciarEdicao(c)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeletarComentario(c.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{c.conteudo}</p>
                      <div className="text-2xl font-bold text-success tabular-nums mb-3">
                        R$ {c.valorDeLance.toFixed(2).replace(".", ",")}
                      </div>
                      {profile?.nome == post.cadastro.nome && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAcceptProposal(c.valorDeLance, c.usuario.nome)}>
                            Aceitar Proposta
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4" /> Chamar no Chat
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}