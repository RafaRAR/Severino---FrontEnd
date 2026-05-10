import { useEffect, useState } from "react";
import { Loader2, MessageSquare, ChevronRight } from "lucide-react";
import { BaseModal } from "./ui/BaseModal";
import { ChatModal } from "./ChatModal";
import { getSalasUsuario, getPostById, getComentariosPorPost, type Post } from "../services/api";

// ─── Shape real vindo do endpoint ────────────────────────────────────────────
export interface UltimaMensagem {
    conteudo: string;
    dataEnvio: string;
    senderNome: string;
}

export interface ChatRoomSummary {
    id: number;           // salaId
    postId: number;
    tituloPost: string;
    statusPost: number;   // 0=Aberto, 1=Em Andamento, 2=Concluído, 3=Cancelado
    clienteId: number;
    nomeCliente: string;
    prestadorId: number;
    nomePrestador: string;
    dataCriacao: string;
    clienteConfirmou: boolean;
    prestadorConfirmou: boolean;
    ultimaMensagem: UltimaMensagem | null;
    lanceAtual: number;
    lanceId: number;
    lanceConteudo: string;
}

// ─── Dados extras carregados ao abrir o chat ──────────────────────────────────
interface DadosChat {
    lanceAtual: number;
    lanceId: number;
    lanceConteudo: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ChatListModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string | number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDataCurta(isoString?: string | null): string {
    if (!isoString) return "";
    const data = new Date(isoString);
    const diffMin = Math.floor((Date.now() - data.getTime()) / 60000);
    if (diffMin < 1) return "agora";
    if (diffMin < 60) return `${diffMin}min`;
    const h = Math.floor(diffMin / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function Avatar({ nome }: { nome: string }) {
    const inicial = nome?.charAt(0).toUpperCase() ?? "?";
    return (
        <div className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-sm shadow-sm">
            {inicial}
        </div>
    );
}

const STATUS_MAP: Record<number, { label: string; cls: string }> = {
    0: { label: "Aberto", cls: "bg-blue-100 text-blue-700" },
    1: { label: "Concluído", cls: "bg-green-100 text-green-700" },
    2: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
    3: { label: "Em Andamento", cls: "bg-yellow-100 text-yellow-700" },
};

function StatusBadge({ status }: { status: number }) {
    const s = STATUS_MAP[status] ?? { label: "?", cls: "bg-gray-100 text-gray-500" };
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>
            {s.label}
        </span>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function ChatListModal({ isOpen, onClose, userId }: ChatListModalProps) {
    const [salas, setSalas] = useState<ChatRoomSummary[]>([]);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // Chat filho
    const [salaSelecionada, setSalaSelecionada] = useState<ChatRoomSummary | null>(null);
    const [dadosChat, setDadosChat] = useState<DadosChat | null>(null);
    const [abrindoChat, setAbrindoChat] = useState(false);
    const [chatAberto, setChatAberto] = useState(false);

    // Mapa de lances atualizados localmente após negociação
    const [lanceMap, setLanceMap] = useState<Record<number, number>>({});

    const buscarSalas = () => {
        setErro(null);
        setCarregando(true);
        getSalasUsuario(userId)
            .then(({ data }) => setSalas(data as unknown as ChatRoomSummary[]))
            .catch(() => setErro("Não foi possível carregar as conversas."))
            .finally(() => setCarregando(false));
    };

    useEffect(() => {
        if (isOpen) buscarSalas();
    }, [isOpen]);

    // Ao clicar numa sala: busca post + comentários para montar os props do ChatModal
    const abrirChat = async (sala: ChatRoomSummary) => {
        setAbrindoChat(true);
        setSalaSelecionada(sala);
        try {
            const comentarios = await getComentariosPorPost(sala.postId);

            // Procura o comentário/lance do prestador daquela sala específica
            const comentarioDoPrestador = sala.lanceAtual

            setDadosChat({
                lanceAtual: lanceMap[sala.id] ?? comentarioDoPrestador ?? 0,
                lanceId: sala.lanceId ?? 0,
                lanceConteudo: sala.lanceConteudo ?? "",
            });

            setChatAberto(true);
        } catch {
            // Abre mesmo sem dados de lance — o ChatModal lida com valores zerados
            setDadosChat({ lanceAtual: lanceMap[sala.id] ?? 0, lanceId: 0, lanceConteudo: "" });
            setChatAberto(true);
        } finally {
            setAbrindoChat(false);
        }
    };

    const fecharChat = () => {
        setChatAberto(false);
        setSalaSelecionada(null);
        setDadosChat(null);
    };

    const handleValorAtualizado = (lanceId: number, novoValor: number) => {
        if (!salaSelecionada) return;
        setLanceMap((prev) => ({ ...prev, [salaSelecionada.id]: novoValor }));
    };

    return (
        <>
            <BaseModal title="Minhas Conversas" isOpen={isOpen} onClose={onClose}>
                <div className="flex flex-col min-h-[340px] max-h-[70vh]">

                    {/* ── Carregando ── */}
                    {carregando && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground py-12">
                            <Loader2 className="w-7 h-7 animate-spin text-primary" />
                            <span className="text-sm">Buscando conversas…</span>
                        </div>
                    )}

                    {/* ── Erro ── */}
                    {!carregando && erro && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12">
                            <p className="text-sm text-destructive font-medium">{erro}</p>
                            <button
                                onClick={buscarSalas}
                                className="text-xs text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    )}

                    {/* ── Vazio ── */}
                    {!carregando && !erro && salas.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground py-12">
                            <MessageSquare className="w-10 h-10 opacity-30" />
                            <p className="text-sm">Nenhuma conversa ativa ainda.</p>
                        </div>
                    )}

                    {/* ── Lista ── */}
                    {!carregando && !erro && salas.length > 0 && (
                        <ul className="flex-1 overflow-y-auto divide-y divide-border">
                            {salas.map((sala) => {
                                const souCliente = String(userId) === String(sala.clienteId);
                                const outroNome = souCliente ? sala.nomePrestador : sala.nomeCliente;
                                const primeiroNome = outroNome.split(" ")[0];
                                const ultimaMsg = sala.ultimaMensagem;
                                const estaAbrindo = abrindoChat && salaSelecionada?.id === sala.id;

                                return (
                                    <li key={sala.id}>
                                        <button
                                            onClick={() => !abrindoChat && abrirChat(sala)}
                                            disabled={abrindoChat}
                                            className="w-full flex items-center gap-3 px-3 py-3.5 hover:bg-secondary/60 transition-colors text-left group disabled:opacity-60"
                                        >
                                            {/* Avatar */}
                                            <Avatar nome={outroNome} />

                                            {/* Conteúdo central */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="font-semibold text-sm text-foreground truncate">
                                                        {primeiroNome}
                                                    </span>
                                                    <StatusBadge status={sala.statusPost} />
                                                </div>

                                                <p className="text-xs text-muted-foreground truncate leading-snug">
                                                    {sala.tituloPost}
                                                </p>

                                                {ultimaMsg && (
                                                    <p className="text-xs text-muted-foreground/70 truncate mt-0.5 leading-snug">
                                                        <span className="font-medium">
                                                            {ultimaMsg.senderNome.split(" ")[0]}:
                                                        </span>{" "}
                                                        {ultimaMsg.conteudo}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Coluna direita */}
                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatDataCurta(ultimaMsg?.dataEnvio ?? sala.dataCriacao)}
                                                </span>

                                                {estaAbrindo ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                </div>
            </BaseModal>

            {/* ChatModal filho, aberto ao clicar numa sala */}
            {salaSelecionada && dadosChat && (
                <ChatModal
                    isOpen={chatAberto}
                    onClose={fecharChat}
                    postId={String(salaSelecionada.postId)}
                    tituloPost={salaSelecionada.tituloPost}
                    usuarioAtualId={userId}
                    donoDoPostId={salaSelecionada.clienteId}
                    prestadorSelecionadoId={salaSelecionada.prestadorId}
                    lanceInicial={salaSelecionada.lanceAtual}
                    lanceId={salaSelecionada.lanceId}
                    lanceConteudo={salaSelecionada.lanceConteudo}
                    postStatus={salaSelecionada.statusPost}
                    clienteConfirmou={salaSelecionada.clienteConfirmou}
                    prestadorConfirmou={salaSelecionada.prestadorConfirmou}
                    onValorAtualizado={handleValorAtualizado}
                />
            )}
        </>
    );
}