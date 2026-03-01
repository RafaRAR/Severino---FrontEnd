import React from 'react'
import { Sparkles } from 'lucide-react'

interface AIInfoProps {
  title: string
  children: React.ReactNode
}

export const AIInfo: React.FC<AIInfoProps> = ({ title, children }) => {
  return (
    <div className="p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
      <div className="flex items-center mb-4">
        <Sparkles className="text-brand-orange h-6 w-6 mr-2" />
        <h4 className="text-lg font-title text-brand-navy">{title}</h4>
      </div>
      <div className="text-gray-700 font-body">{children}</div>
    </div>
  )
}
