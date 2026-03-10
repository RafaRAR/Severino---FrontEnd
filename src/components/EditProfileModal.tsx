import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BaseModal } from './ui/BaseModal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { maskCEP, maskCPF, maskDate, maskPhone } from '../utils/masks';
import { toast } from 'react-toastify';

// Schema idêntico ao original
const profileSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().length(14, 'CPF inválido'),
  dataNascimento: z.string().length(10, 'Data de nascimento inválida'),
  contato: z.string().min(14, 'Contato inválido'),
  cep: z.string().length(9, 'CEP inválido'),
  rua: z.string().min(1, 'Rua é obrigatória'),
  numero: z.string().min(1, 'Número é obrigatório'),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(1, 'Estado é obrigatório'),
  role: z.string(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const EditProfileModal = ({ isOpen, onClose, userId }: EditProfileModalProps) => {
  const { profile, updateProfile } = useAuth();
  const [loadingCep, setLoadingCep] = useState(false);
  const [addressWarning, setAddressWarning] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const cepValue = watch('cep');

  // Função auxiliar para extrair apenas dígitos
  const cleanCep = useCallback((cep: string) => (cep || '').replace(/\D/g, ''), []);

  // Busca endereço via CEP (disparada no onBlur)
  const handleCepBlur = useCallback(async () => {
    const cepDigits = cleanCep(cepValue);
    if (cepDigits.length !== 8) return;

    setLoadingCep(true);
    clearErrors('cep');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();
      if (data.erro) {
        setError('cep', { message: 'CEP não encontrado' });
        return;
      }
      // Preenche os campos de endereço apenas se houver dados
      setValue('rua', data.logradouro || '', { shouldValidate: true });
      setValue('bairro', data.bairro || '', { shouldValidate: true });
      setValue('cidade', data.localidade || '', { shouldValidate: true });
      setValue('estado', data.uf || '', { shouldValidate: true });
      // Foca no número para agilizar a edição
      setTimeout(() => {
        const numeroInput = document.querySelector<HTMLInputElement>('input[name="numero"]');
        numeroInput?.focus();
      }, 100);
    } catch (error) {
      setError('cep', { message: 'Erro ao consultar CEP' });
    } finally {
      setLoadingCep(false);
    }
  }, [cepValue, setValue, setError, clearErrors]);

  // Parse do endereço concatenado salvo no backend
  const parseAddress = (address: string) => {
    const parts = address.split(' - ');
    if (parts.length === 3) {
      const [ruaNumero, bairroCidade, estado] = parts;
      const ruaNumeroParts = ruaNumero.split(', ');
      const bairroCidadeParts = bairroCidade.split(', ');
      if (ruaNumeroParts.length === 2 && bairroCidadeParts.length === 2) {
        const [rua, numero] = ruaNumeroParts;
        const [bairro, cidade] = bairroCidadeParts;
        return { rua, numero, bairro, cidade, estado };
      }
    }
    return null;
  };

  // Carrega os dados do usuário ao abrir o modal
  useEffect(() => {
    if (isOpen && userId) {
      api.get(`/cadastro/getcadastro/${userId}`).then((response) => {
        const userData = response.data;
        const address = parseAddress(userData.endereco);
        if (address) {
          setAddressWarning(false);
          reset({
            ...userData,
            ...address,
          });
        } else {
          setAddressWarning(true);
          reset({
            ...userData,
            rua: '',
            numero: '',
            bairro: '',
            cidade: '',
            estado: '',
          });
        }
      });
    }
  }, [isOpen, userId, reset]);

  const onSubmit = async (data: ProfileForm) => {
    const { rua, numero, bairro, cidade, estado, ...rest } = data;
    const endereco = `${rua}, ${numero} - ${bairro}, ${cidade} - ${estado.toUpperCase()}`;

    try {
      await api.put(`/cadastro/updatecadastro/${userId}`, {
        ...rest,
        endereco,
      });

      toast.success('Perfil atualizado com sucesso!');
      if (profile) {
        const updatedUser = { ...profile, ...rest, endereco };
        updateProfile(updatedUser);
      }
      onClose();
    } catch (error) {
      toast.error('Erro ao atualizar o perfil. Tente novamente.');
      console.error(error);
    }
  };

  return (
    <BaseModal title="Editar Perfil" isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg">
          <p className="text-sm font-medium text-gray-600">Sua conta:</p>
          <span className="text-sm font-bold text-brand-navy bg-blue-100 px-4 py-1 rounded-full">
            {profile?.role}
          </span>
        </div>

        <fieldset className="space-y-4 pt-2" disabled={isSubmitting}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome Completo"
              {...register('nome')}
              error={errors.nome?.message}
              variant="light"
            />
            <Controller
              name="cpf"
              control={control}
              render={({ field }) => (
                <Input
                  label="CPF"
                  {...field}
                  onChange={(e) => field.onChange(maskCPF(e.target.value))}
                  error={errors.cpf?.message}
                  variant="light"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="dataNascimento"
              control={control}
              render={({ field }) => (
                <Input
                  label="Data de Nascimento"
                  {...field}
                  onChange={(e) => field.onChange(maskDate(e.target.value))}
                  error={errors.dataNascimento?.message}
                  variant="light"
                />
              )}
            />
            <Controller
              name="contato"
              control={control}
              render={({ field }) => (
                <Input
                  label="Contato"
                  {...field}
                  onChange={(e) => field.onChange(maskPhone(e.target.value))}
                  error={errors.contato?.message}
                  variant="light"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_2fr]">
            <Controller
              name="cep"
              control={control}
              render={({ field }) => (
                <Input
                  label="CEP"
                  {...field}
                  onBlur={handleCepBlur}
                  onChange={(e) => field.onChange(maskCEP(e.target.value))}
                  error={errors.cep?.message}
                  variant="light"
                />
              )}
            />
            <Input
              label="Rua"
              {...register('rua')}
              error={errors.rua?.message}
              variant="light"
              disabled={loadingCep}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_2fr_1fr]">
            <Input
              label="Número"
              {...register('numero')}
              error={errors.numero?.message}
              variant="light"
            />
            <Input
              label="Bairro"
              {...register('bairro')}
              error={errors.bairro?.message}
              variant="light"
              disabled={loadingCep}
            />
            <Input
              label="Estado"
              {...register('estado')}
              error={errors.estado?.message}
              variant="light"
              disabled={loadingCep}
              maxLength={2}
            />
          </div>

          <Input
            label="Cidade"
            {...register('cidade')}
            error={errors.cidade?.message}
            variant="light"
            disabled={loadingCep}
          />
        </fieldset>

        {loadingCep && <p className="text-sm text-gray-500">Buscando CEP...</p>}
        {addressWarning && !loadingCep && (
          <p className="text-orange-500">Digite seu CEP para alterar o endereço.</p>
        )}

        <input type="hidden" {...register('role')} value={profile?.role} />

        <div className="pt-4 flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onClose} className="font-bold">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="brand"
            loading={isSubmitting}
            className="font-bold text-white"
          >
            Salvar
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default EditProfileModal;