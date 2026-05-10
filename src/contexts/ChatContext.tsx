import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { api } from "../services/api";

interface Mensagem {
  senderId: number;
  senderNome?: string;
  conteudo: string;
  dataEnvio: string;
}

interface ChatContextData {
  mensagens: Mensagem[];
  statusNegociacao: string;
  clienteAceitou: boolean | null;
  prestadorAceitou: boolean | null;
  clienteConcluiu: boolean | null;
  prestadorConcluiu: boolean | null;
  lanceAtual: number;
  enviandoLance: boolean;
  isAbortando: boolean;
  conectarChat: () => Promise<void>;
  desconectarChat: () => void;
  enviarMensagem: (texto: string) => Promise<void>;
  darOKNegociacao: () => Promise<void>;
  fazerLance: (valor: number, lanceConteudo: string, lanceId: number, onValorAtualizado: (id: number, valor: number) => void) => Promise<void>;
  abortarNegociacao: () => Promise<void>;
}

export const ChatContext = createContext<ChatContextData>({} as ChatContextData);

interface ChatProviderProps {
  children: React.ReactNode;
  postId: string;
  usuarioAtualId: string | number;
  donoDoPostId: string | number;
  prestadorSelecionadoId: string | number;
  lanceInicial: number;
  postStatus: number;
  clienteConfirmou?: boolean | null;
  prestadorConfirmou?: boolean | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
  children,
  postId,
  usuarioAtualId,
  donoDoPostId,
  prestadorSelecionadoId,
  lanceInicial,
  postStatus,
  isOpen,
  clienteConfirmou,
  prestadorConfirmou,
  onClose
}) => {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [roomId, setRoomId] = useState<number | null>(null);

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const isFinalizandoRef = useRef(false);
  const enviouOkRef = useRef(false);
  const isAbortandoRef = useRef(false);

  const [lanceAtual, setLanceAtual] = useState<number>(lanceInicial);
  const [enviandoLance, setEnviandoLance] = useState(false);
  const [isAbortando, setIsAbortando] = useState(false);

  const [clienteAceitou, setClienteAceitou] = useState<boolean | null>(false);
  const [prestadorAceitou, setPrestadorAceitou] = useState<boolean | null>(false);
  const [clienteConcluiu, setClienteConcluiu] = useState<boolean | null>(false);
  const [prestadorConcluiu, setPrestadorConcluiu] = useState<boolean | null>(false);
  const [statusNegociacao, setStatusNegociacao] = useState("Aberto");

  const souOCliente = String(usuarioAtualId) === String(donoDoPostId);

  useEffect(() => {
    if (isOpen) {
      setLanceAtual(lanceInicial);
      const statusTraduzido = postStatus === 3 ? "Em Andamento" : postStatus === 1 ? "Concluído" : "Aberto";
      setStatusNegociacao(statusTraduzido);

      if (statusTraduzido === "Aberto") {
        setClienteAceitou(clienteConfirmou ?? null); setPrestadorAceitou(prestadorConfirmou ?? null);
        setClienteConcluiu(false); setPrestadorConcluiu(false);
      } else if (statusTraduzido === "Em Andamento") {
        setClienteAceitou(true); setPrestadorAceitou(true);
        setClienteConcluiu(clienteConfirmou ?? null); setPrestadorConcluiu(prestadorConfirmou ?? null);
      } else {
        setClienteAceitou(true); setPrestadorAceitou(true);
        setClienteConcluiu(true); setPrestadorConcluiu(true);
      }

      isFinalizandoRef.current = false;
      enviouOkRef.current = false;
      isAbortandoRef.current = false;
      setIsAbortando(false);
    }
  }, [isOpen, lanceInicial, postStatus, clienteConfirmou, prestadorConfirmou]);

  const conectarChat = async () => {
    if (connectionRef.current) return;

    try {
      const res = await api.post("/Chat/abrir", {
        postId: Number(postId),
        clienteId: Number(donoDoPostId),
        prestadorId: Number(prestadorSelecionadoId)
      });

      const idDaSala = res.data.id;
      setRoomId(idDaSala);

      const token = localStorage.getItem('severino_token') || "";

      const novaConexao = new signalR.HubConnectionBuilder()
        .withUrl("https://severino-backend-lqhl.onrender.com/chathub", {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

      await novaConexao.start();
      await novaConexao.invoke("JoinChat", String(idDaSala));

      novaConexao.on("StatusNegociacaoAtualizado", (data: any) => {
        const novoStatus = data.postStatus === "EmAndamento" ? "Em Andamento" : data.postStatus === "Concluido" ? "Concluído" : "Aberto";
        setStatusNegociacao(novoStatus);

        if (novoStatus === "Aberto") {
          setClienteAceitou(data.clienteConfirmou); setPrestadorAceitou(data.prestadorConfirmou);
        } else if (novoStatus === "Em Andamento") {
          setClienteAceitou(true); setPrestadorAceitou(true);
          setClienteConcluiu(data.clienteConfirmou); setPrestadorConcluiu(data.prestadorConfirmou);
        } else {
          setClienteConcluiu(true); setPrestadorConcluiu(true);
        }
      });

      novaConexao.on("ReceiveMessage", (msg: Mensagem) => {
        setMensagens((prev) => [...prev, msg]);

        if (msg.conteudo.includes("💰 Fiz uma nova proposta")) {
          setClienteAceitou(false);
          setPrestadorAceitou(false);
          setStatusNegociacao("Aberto");

          const partes = msg.conteudo.split("R$ ");
          if (partes.length > 1) {
            const valorNumero = parseFloat(partes[1].replace(',', '.'));
            if (!isNaN(valorNumero)) setLanceAtual(valorNumero);
          }
        }

        if (msg.conteudo.includes("🛑 A negociação foi abortada")) {
          setStatusNegociacao("Aberto");
          setClienteConcluiu(false);
          setPrestadorConcluiu(false);
          setClienteAceitou(false);
          setPrestadorAceitou(false);
          isFinalizandoRef.current = false;
          enviouOkRef.current = false;
        }
      });

      connectionRef.current = novaConexao;
      const historico = await api.get(`/Chat/history/${idDaSala}`);
      setMensagens(historico.data);

      const ultimaMsgLance = [...historico.data].reverse().find((m: any) => m.conteudo.includes("💰 Fiz uma nova proposta de R$"));
      if (ultimaMsgLance) {
        const partes = ultimaMsgLance.conteudo.split("R$ ");
        if (partes.length > 1) {
          const valorNumero = parseFloat(partes[1].replace(',', '.'));
          if (!isNaN(valorNumero)) setLanceAtual(valorNumero);
        }
      }
    } catch (error) {
      console.error("Erro no Chat:", error);
    }
  };

  const desconectarChat = () => {
    if (connectionRef.current) {
      connectionRef.current.stop();
      connectionRef.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (isOpen) {
      conectarChat().then(() => {
        if (!isMounted) desconectarChat();
      });
    }
    return () => {
      isMounted = false;
      desconectarChat();
    };
  }, [isOpen]);

  const enviarMensagem = async (texto: string) => {
    if (connectionRef.current && roomId && texto.trim()) {
      await connectionRef.current.invoke("SendMessage", String(roomId), Number(usuarioAtualId), texto);
    }
  };

  const fazerLance = async (valor: number, lanceConteudo: string, lanceId: number, onValorAtualizado: (id: number, valor: number) => void) => {
    if (enviandoLance) return;
    setEnviandoLance(true);
    try {
      await api.put(`/Post/Comentario/editarcomentario/${lanceId}`, { conteudo: lanceConteudo, valorDeLance: valor });
      setLanceAtual(valor);
      setClienteAceitou(false); setPrestadorAceitou(false);
      enviouOkRef.current = false;
      setStatusNegociacao("Aberto");
      onValorAtualizado(lanceId, valor);
      if (connectionRef.current && roomId) {
        await connectionRef.current.invoke("SendMessage", String(roomId), Number(usuarioAtualId), `💰 Fiz uma nova proposta de R$ ${valor.toFixed(2).replace('.', ',')}`);
      }
    } catch (error) {
      alert("Erro ao atualizar proposta.");
    } finally {
      setEnviandoLance(false);
    }
  };

  const abortarNegociacao = async () => {
    if (isAbortandoRef.current) return;
    isAbortandoRef.current = true;
    setIsAbortando(true);
    try {
      await api.put(`/Chat/post/${postId}/abortar`);
      if (connectionRef.current && roomId) {
        await connectionRef.current.invoke("SendMessage", String(roomId), Number(usuarioAtualId), "🛑 A negociação foi abortada pelo cliente. O post voltou para a fase de lances.");
      }
    } catch (error) {
      console.error(error); alert("Erro ao abortar.");
    } finally {
      isAbortandoRef.current = false;
      setIsAbortando(false);
    }
  };

  const darOKNegociacao = async () => {
    if (isFinalizandoRef.current || enviouOkRef.current) return;

    enviouOkRef.current = true;
    isFinalizandoRef.current = true;

    try {
      const res = await api.put('/Chat/room/confirmar', {
        roomId: Number(roomId),
        usuarioId: Number(usuarioAtualId)
      });

      if (res.data.postStatus === "Concluido") {
        alert("🎉 Serviço concluído com sucesso!");
        onClose();
      }
    } catch (error: any) {
      console.error("Erro ao dar OK:", error);
      if (error.response?.status === 400) alert("⚠️ Operação inválida.");
    } finally {
      isFinalizandoRef.current = false;
      enviouOkRef.current = false;
    }
  };

  return (
    <ChatContext.Provider value={{
      mensagens,
      statusNegociacao,
      clienteAceitou,
      prestadorAceitou,
      clienteConcluiu,
      prestadorConcluiu,
      lanceAtual,
      enviandoLance,
      isAbortando,
      conectarChat,
      desconectarChat,
      enviarMensagem,
      darOKNegociacao,
      fazerLance,
      abortarNegociacao
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
