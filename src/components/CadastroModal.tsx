import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Wrench, Lock } from 'lucide-react';
import ModalOverlay from './ModalOverlay';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'react-toastify';

interface CadastroModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const cadastroSchema = z.object({
    name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
    email: z.string().email({ message: 'E-mail inválido' }),
    password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
    confirmPassword: z.string(),
    terms: z.boolean().refine(val => val === true, {
        message: 'Você deve aceitar os Termos de Uso',
    }),
}).refine(data => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

type CadastroFormData = z.infer<typeof cadastroSchema>;

export default function CadastroModal({ isOpen, onClose }: CadastroModalProps) {
    const { setOpenModal, register: registerUser, setEmailForVerification } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CadastroFormData>({
        resolver: zodResolver(cadastroSchema),
        defaultValues: {
            terms: false,
        }
    });

    const onSubmit = async (data: CadastroFormData) => {
        setError(null);
        try {
            await registerUser({ nome: data.name, email: data.email, senha: data.password });
            toast.success('Cadastro realizado! Verifique seu e-mail para continuar.');
            setEmailForVerification(data.email); // Guarda o e-mail para o próximo modal
            onClose(); // Fecha o modal de cadastro
            setOpenModal('verifyEmail'); // Abre o modal de verificação
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro no cadastro. Tente novamente.');
        }
    };

    if (!isOpen) return null;

    return (
        <ModalOverlay isOpen={isOpen} onClose={onClose}>
            <div className="p-8 bg-white rounded-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-2 justify-center mb-4">
                    <Wrench className="w-6 h-6 text-orange-500" />
                    <span className="font-display text-xl font-bold text-brand-navy">SeverinoApp</span>
                </div>
                <div className="flex items-center gap-2 justify-center mb-6 text-sm text-gray-500">
                    <Lock className="w-4 h-4" /> Plataforma Segura
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Nome completo"
                        variant="light"
                        {...register('name')}
                        placeholder="Seu nome"
                        error={errors.name?.message}
                    />
                    <Input
                        label="E-mail"
                        type="email"
                        variant="light"
                        {...register('email')}
                        placeholder="seu@email.com"
                        error={errors.email?.message}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Senha"
                            type="password"
                            variant="light"
                            {...register('password')}
                            placeholder="••••••••"
                            error={errors.password?.message}
                        />
                        <Input
                            label="Confirmar Senha"
                            type="password"
                            variant="light"
                            {...register('confirmPassword')}
                            placeholder="••••••••"
                            error={errors.confirmPassword?.message}
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                            <input type="checkbox" {...register('terms')} className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange" />
                            Li e aceito os Termos de Uso
                        </label>
                        {errors.terms && <p className="text-sm text-red-500 mt-1">{errors.terms.message}</p>}
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <Button type="submit" className="bg-brand-orange hover:bg-orange-600 text-white font-bold w-full py-3 rounded-xl transition" disabled={isSubmitting}>
                        {isSubmitting ? 'Criando conta...' : 'Criar Conta'}
                    </Button>
                </form>

                <p className="text-sm text-center text-gray-500 mt-4">
                    Já tem conta?{' '}
                    <button onClick={() => { onClose(); setOpenModal('login'); }} className="text-brand-orange hover:underline font-medium">
                        Entrar
                    </button>
                </p>
            </div>
        </ModalOverlay>
    );
}
