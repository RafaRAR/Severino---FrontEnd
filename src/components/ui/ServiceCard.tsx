import React from 'react'

interface ServiceCardProps {
  title: string
  description: string
  status: 'Urgente' | 'Em Aberto'
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  status,
}) => {
  const isUrgent = status === 'Urgente'

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-title text-brand-navy">{title}</h3>
          <span
            className={`px-3 py-1 text-sm font-bold rounded-full ${
              isUrgent
                ? 'bg-brand-orange/10 text-brand-orange'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {status}
          </span>
        </div>
        <p className="text-gray-600 font-body">{description}</p>
      </div>
      <div className="mt-6">
        <button className="btn-secondary w-full">Ver Detalhes</button>
      </div>
    </div>
  )
}
