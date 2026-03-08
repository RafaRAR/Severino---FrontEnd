import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'

const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('Informe um e-mail válido'),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const { loginWithCredentials, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(location.state?.successMessage || null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  async function onSubmit(data: LoginFormData) {
    setSubmitError(null)
    setSuccessMessage(null)
    try {
      await loginWithCredentials({
        email: data.email,
        senha: data.password,
      })
      navigate('/')
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
        {successMessage && (
          <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs text-green-300">
            {successMessage}
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
        </div>
        
        <div className="text-right text-sm">
          <Link to="/esqueci-senha" className="font-medium text-brand-orange hover:underline">
            Esqueceu a senha?
          </Link>
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
            onClick={() => navigate('/registrar')}
            className="font-medium text-sky-400 underline-offset-4 hover:text-sky-300 hover:underline"
          >
            Criar conta
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}

