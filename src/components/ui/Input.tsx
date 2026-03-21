import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type Ref,
} from 'react'
import EyeIcon from './EyeIcon'
import EyeOffIcon from './EyeOffIcon'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  /** 'default' = tema escuro (Login/Register), 'light' = tema claro (modal) */
  variant?: 'default' | 'light'
}

const lightInputStyles =
  'rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-brand-navy focus:ring-1 focus:ring-brand-navy disabled:bg-gray-100'
const defaultInputStyles =
  'rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500'

function Input(
  { label, error, className = '', type, variant = 'default', ...props }: InputProps,
  ref: Ref<HTMLInputElement>,
) {
  const [showPassword, setShowPassword] = useState(false)

  const isPasswordInput = type === 'password'
  const inputType = isPasswordInput
    ? showPassword
      ? 'text'
      : 'password'
    : type

  const labelClass =
    variant === 'light'
      ? 'flex flex-col gap-1 text-sm font-medium text-brand-navy'
      : 'flex flex-col gap-1 text-sm text-slate-200'
  const inputClass =
    variant === 'light' ? `${lightInputStyles} shadow-md ${className}` : `${defaultInputStyles} ${className}`

  return (
    <label className={labelClass}>
      <span>{label}</span>
      <div className="relative flex items-center">
        <input
          ref={ref}
          type={inputType}
          className={`w-full ${inputClass}`}
          {...props}
        />
        {isPasswordInput && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 text-slate-400"
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </label>
  )
}

const ForwardedInput = forwardRef(Input)
export { ForwardedInput as Input }

