import React from 'react';
import type { Anuncio } from '../../types';
import { Image, MapPin, MessageSquare, Share2, AlertCircle, Phone } from 'lucide-react';

interface ServiceCardProps {
  anuncio: Anuncio;
  onClick: () => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ anuncio, onClick }) => {
  const hasComments = anuncio.comentarios && anuncio.comentarios > 0;

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer flex flex-col sm:flex-row gap-4 p-4"
      onClick={onClick}
    >
      {/* Image Area */}
      {anuncio.foto && (
        <div className="flex-shrink-0 w-full sm:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {/* Using a placeholder icon, but this could be an <img> tag */}
          <Image size={64} className="text-gray-400" />
        </div>
      )}

      {/* Content Area */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-brand-navy">{anuncio.titulo}</h3>
            {anuncio.urgente && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center flex-shrink-0 ml-2">
                <AlertCircle size={12} className="mr-1" />
                URGENTE
              </span>
            )}
          </div>

          {/* Body */}
          <p className="mt-2 text-gray-500 text-sm line-clamp-3">{anuncio.descricao}</p>
        </div>

        <div>
          {/* Recommendation Tag */}
          {anuncio.categoria && (
            <div className="mt-4">
              <span className="bg-brand-orange text-white text-xs font-semibold px-3 py-1 rounded-full">
                Profissional recomendado: {anuncio.categoria}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex justify-between items-center text-sm text-gray-500 flex-wrap gap-2">
            <div className="flex items-center">
              <MapPin size={16} className="mr-1" />
              <span>{anuncio.endereco}</span>
            </div>
            <div className={`flex items-center ${hasComments ? 'text-green-600' : 'text-blue-600'}`}>
              <MessageSquare size={16} className="mr-1" />
              <span>
                {hasComments ? `${anuncio.comentarios} comentários` : 'Seja o primeiro a comentar!'}
              </span>
            </div>
            <div className="flex items-center">
              <Share2 size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
