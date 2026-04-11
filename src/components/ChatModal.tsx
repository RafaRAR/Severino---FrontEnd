import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { BaseModal } from "./ui/BaseModal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Send, Handshake } from "lucide-react";
import { api } from "../services/api";

interface Mensagem {
  senderId: number;
  senderNome?: string;
  conteudo: string;
  dataEnvio: string;
}

interface ChatModalProps {
  isOpen: boolean; onClose: () => void; postId: string; tituloPost: string;
  usuarioAtualId: string | number; donoDoPostId: string | number;
  prestadorSelecionadoId: string | number; lanceInicial: number; 
  lanceId: number; lanceConteudo: string; 
  postStatus: number; // <-- 2. MUDE DE STRING PARA NUMBER
  onValorAtualizado: (lanceId: number, novoValor: number) => void;
}

export const ChatModal = ({ 
  isOpen, onClose, postId, tituloPost, usuarioAtualId, donoDoPostId,
  prestadorSelecionadoId, lanceInicial, lanceId, lanceConteudo, 
  postStatus, // <-- 2. ADICIONE AQUI TAMBÉM
  onValorAtualizado
}: ChatModalProps) => {
  
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novoTexto, setNovoTexto] = useState("");
  const [roomId, setRoomId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // REFS PARA CONTROLE TOTAL
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isConnectingRef = useRef(false); // Impede duplicidade de conexão
  const isFinalizandoRef = useRef(false); // Impede loop de aceite

  const [lanceAtual, setLanceAtual] = useState<number>(lanceInicial);
  const [modalLanceAberto, setModalLanceAberto] = useState(false);
  const [valorNovoLance, setValorNovoLance] = useState("");
  const [enviandoLance, setEnviandoLance] = useState(false);
  const [clienteAceitou, setClienteAceitou] = useState(false);
  const [prestadorAceitou, setPrestadorAceitou] = useState(false);
  
  // NOVOS ESTADOS: Fase 2 (Conclusão) e Aborto
  const [clienteConcluiu, setClienteConcluiu] = useState(false);
  const [prestadorConcluiu, setPrestadorConcluiu] = useState(false);
  const isAbortandoRef = useRef(false);
  
  // Controla o Banner e o Duplo Clique
  const [statusNegociacao, setStatusNegociacao] = useState("Aberto");
  const enviouOkRef = useRef(false);

  const souOCliente = String(usuarioAtualId) === String(donoDoPostId);

  useEffect(() => {
    if (isOpen) {
      setLanceAtual(lanceInicial);
      
      // 3. TRADUTOR DO BACKEND: 0=Aberto, 1=Concluido, 2=Expirado, 3=EmAndamento
      const statusTraduzido = postStatus === 3 ? "Em Andamento" : postStatus === 1 ? "Concluído" : "Aberto";
      
      setStatusNegociacao(statusTraduzido); 

      if (statusTraduzido === "Concluído") {
        setClienteAceitou(true); setPrestadorAceitou(true);
        setClienteConcluiu(true); setPrestadorConcluiu(true);
      } else if (statusTraduzido === "Em Andamento") {
        setClienteAceitou(true); setPrestadorAceitou(true);
        setClienteConcluiu(false); setPrestadorConcluiu(false);
      } else {
        setClienteAceitou(false); setPrestadorAceitou(false);
        setClienteConcluiu(false); setPrestadorConcluiu(false);
      }

      isFinalizandoRef.current = false;
      enviouOkRef.current = false;
      isAbortandoRef.current = false;
    }
  }, [isOpen, lanceInicial, postStatus]);

// --- CONEXÃO SIGNALR (BLINDADA CONTRA STRICT MODE) ---
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true; // Variável mágica que sabe se o componente ainda é válido

    const inicializarChat = async () => {
      if (connectionRef.current) return;

      try {
        const res = await api.post("/Chat/abrir", { postId: Number(postId), clienteId: Number(donoDoPostId), prestadorId: Number(prestadorSelecionadoId) });
        
        // Se o React desmontou a tela enquanto esperávamos a API, aborta!
        if (!isMounted) return; 

        const idDaSala = res.data.id;
        setRoomId(idDaSala);

        const novaConexao = new signalR.HubConnectionBuilder()
          .withUrl("http://localhost:5005/chathub")
          .withAutomaticReconnect()
          .build();

        await novaConexao.start();

        // Se o React desmontou enquanto o SignalR conectava, desliga e foge!
        if (!isMounted) {
          novaConexao.stop();
          return;
        }

        await novaConexao.invoke("JoinChat", String(idDaSala));

        novaConexao.on("ReceiveMessage", (msg: Mensagem) => {
          setMensagens((prev) => [...prev, msg]);
          
          // FASE 1: NEGOCIAÇÃO
          if (msg.conteudo.includes("✅ O Cliente aceitou")) setClienteAceitou(true);
          if (msg.conteudo.includes("✅ O Profissional aceitou")) setPrestadorAceitou(true);
          if (msg.conteudo.includes("💰 Fiz uma nova proposta")) {
              setClienteAceitou(false); setPrestadorAceitou(false); setStatusNegociacao("Aberto");
          }
          if (msg.conteudo.includes("🚀 Proposta aceita!")) {
              setStatusNegociacao("Em Andamento");
              // 🔓 MÁGICA AQUI: Destrava os botões para a Fase 2!
              isFinalizandoRef.current = false;
              enviouOkRef.current = false; 
          }

          // FASE 2: CONCLUSÃO E ABORTO
          if (msg.conteudo.includes("✅ O Cliente concluiu")) setClienteConcluiu(true);
          if (msg.conteudo.includes("✅ O Profissional concluiu")) setPrestadorConcluiu(true);
          if (msg.conteudo.includes("🏁 Serviço concluído!")) {
              setStatusNegociacao("Concluído");
              isFinalizandoRef.current = false;
              enviouOkRef.current = false;
          }
          if (msg.conteudo.includes("🛑 A negociação foi abortada")) {
              setStatusNegociacao("Aberto");
              setClienteConcluiu(false); setPrestadorConcluiu(false);
              setClienteAceitou(false); setPrestadorAceitou(false);
              // 🔓 Destrava os botões caso tenham abortado
              isFinalizandoRef.current = false; 
              enviouOkRef.current = false; 
          }
        });

        connectionRef.current = novaConexao;
        const historico = await api.get(`/Chat/history/${idDaSala}`);
        
        if (isMounted) {
          setMensagens(historico.data);
          // 🧹 APAGAMOS A CHECAGEM DO HISTÓRICO AQUI!
          // Agora a fonte da verdade é o 'postStatus' que vem lá do banco.
          // O SignalR (ao vivo) continua mudando a tela se alguém aceitar enquanto você olha.
        }
      } catch (error) { 
        console.error("Erro no Chat:", error);
      }
    };

    inicializarChat();

    return () => {
      isMounted = false; // Avisa qualquer processo pendente para abortar
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    const ultimaMsgLance = [...mensagens].reverse().find(m => m.conteudo.includes("💰 Fiz uma nova proposta de R$"));
    if (ultimaMsgLance) {
      const partes = ultimaMsgLance.conteudo.split("R$ ");
      if (partes.length > 1) {
        const valorNumero = parseFloat(partes[1].replace(',', '.'));
        if (!isNaN(valorNumero)) setLanceAtual(valorNumero);
      }
    }
  }, [mensagens]);

  const fazerLance = async () => {
    if (!valorNovoLance || enviandoLance) return;
    setEnviandoLance(true);
    try {
      await api.put(`/Post/Comentario/editarcomentario/${lanceId}`, { conteudo: lanceConteudo, valorDeLance: Number(valorNovoLance) });
      setLanceAtual(Number(valorNovoLance)); setModalLanceAberto(false); setValorNovoLance("");
      setClienteAceitou(false); setPrestadorAceitou(false);
      enviouOkRef.current = false; // Destrava o botão para nova rodada
      setStatusNegociacao("Aberto");
      onValorAtualizado(lanceId, Number(valorNovoLance));
      if (connectionRef.current && roomId) {
        await connectionRef.current.invoke("SendMessage", String(roomId), Number(usuarioAtualId), `💰 Fiz uma nova proposta de R$ ${Number(valorNovoLance).toFixed(2).replace('.', ',')}`);
      }
    } catch (error) { alert("Erro ao atualizar proposta."); } finally { setEnviandoLance(false); }
  };

  const abortar = async () => {
    if (isAbortandoRef.current) return;
    isAbortandoRef.current = true;
    try {
      await api.put(`/Chat/post/${postId}/abortar`);
      if (connectionRef.current && roomId) {
        await connectionRef.current.invoke("SendMessage", String(roomId), Number(usuarioAtualId), "🛑 A negociação foi abortada pelo cliente. O post voltou para a fase de lances.");
      }
    } catch(error) {
      console.error(error); alert("Erro ao abortar.");
    } finally {
      isAbortandoRef.current = false;
    }
  };

  const darO_OK = async () => {
    if (isFinalizandoRef.current || enviouOkRef.current) return;
    enviouOkRef.current = true; 
    isFinalizandoRef.current = true;

    try {
      // --- FASE 1: ACEITAR PROPOSTA (Status: Aberto) ---
      if (statusNegociacao === "Aberto") {
        const oOutroJaAceitou = souOCliente ? prestadorAceitou : clienteAceitou;

        if (connectionRef.current && roomId) {
          await connectionRef.current.invoke("SendMessage", String(roomId), Number(usuarioAtualId), souOCliente ? "✅ O Cliente aceitou a proposta." : "✅ O Profissional aceitou a proposta.");
        }
        if (souOCliente) setClienteAceitou(true); else setPrestadorAceitou(true);

        if (oOutroJaAceitou) {
          await api.put(`/Chat/post/${postId}/aceitarproposta`, { prestadorId: Number(prestadorSelecionadoId) });
          if (connectionRef.current && roomId) {
            await connectionRef.current.invoke("SendMessage", String(roomId), Number(usuarioAtualId), "🚀 Proposta aceita! O status do post agora é: Em Andamento");
          }
        } else {
          isFinalizandoRef.current = false; // Libera, falta o outro
        }
      } 
      // --- FASE 2: CONCLUIR SERVIÇO (Status: Em Andamento) ---
      else if (statusNegociacao === "Em Andamento") {
        const oOutroJaConcluiu = souOCliente ? prestadorConcluiu : clienteConcluiu;

        if (connectionRef.current && roomId) {
          await connectionRef.current.invoke("SendMessage", String(roomId), Number(usuarioAtualId), souOCliente ? "✅ O Cliente concluiu o serviço." : "✅ O Profissional concluiu o serviço.");
        }
        if (souOCliente) setClienteConcluiu(true); else setPrestadorConcluiu(true);

        if (oOutroJaConcluiu) {
          await api.put(`/Chat/post/${postId}/concluir`);
          if (connectionRef.current && roomId) {
            await connectionRef.current.invoke("SendMessage", String(roomId), Number(usuarioAtualId), "🏁 Serviço concluído! O post foi finalizado com sucesso.");
          }
          alert("🎉 Serviço concluído com sucesso!");
          onClose(); // Aqui fechamos, missão cumprida!
        } else {
          isFinalizandoRef.current = false; // Libera, falta o outro
        }
      }
    } catch (error: any) { 
      console.error(error);
      isFinalizandoRef.current = false; enviouOkRef.current = false;
      if (error.response?.status === 400) alert("⚠️ Operação inválida para o status atual do post.");
    }
  };

  const lidarComEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (connectionRef.current && novoTexto.trim() && roomId) {
      try { await connectionRef.current.invoke("SendMessage", String(roomId), Number(usuarioAtualId), novoTexto); setNovoTexto(""); } catch (e) {}
    }
  };

