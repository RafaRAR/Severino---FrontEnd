import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Wrench, Lock } from 'lucide-react';
import ModalOverlay from './ModalOverlay';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const loginSchema = z.object({
    email: z.string().email({ message: 'E-mail inválido' }),
    senha: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { setOpenModal, loginWithCredentials } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setError(null);
        try {
            await loginWithCredentials(data);
            onClose();
        } catch (err) {
            setError('E-mail ou senha incorretos. Por favor, tente novamente.');
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="p-8 bg-white rounded-lg">
                <div className="flex items-center gap-2 justify-center mb-6">
                    <Wrench className="w-6 h-6 text-orange-500" />
                    <span className="font-display text-xl font-bold text-brand-navy">SeverinoApp</span>
                </div>
                <div className="flex items-center gap-2 justify-center mb-6 text-sm text-gray-500">
                    <Lock className="w-4 h-4" /> Plataforma Segura
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="E-mail"
                        type="email"
                        variant="light"
                        {...register('email')}
                        placeholder="seu@email.com"
                        error={errors.email?.message}
                    />
                    <Input
                        label="Senha"
                        type="password"
                        variant="light"
                        {...register('senha')}
                        placeholder="••••••••"
                        error={errors.senha?.message}
                    />

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <Button type="submit" className="bg-brand-orange hover:bg-orange-600 text-white font-bold w-full py-3 rounded-xl transition" disabled={isSubmitting}>
                        {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </Button>
                </form>

                <button
                    onClick={() => setOpenModal('recuperarSenha')}
                    className="text-sm text-brand-orange hover:underline font-medium mt-3 block mx-auto"
                >
                    Esqueci minha senha
                </button>

                <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-gray-300" />
                    <span className="text-xs text-gray-500">ou</span>
                    <div className="flex-1 h-px bg-gray-300" />
                </div>

                {/* <Button variant="outline" className="w-full border-gray-300 text-gray-900" disabled>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 mr-2" alt="" />
                    Entrar com Google
                </Button> */}

                <p className="text-sm text-center text-gray-500 mt-5">
                    Não tem conta?{' '}
                    <button onClick={() => setOpenModal('cadastro')} className="text-brand-orange hover:underline font-medium">
                        Cadastre-se
                    </button>
                </p>
            </div>
        </ModalOverlay>
    );
}
