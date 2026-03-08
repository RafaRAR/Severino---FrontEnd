import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { solicitarReset } from '../services/api'

import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!email) {
      setError('Por favor, preencha o campo de e-mail.')
      return
    }
    setIsLoading(true)
    try {
      await solicitarReset({ email })
      setSuccess('Código de recuperação enviado com sucesso.')
      // Redirect to the reset password page, passing the email
      navigate('/resetar-senha', { state: { email } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title='Esqueceu a Senha?' subtitle='Não se preocupe! Digite seu e-mail para receber o código de recuperação.'>
      <form onSubmit={handleRequestReset}>
        <div className="mb-4">
          <Input
            id="email"
            type="email"
            label="E-mail"
            placeholder="seu-email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-4 text-center">{success}</p>}


        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Enviando...' : 'Enviar Código de Recuperação'}
        </Button>
      </form>
      <div className="mt-6 text-center">
        <button onClick={() => navigate('/login')} className="text-sm text-brand-orange hover:underline">
          Voltar para o Login
        </button>
      </div>
    </AuthLayout>
  )
}
