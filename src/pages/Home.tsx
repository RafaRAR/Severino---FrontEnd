import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ServiceCard } from '../components/ui/ServiceCard';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Plus, Image, Phone, Loader2, MapPin } from 'lucide-react';
import {
  getAllPosts,
  createPost,
  fetchCep,
  getCadastro,
  type Post,
  type PostPayload,
  type CadastroPayload,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { maskCEP, maskPhone } from '../utils/masks';

// Schema for the Create Post form
const postFormSchema = z.object({
  titulo: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.'),
  conteudo: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  cep: z.string().refine((v) => v.replace(/\D/g, '').length === 8, 'CEP inválido.'),
  rua: z.string().min(1, 'A rua é obrigatória.'),
  numero: z.string().min(1, 'O número é obrigatório.'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'O bairro é obrigatório.'),
  cidade: z.string().min(1, 'A cidade é obrigatória.'),
  estado: z.string().length(2, 'O UF é obrigatório.'),
  contato: z.string().refine((v) => {
    const digits = v.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
  }, 'O contato deve ter 10 ou 11 dígitos.'),
});

type PostFormData = z.infer<typeof postFormSchema>;

// Main Home Component
export const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      // Don't set loading to true here to avoid flickering on re-fetch
      const fetchedPosts = await getAllPosts();
      setPosts(fetchedPosts.sort((a, b) => new Date(b.dataPostagem).getTime() - new Date(a.dataPostagem).getTime()));
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  const handleCardClick = (post: Post) => {
    setSelectedPost(post);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedPost(null);
  };

  const handlePostCreated = () => {
    setIsCreateModalOpen(false);
    fetchPosts();
  };

  const cleanPhoneNumber = (phone: string) => phone.replace(/\D/g, '');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-navy p-4 text-white shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">SeverinoApp</h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="animate-spin text-brand-orange" size={40} />
              <p className="ml-4 text-lg text-gray-600">Carregando anúncios...</p>
            </div>
          ) : (
            posts.map((post) => (
              <ServiceCard
                key={post.id}
                post={post}
                onClick={() => handleCardClick(post)}
              />
            ))
          )}
        </div>
      </main>

      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-8 right-8 flex items-center justify-center rounded-full bg-brand-orange p-4 font-bold text-white shadow-lg transition-colors hover:bg-orange-600"
      >
        <Plus size={24} />
      </button>

      {selectedPost && (
        <Dialog isOpen={isViewModalOpen} onClose={handleCloseViewModal}>
          <div className="bg-gray-200 mb-4 flex h-64 items-center justify-center rounded-lg">
            <Image size={80} className="text-gray-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-brand-navy">{selectedPost.titulo}</h2>
          <p className="mb-4 text-gray-600">{selectedPost.conteudo}</p>
          <a
            href={`https://wa.me/55${cleanPhoneNumber(selectedPost.contato)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center rounded bg-green-500 py-2 px-4 font-bold text-white hover:bg-green-600"
          >
            <Phone size={20} className="mr-2" />
            Chamar no WhatsApp
          </a>
        </Dialog>
      )}

      {isCreateModalOpen && (
        <Dialog isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
          <div className="max-h-[80vh] overflow-y-auto">
            <CreatePostForm onPostCreated={handlePostCreated} onClose={() => setIsCreateModalOpen(false)} />
          </div>
        </Dialog>
      )}
    </div>
  );
};


// Create Post Form Component
interface CreatePostFormProps {
    onPostCreated: () => void;
    onClose: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated, onClose }) => {
    const { user } = useAuth();
    const [loadingCep, setLoadingCep] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<CadastroPayload | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        setFocus,
        formState: { errors, isSubmitting },
      } = useForm<PostFormData>({
        resolver: zodResolver(postFormSchema),
      });

    useEffect(() => {
        if (user?.id) {
            getCadastro(user.id)
                .then(setUserProfile)
                .catch(console.error);
        }
    }, [user?.id]);
    
    const lookupCep = useCallback(async (cep: string) => {
        const cleanCep = (cep || '').replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        setLoadingCep(true);
        try {
            const data = await fetchCep(cleanCep);
            if (data.logradouro) setValue('rua', data.logradouro);
            if (data.bairro) setValue('bairro', data.bairro);
            if (data.localidade) setValue('cidade', data.localidade);
            if (data.uf) setValue('estado', data.uf);
            setFocus('numero');
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingCep(false);
        }
    }, [setValue, setFocus]);

    const cepValue = watch('cep');
    const handleCepBlur = useCallback(() => {
        lookupCep(cepValue);
    }, [cepValue, lookupCep]);

    const handleUseProfileAddress = () => {
        if (!userProfile) return;

        const { cep, endereco, contato } = userProfile;
        
        setValue('cep', cep, { shouldDirty: true });
        setValue('contato', contato, { shouldDirty: true });
        
        lookupCep(cep);

        const match = endereco.match(/, (\S+)\s-/);
        if (match && match[1]) {
            setValue('numero', match[1]);
        }
    };

    const onSubmit = async (data: PostFormData) => {
        if (!user?.id) {
            setSubmitError("Você precisa estar logado para criar um anúncio.");
            return;
        }

        const endereco = `${data.rua}, ${data.numero}${data.complemento ? `, ${data.complemento}` : ''} - ${data.bairro}, ${data.cidade} - ${data.estado.toUpperCase()}`;

        const payload: PostPayload = {
            titulo: data.titulo,
            conteudo: data.conteudo,
            cep: data.cep,
            contato: data.contato,
            endereco,
        };

        try {
            await createPost(user.id, payload);
            onPostCreated();
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Falha ao criar anúncio.");
        }
    };

    return (
        <>
            <h2 className="text-2xl font-bold text-brand-navy mb-4">Criar Novo Anúncio</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input label="Título do Anúncio" {...register('titulo')} error={errors.titulo?.message} variant="light" />
                <div>
                    <label className="block text-sm font-medium text-brand-navy mb-1">Descrição</label>
                    <textarea {...register('conteudo')} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-navy focus:ring-1 focus:ring-brand-navy disabled:bg-gray-100 shadow-md" rows={4}></textarea>
                    {errors.conteudo && <span className="text-xs text-red-500">{errors.conteudo.message}</span>}
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-brand-navy">Endereço e Contato</h3>
                        {userProfile && (
                            <button type="button" onClick={handleUseProfileAddress} className="flex items-center gap-1 text-sm text-brand-orange hover:underline">
                                <MapPin size={16} />
                                Usar meu endereço de cadastro
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="CEP" {...register('cep')} onBlur={handleCepBlur} onChange={(e) => {
                            const masked = maskCEP(e.target.value);
                            e.target.value = masked;
                            register('cep').onChange(e);
                        }} error={errors.cep?.message} variant="light" placeholder="00000-000" />
                        <Input label="Rua" {...register('rua')} error={errors.rua?.message} variant="light" disabled={loadingCep} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_2fr] gap-4 mt-4">
                        <Input label="Número" {...register('numero')} error={errors.numero?.message} variant="light" />
                        <Input label="UF" {...register('estado')} error={errors.estado?.message} variant="light" disabled={loadingCep} maxLength={2} />
                        <Input label="Cidade" {...register('cidade')} error={errors.cidade?.message} variant="light" disabled={loadingCep} />
                    </div>
                    <div className="mt-4">
                      <Input label="Bairro" {...register('bairro')} error={errors.bairro?.message} variant="light" disabled={loadingCep} />
                    </div>
                    <div className="mt-4">
                      <Input label="Complemento (Opcional)" {...register('complemento')} error={errors.complemento?.message} variant="light" />
                    </div>
                    <div className="mt-4">
                      <Input label="Contato (WhatsApp)" {...register('contato')} onChange={(e) => {
                              const masked = maskPhone(e.target.value);
                              e.target.value = masked;
                              register('contato').onChange(e);
                          }} error={errors.contato?.message} variant="light" placeholder="(11) 99999-9999" />
                    </div>
                </div>

                {submitError && <p className="text-sm text-red-500">{submitError}</p>}
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="brand" loading={isSubmitting} className="font-bold text-white hover:bg-orange-600">Criar Anúncio</Button>
                </div>
            </form>
        </>
    );
};

