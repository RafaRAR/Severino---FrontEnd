import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { solicitarVerificacao, verificarEmail } from '../services/api'

import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function VerifyEmail() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email || !code) {
      setError('Por favor, preencha todos os campos.')
      return
    }
    setIsLoading(true)
    try {
      const { token, user } = await verificarEmail({ email, codigo: code })
      login(token, user)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError('')
    setSuccess('')
    if (!email) {
      setError('Por favor, preencha o campo de e-mail.')
      return
    }
    try {
      await solicitarVerificacao({ email })
      setSuccess('Um novo código foi enviado para o seu e-mail.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.')
    }
  }

  return (
    <AuthLayout title='Verificar E-mail' subtitle='Enviamos um código de 6 dígitos para o seu e-mail.'>
      <form onSubmit={handleVerification}>
        <div className="mb-4">
          <Input
            id="email"
            type="email"
            label="E-mail"
            placeholder="seu-email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!location.state?.email}
          />
        </div>
        <div className="mb-4">
          <Input
            id="code"
            type="text"
            label="Código de Verificação"
            placeholder="_ _ _ _ _ _"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-4 text-center">{success}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Verificando...' : 'Verificar'}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <button onClick={handleResendCode} className="text-sm text-brand-orange hover:underline">
          Reenviar código
        </button>
      </div>
    </AuthLayout>
  )
}
