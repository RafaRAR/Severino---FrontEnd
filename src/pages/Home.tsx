import React, { useState, useEffect } from 'react';
import { ServiceCard } from '../components/ui/ServiceCard';
import { Dialog } from '../components/ui/Dialog';
import { Plus, Image, Phone } from 'lucide-react';
import type { Anuncio } from '../types';
// import { api } from '../services/api';

const mockAnuncios: Anuncio[] = [
  {
    id: 1,
    titulo: 'Vazamento na pia da cozinha',
    dono: 'Mariana P.',
    endereco: 'Botafogo, Rio de Janeiro',
    descricao: 'A pia da cozinha está com um vazamento constante que já tentamos arrumar mas não conseguimos. A água fica pingando e parece que o sifão está com problema. Preciso de alguém com urgência pois a conta de água vai vir um absurdo!',
    contato: '21987654321',
    urgente: true,
    categoria: 'Encanador',
    comentarios: 5,
    foto: 'true',
  },
  {
    id: 2,
    titulo: 'Instalação de 3 ar-condicionados split',
    dono: 'Carlos S.',
    endereco: 'Copacabana, Rio de Janeiro',
    descricao: 'Comprei 3 aparelhos de ar-condicionado e preciso de um profissional qualificado para fazer a instalação completa, incluindo a parte elétrica e o furo na parede. Tenho preferência por quem já tem experiência com a marca Carrier.',
    contato: '21912345678',
    categoria: 'Eletricista / Instalador',
    comentarios: 0,
  },
];

export const Home: React.FC = () => {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [selectedAnuncio, setSelectedAnuncio] = useState<Anuncio | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    // const fetchAnuncios = async () => {
    //   try {
    //     const response = await api.get('/api/Anuncio');
    //     setAnuncios(response.data);
    //   } catch (error) {
    //     console.error('Erro ao buscar anúncios:', error);
    //   }
    // };
    setAnuncios(mockAnuncios);
  }, []);

  const handleCardClick = (anuncio: Anuncio) => {
    setSelectedAnuncio(anuncio);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnuncio(null);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };
  
  const cleanPhoneNumber = (phone: string) => phone.replace(/\D/g, '');


  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-[#1A2B48] text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">SeverinoApp</h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="space-y-4">
          {anuncios.map((anuncio) => (
            <ServiceCard
              key={anuncio.id}
              anuncio={anuncio}
              onClick={() => handleCardClick(anuncio)}
            />
          ))}
        </div>
      </main>

      <button
        onClick={handleOpenCreateModal}
        className="fixed bottom-8 right-8 bg-[#FF8C00] text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors font-bold"
      >
        <Plus size={24} />
      </button>

      {selectedAnuncio && (
        <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
          {/* TODO: Adicionar um carrossel ou uma forma melhor de visualizar as fotos */}
          <div className="bg-gray-200 h-64 mb-4 flex items-center justify-center rounded-lg">
            <Image size={80} className="text-gray-400" />
          </div>

          <h2 className="text-2xl font-bold text-brand-navy mb-2">{selectedAnuncio.titulo}</h2>
          <p className="text-gray-600 mb-4">{selectedAnuncio.descricao}</p>
          
          {/* TODO: Substituir por chat interno da plataforma no futuro. */}
          <a
            href={`https://wa.me/55${cleanPhoneNumber(selectedAnuncio.contato)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
          >
            <Phone size={20} className="mr-2" />
            Chamar no WhatsApp
          </a>

          <div className="border-t border-gray-200 my-4"></div>

          {/* TODO: Implementar o componente de comentários/lances */}
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-brand-navy mb-2">Comentários e Lances</h3>
            <p className="text-gray-500">Em breve, esta área mostrará os lances dos profissionais.</p>
          </div>

          <button className="mt-4 btn-primary w-full">Compartilhar</button>
        </Dialog>
      )}

      <Dialog isOpen={isCreateModalOpen} onClose={handleCloseCreateModal}>
        <h2 className="text-2xl font-bold mb-4">Criar Novo Anúncio</h2>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Título</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Descrição</label>
            <textarea className="w-full p-2 border rounded"></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Endereço</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Contato</label>
            <input type="text" className="w-full p-2 border rounded" />
          </div>
          <button type="submit" className="btn-primary w-full">Criar Anúncio</button>
        </form>
      </Dialog>
    </div>
  );
};
