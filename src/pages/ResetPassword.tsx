import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { resetarSenha } from '../services/api'

import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !code || !newPassword) {
      setError('Por favor, preencha todos os campos.')
      return
    }
    setIsLoading(true)
    try {
      await resetarSenha({ email, codigo: code, novaSenha: newPassword })
      // On success, redirect to the login page with a success message
      navigate('/login', { state: { successMessage: 'Senha redefinida com sucesso!' } })
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('400')) {
          setError('Código de verificação inválido ou expirado. Tente novamente.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Ocorreu um erro desconhecido.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title='Redefinir Senha' subtitle='Crie uma nova senha para sua conta.'>
      <form onSubmit={handleResetPassword}>
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
            label="Código de Recuperação"
            placeholder="_ _ _ _ _ _"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />
        </div>
        <div className="mb-6">
          <Input
            id="newPassword"
            type="password"
            label="Nova Senha"
            placeholder="********"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
        </Button>
      </form>
    </AuthLayout>
  )
}
