import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { Dialog } from './ui/Dialog';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { maskCEP, maskCPF, maskDate, maskPhone } from '../utils/masks';
import { toast } from 'react-toastify';

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
  const [addressWarning, setAddressWarning] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  const cep = watch('cep');

  useEffect(() => {
    if (cep?.length === 9) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.erro) {
            setValue('rua', data.logradouro);
            setValue('bairro', data.bairro);
            setValue('cidade', data.localidade);
            setValue('estado', data.uf);
          }
        });
    }
  }, [cep, setValue]);

  const parseAddress = (address: string) => {
    const parts = address.split(',').map((part) => part.trim());
    if (parts.length >= 4) {
      const [rua, numero, bairro, cidade, estado] = parts;
      return { rua, numero, bairro, cidade, estado };
    }
    return null;
  };

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
    const endereco = `${rua}, ${numero}, ${bairro}, ${cidade}, ${estado}`;

    try {
      const response = await api.put(`/cadastro/updatecadastro/${userId}`, {
        ...rest,
        endereco,
      });

      if (response.status === 200) {
        toast.success('Perfil atualizado com sucesso!');
        if (profile) {
          const updatedUser = { ...profile, ...response.data };
          updateProfile(updatedUser);
        }
        onClose();
      }
    } catch (error) {
      toast.error('Erro ao atualizar o perfil. Tente novamente.');
      console.error(error);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-brand-navy">Editar Perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className='flex justify-between items-center bg-gray-100 p-3 rounded-lg'>
            <p className="text-sm font-medium text-gray-600">Sua conta:</p>
            <span className="text-sm font-bold text-brand-navy bg-blue-100 px-4 py-1 rounded-full">{profile?.role}</span>
          </div>
          <fieldset className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome Completo"
                {...register('nome')}
                error={errors.nome?.message}
                variant="light"
              />
              <Input
                label="CPF"
                {...register('cpf')}
                error={errors.cpf?.message}
                onChange={(e) => {
                  const { value } = e.target;
                  e.target.value = maskCPF(value);
                }}
                variant="light"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Data de Nascimento"
                {...register('dataNascimento')}
                error={errors.dataNascimento?.message}
                onChange={(e) => {
                  const { value } = e.target;
                  e.target.value = maskDate(value);
                }}
                variant="light"
              />
              <Input
                label="Contato"
                {...register('contato')}
                error={errors.contato?.message}
                onChange={(e) => {
                  const { value } = e.target;
                  e.target.value = maskPhone(value);
                }}
                variant="light"
              />
            </div>
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_2fr]">
              <Input
                label="CEP"
                {...register('cep')}
                error={errors.cep?.message}
                onChange={(e) => {
                  const { value } = e.target;
                  e.target.value = maskCEP(value);
                }}
                variant="light"
              />
              <Input
                label="Rua"
                {...register('rua')}
                error={errors.rua?.message}
                variant="light"
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
              />
              <Input
                label="Estado"
                {...register('estado')}
                error={errors.estado?.message}
                variant="light"
              />
            </div>
            <Input
              label="Cidade"
              {...register('cidade')}
              error={errors.cidade?.message}
              variant="light"
            />
          </fieldset>

          {addressWarning && <p className="text-orange-500">Digite seu CEP para alterar o endereço.</p>}

          <input type="hidden" {...register('role')} value={profile?.role} />
          <div className="pt-4 flex justify-end space-x-4">
            <Button
              type="button"
              variant="primary"
              onClick={onClose}
              className="font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="brand"
              className="font-bold text-white"
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};

export default EditProfileModal;
