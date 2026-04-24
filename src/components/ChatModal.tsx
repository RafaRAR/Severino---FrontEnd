import { useEffect, useState, useRef } from "react";
import { BaseModal } from "./ui/BaseModal";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Send, Handshake } from "lucide-react";
import { ChatProvider, useChat } from "../contexts/ChatContext";
import { useUserPhotos } from "../hooks/useUserPhotos";

interface ChatModalProps {
  isOpen: boolean; onClose: () => void; postId: string; tituloPost: string;
  usuarioAtualId: string | number; donoDoPostId: string | number;
  prestadorSelecionadoId: string | number; lanceInicial: number; 
  lanceId: number; lanceConteudo: string; 
  postStatus: number; 
  onValorAtualizado: (lanceId: number, novoValor: number) => void;
}

export const ChatModal = (props: ChatModalProps) => {
  return (
    <ChatProvider
      postId={props.postId}
      usuarioAtualId={props.usuarioAtualId}
      donoDoPostId={props.donoDoPostId}
      prestadorSelecionadoId={props.prestadorSelecionadoId}
      lanceInicial={props.lanceInicial}
      postStatus={props.postStatus}
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      <ChatModalContent {...props} />
    </ChatProvider>
  );
};

const ChatModalContent = ({ 
  isOpen, onClose, postId, tituloPost, usuarioAtualId, donoDoPostId,
  prestadorSelecionadoId, lanceId, lanceConteudo, 
  onValorAtualizado
}: ChatModalProps) => {
  
  const {
    mensagens,
    statusNegociacao,
    clienteAceitou,
    prestadorAceitou,
    clienteConcluiu,
    prestadorConcluiu,
    lanceAtual,
    enviandoLance,
    isAbortando,
    enviarMensagem,
    darOKNegociacao,
    fazerLance,
    abortarNegociacao
  } = useChat();

  const { userImageMap } = useUserPhotos(donoDoPostId, prestadorSelecionadoId, isOpen);

  const [novoTexto, setNovoTexto] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [modalLanceAberto, setModalLanceAberto] = useState(false);
  const [valorNovoLance, setValorNovoLance] = useState("");

  const souOCliente = String(usuarioAtualId) === String(donoDoPostId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensagens]);

  const handleFazerLance = async () => {
    if (!valorNovoLance) return;
    await fazerLance(Number(valorNovoLance), lanceConteudo, lanceId, onValorAtualizado);
    setModalLanceAberto(false);
    setValorNovoLance("");
  };

  const lidarComEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novoTexto.trim()) {
      await enviarMensagem(novoTexto);
      setNovoTexto("");
    }
  };

  const euJaAceitei = (souOCliente && clienteAceitou) || (!souOCliente && prestadorAceitou);
  const euJaConclui = (souOCliente && clienteConcluiu) || (!souOCliente && prestadorConcluiu);

  let textoBotaoPrincipal = "Aceitar Valor";
  let btnPrincipalDesabilitado = euJaAceitei;
  let checkCliente = clienteAceitou;
  let checkProfissional = prestadorAceitou;

  if (statusNegociacao === "Em Andamento") {
    textoBotaoPrincipal = euJaConclui ? "Aguardando o outro..." : "Concluir Serviço";
    btnPrincipalDesabilitado = euJaConclui;
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
            
            {souOCliente && statusNegociacao === "Em Andamento" && (
              <Button size="sm" className="bg-red-500 hover:bg-red-600 border-none text-white transition-colors" onClick={abortarNegociacao} disabled={isAbortando}>
                Abortar
              </Button>
            )}

            {statusNegociacao === "Aberto" && (
              <Button variant="outline" size="sm" className="bg-transparent border border-white text-white hover:bg-white hover:text-[#1A237E]" onClick={() => setModalLanceAberto(!modalLanceAberto)}>
                Fazer Lance
              </Button>
            )}

            <div className="flex gap-1 mr-2 opacity-90 text-[10px]">
              <span className={checkCliente ? "text-green-400 font-bold" : "text-gray-300"}>{checkCliente ? "✅ Cliente OK" : "⏳ Cliente"}</span>
              <span>|</span>
              <span className={checkProfissional ? "text-green-400 font-bold" : "text-gray-300"}>{checkProfissional ? "✅ Prof. OK" : "⏳ Profissional"}</span>
            </div>

            <Button variant={btnPrincipalDesabilitado ? "secondary" : "success"} size="sm" className={btnPrincipalDesabilitado ? "bg-gray-500" : "bg-green-500 gap-2"} onClick={darOKNegociacao} disabled={btnPrincipalDesabilitado}>
              <Handshake size={18} /> {textoBotaoPrincipal}
            </Button>
          </div>
        </div>

        {modalLanceAberto && (
          <div className="bg-blue-50 p-3 rounded-xl mb-4 border border-blue-200 flex gap-2 items-center">
            <span className="font-bold text-blue-900">R$</span>
            <Input label="" type="number" value={valorNovoLance} onChange={(e) => setValorNovoLance(e.target.value)} className="bg-white text-black h-8 flex-1" style={{ color: 'black' }} />
            <Button size="sm" className="bg-[#1A237E]" onClick={handleFazerLance} disabled={enviandoLance}>Enviar Valor</Button>
          </div>
        )}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-2xl border">
          {mensagens.map((msg: any, index: number) => {
            const isMinha = String(msg.senderId) === String(usuarioAtualId);
            const primeiroNome = msg.senderNome ? msg.senderNome.split(" ")[0] : "Usuário";
            const inicial = primeiroNome.charAt(0).toUpperCase();
            const fotoUrl = userImageMap[msg.senderId];

            return (
              <div key={index} className={`flex ${isMinha ? "justify-end" : "justify-start"} items-end gap-2`}>
                
                {!isMinha && (
                  <div className="flex-shrink-0">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt={primeiroNome} className="w-8 h-8 rounded-full object-cover border border-gray-300 shadow-sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs shadow-sm">
                        {inicial}
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${isMinha ? "bg-[#1A237E] text-white rounded-br-none" : "bg-gray-200 text-gray-800 rounded-bl-none"}`}>
                  <span className={`text-[10px] font-bold mb-1 block ${isMinha ? "text-blue-300" : "text-gray-500"}`}>
                    {isMinha ? "Você" : primeiroNome}
                  </span>
                  
                  <p className="text-sm break-words">{msg.conteudo}</p>
                  
                  <span className={`text-[9px] block mt-1 text-right ${isMinha ? "text-blue-200" : "text-gray-500"}`}>
                    {msg.dataEnvio ? new Date(msg.dataEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>

                {isMinha && (
                  <div className="flex-shrink-0">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt="Você" className="w-8 h-8 rounded-full object-cover border border-[#1A237E] shadow-sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-[#1A237E] font-bold text-xs shadow-sm">
                        {inicial}
                      </div>
                    )}
                  </div>
                )}

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
