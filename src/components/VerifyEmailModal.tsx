import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { solicitarVerificacao, verificarEmail } from '../services/api';
import { Wrench, Mail, CheckCircle } from 'lucide-react';
import ModalOverlay from './ModalOverlay';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'react-toastify';

const verifySchema = z.object({
  code: z.string().length(6, { message: 'O código deve ter 6 dígitos' }),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyEmailModal() {
  const {
    openModal,
    setOpenModal,
    emailForVerification,
    login,
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
  });

  const isOpen = openModal === 'verifyEmail';

  useEffect(() => {
    // Reset form when modal opens or email changes
    if (isOpen) {
      reset();
      setError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: VerifyFormData) => {
    if (!emailForVerification) {
      setError('E-mail não encontrado. Por favor, tente o cadastro novamente.');
      return;
    }
    setError(null);
    try {
      const { token, user } = await verificarEmail({
        email: emailForVerification,
        codigo: data.code,
      });
      toast.success('E-mail verificado com sucesso! Bem-vindo!');
      login(token, user); // Loga o usuário e o estado do app vai mudar
      setOpenModal(null); // Fecha o modal
    } catch (err: any) {
      const errorMessage = err.message || 'Código inválido ou expirado.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleResendCode = async () => {
    if (!emailForVerification) {
      toast.error('E-mail não encontrado para o reenvio.');
      return;
    }
    setIsResending(true);
    try {
      await solicitarVerificacao({ email: emailForVerification });
      toast.info('Um novo código foi enviado para o seu e-mail.');
    } catch (err: any) {
      toast.error(err.message || 'Falha ao reenviar o código.');
    } finally {
      setIsResending(false);
    }
  };
  
  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={() => setOpenModal(null)}>
      <div className="p-8 text-center bg-white rounded-lg">
        <div className="flex items-center gap-2 justify-center mb-6">
          <Wrench className="w-6 h-6 text-orange-500" />
          <span className="font-display text-xl font-bold text-brand-navy">SeverinoApp</span>
        </div>

        <Mail className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="font-display text-lg font-bold text-brand-navy mt-4">Verifique seu E-mail</h2>
        <p className="text-sm text-gray-500 mt-2 mb-6">
          Enviamos um código de 6 dígitos para <br />
          <strong className="text-gray-900">{emailForVerification}</strong>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Código de Verificação"
            type="text"
            variant="light"
            {...register('code')}
            placeholder="_ _ _ _ _ _"
            error={errors.code?.message}
            maxLength={6}
            className="tracking-[1em] text-center"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="bg-brand-orange hover:bg-orange-600 text-white font-bold w-full py-3 rounded-xl transition" disabled={isSubmitting}>
            {isSubmitting ? 'Verificando...' : 'Verificar e Entrar'}
          </Button>

          <div className="text-sm">
            <span className="text-gray-500">Não recebeu o código? </span>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className="text-brand-orange hover:underline font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {isResending ? 'Reenviando...' : 'Reenviar código'}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
