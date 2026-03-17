import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { MapPin, UploadCloud, X } from 'lucide-react';
import {
  createPost,
  fetchCep,
  api, 
  type Tag, 
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { maskCEP, maskPhone } from '../utils/masks';
import { BaseModal } from './ui/BaseModal';

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
  impulsionar: z.boolean().optional(),
});

type PostFormData = z.infer<typeof postFormSchema>;

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  roleSelecionada: 'Cliente' | 'Prestador';
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onPostCreated, roleSelecionada }) => {
  const { user, profile } = useAuth();
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADOS DAS TAGS ---
  const [tagsDisponiveis, setTagsDisponiveis] = useState<Tag[]>([]);
  const [tagsSelecionadas, setTagsSelecionadas] = useState<number[]>([]);
  
  // --- ESTADOS DO DROPDOWN ---
  const [buscaTag, setBuscaTag] = useState('');
  const [dropdownAberto, setDropdownAberto] = useState(false);

  // Lógica de filtragem do dropdown
  const tagsFiltradas = tagsDisponiveis.filter(tag => 
    tag.nome.toLowerCase().includes(buscaTag.toLowerCase()) &&
    !tagsSelecionadas.includes(tag.id)
  );

  const adicionarTag = (id: number) => {
    setTagsSelecionadas(prev => [...prev, id]);
    setBuscaTag(''); 
    setDropdownAberto(false); 
  };

  const removerTag = (id: number) => {
    setTagsSelecionadas(prev => prev.filter(tagId => tagId !== id));
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      impulsionar: false,
    }
  });

  // --- EFEITO PARA BUSCAR AS TAGS DO BACKEND ---
  useEffect(() => {
    if (isOpen) {
      const fetchTags = async () => {
        try {
          const { data } = await api.get<Tag[]>('/Tag');
          setTagsDisponiveis(data);
        } catch (error) {
          console.error("Erro ao carregar as tags:", error);
        }
      };
      fetchTags();
    } else {
      // Limpa os estados quando o modal fechar
      setTagsSelecionadas([]);
      setBuscaTag('');
      setDropdownAberto(false);
    }
  }, [isOpen]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
    if (!profile) return;

    const { cep, endereco, contato } = profile;

    setValue('cep', cep, { shouldDirty: true });
    setValue('contato', contato, { shouldDirty: true });

    lookupCep(cep);

    const match = endereco.match(/, (\S+)\s-/);
    if (match && match[1]) {
      setValue('numero', match[1]);
    }
  };

  const onSubmit = async (data: PostFormData) => {
    if (!user?.id || !roleSelecionada) {
      setSubmitError("Você precisa estar logado para criar um anúncio.");
      return;
    }

    const formData = new FormData();
    const endereco = `${data.rua}, ${data.numero}${data.complemento ? `, ${data.complemento}` : ''} - ${data.bairro}, ${data.cidade} - ${data.estado.toUpperCase()}`;

    formData.append('titulo', data.titulo);
    formData.append('conteudo', data.conteudo);
    formData.append('cep', data.cep.replace(/\D/g, ''));
    formData.append('contato', data.contato.replace(/\D/g, ''));
    formData.append('endereco', endereco);
    formData.append('role', roleSelecionada);
    formData.append('impulsionar', String(!!data.impulsionar));

    // --- ENVIANDO AS TAGS NO FORMDATA ---
    tagsSelecionadas.forEach((tagId) => {
      formData.append('TagIds', tagId.toString());
    });

    if (imageFile) {
      formData.append('Imagem', imageFile);
    }

    try {
      await createPost(user.id, formData);
      onPostCreated();
      onClose(); 
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Falha ao criar anúncio.");
    }
  };

  return (
    <BaseModal title={roleSelecionada === 'Cliente' ? 'Pedir Ajuda' : 'Oferecer Serviço'} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <div className="space-y-2">
          <label className="block text-sm font-medium text-brand-navy">
            Imagem do Anúncio (Opcional)
          </label>
          <div
            className="mt-2 flex justify-center items-center p-6 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer hover:border-brand-orange transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview do post" className="mx-auto h-28 w-auto rounded-lg object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <UploadCloud size={40} />
                  <span className="font-semibold text-brand-navy">Clique para carregar uma imagem</span>
                  <span className="text-xs">PNG, JPG, GIF até 10MB</span>
                </div>
              )}
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <Input label="Título do Anúncio" {...register('titulo')} error={errors.titulo?.message} variant="light" />
        
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">Descrição</label>
          <textarea {...register('conteudo')} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-navy focus:ring-1 focus:ring-brand-navy disabled:bg-gray-100 shadow-md" rows={4}></textarea>
          {errors.conteudo && <span className="text-xs text-red-500">{errors.conteudo.message}</span>}
        </div>

        {/* --- NOVA SEÇÃO DE TAGS (COM BUSCA/DROPDOWN) --- */}
        <div className="pt-2 pb-2">
          <label className="block text-sm font-medium text-brand-navy mb-2">
            Categorias do Serviço
          </label>
          
          <div className="relative">
            <input
              type="text"
              value={buscaTag}
              onChange={(e) => {
                setBuscaTag(e.target.value);
                setDropdownAberto(true);
              }}
              onFocus={() => setDropdownAberto(true)}
              onBlur={() => {
                setTimeout(() => setDropdownAberto(false), 200);
              }}
              placeholder="Digite para buscar categorias..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-navy focus:ring-1 focus:ring-brand-navy"
            />

            {dropdownAberto && tagsFiltradas.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {tagsFiltradas.map((tag) => (
                  <li
                    key={tag.id}
                    onMouseDown={(e) => {
                      e.preventDefault(); 
                      adicionarTag(tag.id);
                    }}
                    className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-brand-orange hover:text-white transition-colors"
                  >
                    {tag.nome}
                  </li>
                ))}
              </ul>
            )}
            {dropdownAberto && buscaTag && tagsFiltradas.length === 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg">
                Nenhuma categoria encontrada.
              </div>
            )}
          </div>

          {tagsSelecionadas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tagsSelecionadas.map((tagId) => {
                const tag = tagsDisponiveis.find(t => t.id === tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tag.id}
                    className="flex items-center gap-1 bg-brand-orange text-white px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {tag.nome}
                    <button
                      type="button"
                      onClick={() => removerTag(tag.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-orange-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
        {/* --- FIM DA SEÇÃO DE TAGS --- */}

        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-brand-navy">Endereço e Contato</h3>
            {profile && (
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

        <div className="flex items-center gap-2 pt-4">
          <input
            type="checkbox"
            id="impulsionar"
            {...register('impulsionar')}
            className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
          />
          <label htmlFor="impulsionar" className="text-sm text-gray-700">
            Deseja impulsionar este anúncio? (Ganha mais destaque)
          </label>
        </div>

        {submitError && <p className="text-sm text-red-500">{submitError}</p>}
        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="default" className="font-bold text-white hover:bg-orange-600">Criar Anúncio</Button>
        </div>
      </form>
    </BaseModal>
  );
};