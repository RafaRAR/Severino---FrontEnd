import { forwardRef, useId, useRef, useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes, Ref } from 'react'

export const CATEGORIAS_PRESTADOR = [
  'Eletricista',
  'Mecânico',
  'Encanador',
  'Pintor',
  'Pedreiro',
  'Marceneiro',
  'Ar Condicionado',
  'Jardinagem',
  'Limpeza',
  'Outro',
] as const

export type CategoriaPrestador = (typeof CATEGORIAS_PRESTADOR)[number]

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value'> {
  label: string
  error?: string
  options: readonly string[]
  value?: string
}

function Select(
  { label, error, options, className = '', id, ...props }: SelectProps,
  ref: Ref<HTMLSelectElement>,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-brand-navy">
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-brand-navy shadow-md transition focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/30 ${className}`}
          {...props}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        >
          <option value="">Selecione uma categoria</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-brand-navy/70 transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}

export const ForwardedSelect = forwardRef(Select)
