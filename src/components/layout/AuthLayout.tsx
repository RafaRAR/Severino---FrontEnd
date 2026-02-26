import type { ReactNode } from 'react'
import { Wrench } from 'lucide-react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 md:flex-row md:items-stretch">
        <div className="flex flex-1 flex-col justify-between rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 px-8 py-8 shadow-2xl shadow-sky-900/40">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/40">
              <Wrench className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Marketplace de Serviços
              </p>
              <p className="text-lg font-semibold leading-tight text-slate-50">
                Severino
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
              {title}
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              {subtitle}
            </p>
          </div>

          <div className="mt-10 hidden text-xs text-slate-500 md:block">
            <p>
              Construído com foco em <span className="text-sky-400">tecnologia</span> e{' '}
              <span className="text-sky-400">confiança</span>. Ideal para conectar clientes a
              prestadores de serviço de forma simples e segura.
            </p>
          </div>
        </div>

        <div className="flex-1">
          <div className="rounded-2xl bg-slate-900/80 p-6 shadow-xl shadow-black/50 backdrop-blur md:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

