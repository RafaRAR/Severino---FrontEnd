import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "trigger"
  | "ai"
  | "success"
  | "primary"
  | "brand"
  | "whatsapp";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  loading,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60'

  const variants: Record<Variant, string> = {
        default: "bg-primary text-primary-foreground hover:bg-orange-600 rounded-xl",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl",
        outline: "border border-foreground text-foreground bg-card hover:bg-foreground hover:text-card rounded-xl",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl",
        ghost: "hover:bg-secondary hover:text-secondary-foreground rounded-xl",
        link: "text-primary underline-offset-4 hover:underline",
        trigger: "bg-secondary text-foreground hover:bg-muted rounded-xl",
        ai: "bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 rounded-xl",
        success: "bg-success text-success-foreground hover:bg-success/90 rounded-xl",
        whatsapp: "bg-success text-success-foreground hover:bg-success/90 rounded-xl text-lg font-bold",
        primary:
        'bg-sky-500 text-white hover:bg-sky-400 active:bg-sky-600 shadow-sm shadow-sky-900/40',
      brand:
        'bg-brand-orange text-white hover:bg-brand-orange/90 active:bg-brand-orange/80 shadow-md focus-visible:ring-brand-orange/50',

  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      <span>{children}</span>
    </button>
  )
}