// Lógica de visualização dinâmica dos botões
  const euJaAceitei = (souOCliente && clienteAceitou) || (!souOCliente && prestadorAceitou);
  const euJaConclui = (souOCliente && clienteConcluiu) || (!souOCliente && prestadorConcluiu);

  let textoBotaoPrincipal = "Aceitar Valor";
  let btnPrincipalDesabilitado = euJaAceitei || isFinalizandoRef.current;
  let checkCliente = clienteAceitou;
  let checkProfissional = prestadorAceitou;

  if (statusNegociacao === "Em Andamento") {
    textoBotaoPrincipal = euJaConclui ? "Aguardando o outro..." : "Concluir Serviço";
    btnPrincipalDesabilitado = euJaConclui || isFinalizandoRef.current;
    checkCliente = clienteConcluiu;
    checkProfissional = prestadorConcluiu;
  } else if (statusNegociacao === "Concluído") {
    textoBotaoPrincipal = "Serviço Finalizado";
    btnPrincipalDesabilitado = true;
  }

  return (
    <BaseModal title={`Chat: ${tituloPost}`} isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-[65vh]">
        <div className="flex flex-col gap-3 bg-[#1A237E] p-4 rounded-xl mb-4 text-white shadow-md shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <p className={`text-[10px] uppercase font-bold opacity-70 ${statusNegociacao === "Em Andamento" ? "text-yellow-300" : statusNegociacao === "Concluído" ? "text-green-300" : ""}`}>
                {statusNegociacao === "Em Andamento" ? "Em Andamento" : statusNegociacao === "Concluído" ? "Concluído" : "Negociação Ativa"}
              </p>
              <p className="text-sm font-semibold">Post # {postId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-green-300">Lance Atual</p>
              <p className="text-xl font-bold text-green-400">R$ {lanceAtual.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end items-center">
            
            {/* NOVO: Botão de Abortar (Apenas Cliente se estiver Em Andamento) */}
            {souOCliente && statusNegociacao === "Em Andamento" && (
              <Button size="sm" className="bg-red-500 hover:bg-red-600 border-none text-white transition-colors" onClick={abortar} disabled={isAbortandoRef.current}>
                Abortar
              </Button>
            )}

            {/* Oculta botão de Lance se a negociação já avançou */}
            {statusNegociacao === "Aberto" && (
              <Button variant="outline" size="sm" className="bg-transparent border border-white text-white hover:bg-white hover:text-[#1A237E]" onClick={() => setModalLanceAberto(!modalLanceAberto)}>
                Fazer Lance
              </Button>
            )}

            {/* Indicadores Dinâmicos de OK */}
            <div className="flex gap-1 mr-2 opacity-90 text-[10px]">
              <span className={checkCliente ? "text-green-400 font-bold" : "text-gray-300"}>{checkCliente ? "✅ Cliente OK" : "⏳ Cliente"}</span>
              <span>|</span>
              <span className={checkProfissional ? "text-green-400 font-bold" : "text-gray-300"}>{checkProfissional ? "✅ Prof. OK" : "⏳ Profissional"}</span>
            </div>

            {/* Botão Principal Dinâmico (Aceitar/Concluir) */}
            <Button variant={btnPrincipalDesabilitado ? "secondary" : "success"} size="sm" className={btnPrincipalDesabilitado ? "bg-gray-500" : "bg-green-500 gap-2"} onClick={darO_OK} disabled={btnPrincipalDesabilitado}>
              <Handshake size={18} /> {textoBotaoPrincipal}
            </Button>
          </div>
        </div>

        {/* --- RESTO DO CÓDIGO (LANCES, MENSAGENS E INPUT) --- */}
        {modalLanceAberto && (
          <div className="bg-blue-50 p-3 rounded-xl mb-4 border border-blue-200 flex gap-2 items-center">
            <span className="font-bold text-blue-900">R$</span>
            <Input label="" type="number" value={valorNovoLance} onChange={(e) => setValorNovoLance(e.target.value)} className="bg-white text-black h-8 flex-1" style={{ color: 'black' }} />
            <Button size="sm" className="bg-[#1A237E]" onClick={fazerLance} disabled={enviandoLance}>Enviar Valor</Button>
          </div>
        )}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-2xl border">
          {mensagens.map((msg, index) => {
            const isMinha = String(msg.senderId) === String(usuarioAtualId);
            return (
              <div key={index} className={`flex ${isMinha ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${isMinha ? "bg-[#1A237E] text-white" : "bg-gray-200 text-gray-800"}`}>
                  <p className="text-sm">{msg.conteudo}</p>
                  <span className={`text-[9px] block mt-1 ${isMinha ? "text-blue-200" : "text-gray-500"}`}>{msg.dataEnvio ? new Date(msg.dataEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={lidarComEnvio} className="mt-4 flex gap-2 items-center">
          <Input label="" value={novoTexto} onChange={(e) => setNovoTexto(e.target.value)} placeholder="Digite sua mensagem..." className="bg-white h-12" style={{ color: 'black' }} />
          <Button type="submit" className="bg-[#1A237E] rounded-full w-12 h-12 p-0 flex items-center justify-center"><Send size={20} className="text-white" /></Button>
        </form>
      </div>
    </BaseModal>
  );
};