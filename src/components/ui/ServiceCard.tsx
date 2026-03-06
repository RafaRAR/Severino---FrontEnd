import React from 'react';
import type { Anuncio } from '../../types';
import { User, MapPin } from 'lucide-react';

interface ServiceCardProps {
  anuncio: Anuncio;
  onClick: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ anuncio, onClick }) => {
  return (
    <div
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between cursor-pointer"
      onClick={onClick}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-brand-navy">{anuncio.titulo}</h3>
        </div>
        <p className="text-gray-600 mb-2 flex items-center">
          <User className="mr-2" size={16} />
          <span className="font-semibold">Dono:</span>&nbsp;{anuncio.dono}
        </p>
        <p className="text-gray-600 mb-2 flex items-center">
          <MapPin className="mr-2" size={16} />
          <span className="font-semibold">Endereço:</span>&nbsp;{anuncio.endereco}
        </p>
        <p className="text-gray-600 font-body">{anuncio.descricao}</p>
      </div>
      <div className="mt-6">
        <button className="btn-secondary w-full">Ver Detalhes</button>
      </div>
    </div>
  );
};
