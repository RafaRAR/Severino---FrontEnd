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
}

function Input(
  { label, error, className = '', type, ...props }: InputProps,
  ref: Ref<HTMLInputElement>,
) {
  const [showPassword, setShowPassword] = useState(false)

  const isPasswordInput = type === 'password'
  const inputType = isPasswordInput
    ? showPassword
      ? 'text'
      : 'password'
    : type

  return (
    <label className="flex flex-col gap-1 text-sm text-slate-200">
      <span>{label}</span>
      <div className="relative flex items-center">
        <input
          ref={ref}
          type={inputType}
          className={`w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${className}`}
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

