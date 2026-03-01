import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome completo'),
    email: z.string().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
    password: z
      .string()
      .min(8, 'A senha deve ter pelo menos 8 caracteres')
      .regex(/[A-Z]/, 'Use pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'Use pelo menos uma letra minúscula')
      .regex(/[0-9]/, 'Use pelo menos um número'),
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterPageProps {
  onBackToLogin: () => void
}

export function RegisterPage({ onBackToLogin }: RegisterPageProps) {
  const { register: registerAccount } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  })

  async function onSubmit(data: RegisterFormData) {
    setSubmitError(null)
    try {
      await registerAccount({
        nome: data.name,
        email: data.email,
        senha: data.password,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível criar sua conta. Tente novamente.'
      setSubmitError(message)
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Comece a usar o Severino para oferecer ou contratar serviços com mais segurança e organização."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {submitError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {submitError}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Nome completo"
            placeholder="Seu nome"
            autoComplete="name"
            {...register('name')}
            error={errors.name?.message}
          />

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
            autoComplete="new-password"
            {...register('password')}
            error={errors.password?.message}
          />

          <Input
            label="Confirmar senha"
            type="password"
            placeholder="Repita a senha"
            autoComplete="new-password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          <p className="text-xs text-slate-500">
            Ao criar sua conta você concorda com os termos de uso e política de privacidade do
            marketplace Severino.
          </p>
        </div>

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={!isValid}
          className="w-full"
        >
          Criar conta
        </Button>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Já tem uma conta?</span>
          <button
            type="button"
            onClick={onBackToLogin}
            className="font-medium text-sky-400 underline-offset-4 hover:text-sky-300 hover:underline"
          >
            Entrar
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

