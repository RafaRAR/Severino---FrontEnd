import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import {
  editPost,
  fetchCep,
  type Post,
  type PostPayload,
} from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { maskCEP, maskPhone } from '../utils/masks';
import { BaseModal } from './ui/BaseModal';
import { toast } from 'react-toastify';

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

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated: () => void;
  post: Post;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, onClose, onPostUpdated, post }) => {
  const { user } = useAuth();
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
  });

  useEffect(() => {
    if (post) {
      // Pre-fill form with post data
      const addressParts = post.endereco.split(', ');
      const cep = post.cep;
      const rua = addressParts[0] || '';
      const numero = addressParts[1] ? addressParts[1].split(' - ')[0] : '';
      const bairro = addressParts[1] ? addressParts[1].split(' - ')[1] : '';
      const cidade = addressParts[2] ? addressParts[2].split(' - ')[0] : '';
      const estado = addressParts[2] ? addressParts[2].split(' - ')[1] : '';

      reset({
        titulo: post.titulo,
        conteudo: post.conteudo,
        cep: cep,
        rua: rua,
        numero: numero,
        bairro: bairro,
        cidade: cidade,
        estado: estado,
        contato: post.contato,
        complemento: '', // Assuming complemento is not available in post data
      });
    }
  }, [post, reset]);



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
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCep(false);
    }
  }, [setValue]);

  const cepValue = watch('cep');
  const handleCepBlur = useCallback(() => {
    lookupCep(cepValue);
  }, [cepValue, lookupCep]);

  const onSubmit = async (data: PostFormData) => {
    if (!user?.id || !post) {
      setSubmitError("Você precisa estar logado para editar um anúncio.");
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
      await editPost(post.id.toString(), payload);
      onPostUpdated();
      toast.success('Anúncio atualizado com sucesso!');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Falha ao editar anúncio.");
    }
  };

  return (
    <BaseModal title="Editar Anúncio" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Título do Anúncio" {...register('titulo')} error={errors.titulo?.message} variant="light" />
        <div>
          <label className="block text-sm font-medium text-brand-navy mb-1">Descrição</label>
          <textarea {...register('conteudo')} className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-brand-navy placeholder:text-gray-400 outline-none transition focus:border-brand-navy focus:ring-1 focus:ring-brand-navy disabled:bg-gray-100 shadow-md" rows={4}></textarea>
          {errors.conteudo && <span className="text-xs text-red-500">{errors.conteudo.message}</span>}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-brand-navy">Endereço e Contato</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="brand" loading={isSubmitting} className="font-bold text-white hover:bg-orange-600">Salvar Alterações</Button>
        </div>
      </form>
    </BaseModal>
  );
};
