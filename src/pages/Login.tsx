import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Use pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Use pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Use pelo menos um número'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginPageProps {
  onGoToRegister: () => void
}

export function LoginPage({ onGoToRegister }: LoginPageProps) {
  const { login } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  async function onSubmit(data: LoginFormData) {
    setSubmitError(null)
    try {
      await login({
        email: data.email,
        password: data.password,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.'
      setSubmitError(message)
    }
  }

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Acesse sua conta para gerenciar seus serviços, clientes e oportunidades no marketplace Severino."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {submitError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {submitError}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seuemail@exemplo.com"
            autoComplete="email"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
            error={errors.password?.message}
          />

          <p className="text-xs text-slate-500">
            Use uma senha forte com letras maiúsculas, minúsculas e números para garantir a
            segurança da sua conta.
          </p>
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!isValid}
          className="w-full"
        >
          Entrar
        </Button>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Ainda não tem conta?</span>
          <button
            type="button"
            onClick={onGoToRegister}
            className="font-medium text-sky-400 underline-offset-4 hover:text-sky-300 hover:underline"
          >
            Criar conta
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

