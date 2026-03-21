import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { solicitarReset } from '../services/api';
import { Wrench, Mail, CheckCircle } from 'lucide-react';
import ModalOverlay from './ModalOverlay';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'react-toastify';

interface RecuperarSenhaModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const recuperarSenhaSchema = z.object({
    email: z.string().email({ message: 'E-mail inválido' }),
});

type RecuperarSenhaFormData = z.infer<typeof recuperarSenhaSchema>;

export default function RecuperarSenhaModal({ isOpen, onClose }: RecuperarSenhaModalProps) {
    const { setOpenModal } = useAuth();
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<RecuperarSenhaFormData>({
        resolver: zodResolver(recuperarSenhaSchema),
    });

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setSent(false);
            setError(null);
            reset();
        }, 300); // Delay to allow modal to close before state reset
    };

    const onSubmit = async (data: RecuperarSenhaFormData) => {
        setError(null);
        try {
            await solicitarReset({ email: data.email });
            setSubmittedEmail(data.email);
            setSent(true);
        } catch (err: any) {
            const errorMessage = err.message || 'Não foi possível enviar o link. Tente novamente.';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay isOpen={isOpen} onClose={handleClose}>
            <div className="p-8 text-center bg-white rounded-lg">
                <div className="flex items-center gap-2 justify-center mb-6">
                    <Wrench className="w-6 h-6 text-orange-500" />
                    <span className="font-display text-xl font-bold text-brand-navy">SeverinoApp</span>
                </div>

                {sent ? (
                    <div className="space-y-4">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <h2 className="font-display text-xl font-bold text-brand-navy">Verifique seu e-mail</h2>
                        <p className="text-sm text-gray-500">
                            Enviamos um link de recuperação para <strong className="text-gray-900">{submittedEmail}</strong>
                        </p>
                        <Button variant="outline" className="border-gray-300 text-gray-900" onClick={() => { handleClose(); setOpenModal('login'); }}>
                            Voltar ao Login
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Mail className="w-12 h-12 text-gray-400 mx-auto" />
                        <h2 className="font-display text-lg font-bold text-brand-navy">Recuperar Senha</h2>
                        
                        <Input
                            label="E-mail"
                            type="email"
                            variant="light"
                            {...register('email')}
                            placeholder="seu@email.com"
                            error={errors.email?.message}
                        />

                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <Button type="submit" className="bg-brand-orange hover:bg-orange-600 text-white font-bold w-full py-3 rounded-xl transition" disabled={isSubmitting}>
                            {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
                        </Button>
                        <button
                            type="button"
                            onClick={() => { handleClose(); setOpenModal('login'); }}
                            className="text-sm text-brand-orange hover:underline font-medium"
                        >
                            Voltar ao Login
                        </button>
                    </form>
                )}
            </div>
        </ModalOverlay>
    );
}
