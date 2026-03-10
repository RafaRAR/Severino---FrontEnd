import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { resetarSenha } from '../services/api';

import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const resetPasswordSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  code: z.string().length(6, 'O código deve ter 6 dígitos'),
  newPassword: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Use pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Use pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Use pelo menos um número'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      email: location.state?.email || '',
    },
  });

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setSubmitError('');
    try {
      await resetarSenha({ email: data.email, codigo: data.code, novaSenha: data.newPassword });
      navigate('/login', { state: { successMessage: 'Senha redefinida com sucesso!' } });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('400')) {
          setSubmitError('Código de verificação inválido ou expirado. Tente novamente.');
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError('Ocorreu um erro desconhecido.');
      }
    }
  };

  return (
    <AuthLayout title="Redefinir Senha" subtitle="Crie uma nova senha para sua conta.">
      <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-6">
        {submitError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {submitError}
          </div>
        )}
        <div className="space-y-4">
          <Input
            id="email"
            type="email"
            label="E-mail"
            placeholder="seu-email@exemplo.com"
            {...register('email')}
            error={errors.email?.message}
            disabled={!!location.state?.email}
          />
          <Input
            id="code"
            type="text"
            label="Código de Recuperação"
            placeholder="______"
            {...register('code')}
            error={errors.code?.message}
            maxLength={6}
          />
          <Input
            id="newPassword"
            type="password"
            label="Nova Senha"
            placeholder="********"
            {...register('newPassword')}
            error={errors.newPassword?.message}
          />
          <Input
            id="confirmPassword"
            type="password"
            label="Confirmar Nova Senha"
            placeholder="********"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || !isValid}>
          {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
        </Button>
      </form>
    </AuthLayout>
  );
}
