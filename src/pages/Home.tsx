import React, { useState, useEffect } from 'react';
import { ServiceCard } from '../components/ui/ServiceCard';
import { Dialog } from '../components/ui/Dialog';
import { Plus } from 'lucide-react';
import type { Anuncio } from '../types';
// import { api } from '../services/api';

const mockAnuncios: Anuncio[] = [
  {
    id: 1,
    titulo: 'Desenvolvimento de Landing Page',
    dono: 'João Silva',
    endereco: 'São Paulo, SP / Vila Madalena',
    descricao: 'Criação de landing page responsiva com React e Tailwind CSS.',
    contato: 'joao.silva@example.com',
  },
  {
    id: 2,
    titulo: 'Manutenção de E-commerce',
    dono: 'Maria Oliveira',
    endereco: 'Rio de Janeiro, RJ / Copacabana',
    descricao: 'Correção de bugs e implementação de novas funcionalidades em plataforma de e-commerce.',
    contato: 'maria.oliveira@example.com',
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
    // fetchAnuncios();
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

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {anuncios.map((anuncio) => (
          <ServiceCard
            key={anuncio.id}
            anuncio={anuncio}
            onClick={() => handleCardClick(anuncio)}
          />
        ))}
      </div>

      <button
        onClick={handleOpenCreateModal}
        className="fixed bottom-8 right-8 bg-orange-500 text-white p-4 rounded-full shadow-lg"
      >
        <Plus size={24} />
      </button>

      {selectedAnuncio && (
        <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
          <h2 className="text-2xl font-bold mb-4">{selectedAnuncio.titulo}</h2>
          <p className="mb-2"><span className="font-semibold">Dono:</span> {selectedAnuncio.dono}</p>
          <p className="mb-2"><span className="font-semibold">Endereço:</span> {selectedAnuncio.endereco}</p>
          <p className="mb-2"><span className="font-semibold">Descrição:</span> {selectedAnuncio.descricao}</p>
          <p className="mb-4"><span className="font-semibold">Contato:</span> {selectedAnuncio.contato}</p>
          <button className="btn-primary w-full">Compartilhar</button>
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
