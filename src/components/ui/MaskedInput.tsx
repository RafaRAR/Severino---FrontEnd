import InputMask from 'react-input-mask'

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  mask: string | (RegExp | string)[]
  maskChar?: string
}

export function MaskedInput({
  label,
  error,
  mask,
  maskChar = '_',
  className = '',
  ...props
}: MaskedInputProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-brand-navy">
      <span>{label}</span>
      <InputMask
        mask={mask}
        maskChar={maskChar}
        alwaysShowMask={false}
        className={`w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-brand-navy shadow-md placeholder:text-gray-400 transition focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/30 disabled:bg-gray-100 ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  )
}

export const CPF_MASK = '999.999.999-99'
export const CELULAR_MASK = '+55 (99) 99999-9999'
export const CEP_MASK = '99999-999'
