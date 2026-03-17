import { useState, useEffect } from "react";
import { MapPin, Phone, Send, Trash2, Edit2, X, Check, MessageSquare } from "lucide-react";

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
  const { user } = useAuth();

  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [carregandoComentarios, setCarregandoComentarios] = useState(false);

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");

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

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim() || !user?.id || !post?.id) return;

    setCarregandoComentarios(true);

    try {
      await criarComentario(user.id, {
        postId: Number(post.id),
        conteudo: novoComentario
      });

      setNovoComentario("");

      const data = await getComentariosPorPost(post.id);
      setComentarios(data);

    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
    } finally {
      setCarregandoComentarios(false);
    }
  };

  const handleDeletarComentario = async (comentarioId: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este comentário?")) return;

    try {
      await deletarComentario(comentarioId);
      setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
    } catch (error) {
      console.error("Erro ao deletar comentário", error);
    }
  };

  const iniciarEdicao = (comentario: Comentario) => {
    setEditandoId(comentario.id);
    setTextoEdicao(comentario.conteudo);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setTextoEdicao("");
  };

  const salvarEdicao = async (comentarioId: number) => {
    if (!textoEdicao.trim()) return;

    try {
      await editarComentario(comentarioId, textoEdicao);

      setComentarios((prev) =>
        prev.map((c) =>
          c.id === comentarioId ? { ...c, conteudo: textoEdicao } : c
        )
      );

      cancelarEdicao();
    } catch (error) {
      console.error("Erro ao editar comentário", error);
      alert("Erro ao salvar comentário");
    }
  };

  if (!post) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT */}
          <div>

            {post.imagemUrl && (
              <img
                src={post.imagemUrl}
                alt={post.titulo}
                className="w-full rounded-xl object-cover aspect-video border border-border"
              />
            )}

            <h2 className="font-display text-2xl font-bold text-foreground mt-4">
              {post.titulo}
            </h2>

            <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">
              {post.conteudo}
            </p>

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

            {/* AUTHOR */}
            <div className="flex items-center gap-2 mt-4">
              <img
                src={post.cadastro?.imagemUrl || ''}
                alt=""
                className="w-8 h-8 rounded-full border border-border"
              />

              <span className="text-sm font-medium text-foreground">
                {post.cadastro?.nome || post.nomeUsuario}
              </span>

              {post.cadastro?.endereco && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                  <MapPin className="w-3 h-3" />
                  {post.cadastro.endereco}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              {formatDate(post.dataCriacao)}
            </p>

          </div>

          {/* RIGHT */}
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

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              {comentarios.length} comentários
            </div>

          </div>
        </div>

        {/* COMMENTS */}
        {post.role === "Cliente" && (
          <div className="mt-8 border-t border-border pt-6">

            <h3 className="font-display text-lg font-bold text-foreground mb-4">
              Comentários
            </h3>

            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">

              {comentarios.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum comentário ainda.
                </p>
              )}

              {comentarios.map((c) => {

                const isDono = Number(user?.id) === c.usuario.id;
                const isEditando = editandoId === c.id;

                return (
                  <div
                    key={c.id}
                    className="bg-card border border-border rounded-xl p-3"
                  >

                    <div className="flex justify-between items-start">

                      <span className="text-xs font-bold text-foreground">
                        {c.usuario.nome}
                      </span>

                      {isDono && !isEditando && (
                        <div className="flex gap-2">

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

                    {isEditando ? (
                      <div className="mt-2 flex flex-col gap-2">

                        <input
                          value={textoEdicao}
                          onChange={(e) => setTextoEdicao(e.target.value)}
                          className="w-full border border-border rounded-lg p-2 text-sm"
                          autoFocus
                        />

                        <div className="flex justify-end gap-2">

                          <button
                            onClick={cancelarEdicao}
                            className="text-red-500 text-xs flex items-center gap-1"
                          >
                            <X size={14} /> Cancelar
                          </button>

                          <button
                            onClick={() => salvarEdicao(c.id)}
                            className="text-green-600 text-xs flex items-center gap-1"
                          >
                            <Check size={14} /> Salvar
                          </button>

                        </div>

                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        {c.conteudo}
                      </p>
                    )}

                  </div>
                );
              })}
            </div>

            {user && (
              <div className="flex gap-2">

                <input
                  type="text"
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEnviarComentario()}
                  placeholder="Adicione um comentário..."
                  className="flex-1 border border-border rounded-xl px-4 py-2 text-sm"
                />

                <Button
                  onClick={handleEnviarComentario}
                  disabled={!novoComentario.trim() || carregandoComentarios}
                >
                  <Send className="w-4 h-4" />
                </Button>

              </div>
            )}

          </div>
        )}
      </div>
    </ModalOverlay>
  );
}