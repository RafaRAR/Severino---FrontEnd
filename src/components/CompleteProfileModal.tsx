import { useState, useCallback, useEffect,  useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User } from 'lucide-react'
import { BaseModal } from './ui/BaseModal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { cadastrar, fetchCep } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { maskCPF, maskCEP, maskPhone } from '../utils/masks'

function stripDigits(s: string): string {
  return (s || '').replace(/\D/g, '')
}

const profileSchema = z.object({
  nome: z.string().min(1, 'O nome é obrigatório'),
  cpf: z
    .string()
    .min(1, 'Informe o CPF')
    .refine((v) => stripDigits(v).length === 11, 'CPF deve ter 11 dígitos'),
  dataNascimento: z.string().min(1, 'Informe a data de nascimento'),
  contato: z
    .string()
    .min(1, 'Informe o contato')
    .refine(
      (v) => stripDigits(v).length === 11 || stripDigits(v).length === 10,
      'Contato deve ter 10 ou 11 dígitos',
    ),
  cep: z
    .string()
    .min(1, 'Informe o CEP')
    .refine((v) => stripDigits(v).length === 8, 'CEP deve ter 8 dígitos'),
  rua: z.string().min(1, 'Informe a rua'),
  numero: z.string().min(1, 'Informe o número'),
  bairro: z.string().min(1, 'Informe o bairro'),
  cidade: z.string().min(1, 'Informe a cidade'),
  estado: z.string().length(2, 'UF deve ter 2 letras'),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface CompleteProfileModalProps {
  isOpen: boolean
  onClose: () => void
}


export function CompleteProfileModal({ isOpen, onClose }: CompleteProfileModalProps) {
  const { user, updateProfile } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loadingCep, setLoadingCep] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome: user?.name || '',
      cpf: '',
      dataNascimento: '',
      contato: '',
      cep: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
    },
  })

  useEffect(() => {
    if (user?.name) {
      setValue('nome', user.name)
    }
  }, [user, setValue])

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

  const cepValue = watch('cep')
  const handleCepBlur = useCallback(async () => {
    const cep = stripDigits(cepValue)
    if (cep.length !== 8) return

    setLoadingCep(true)
    clearErrors('cep')
    try {
      const data = await fetchCep(cep)
      if (data.localidade && data.uf) {
        setValue('rua', data.logradouro || '')
        setValue('bairro', data.bairro || '')
        setValue('cidade', data.localidade)
        setValue('estado', data.uf)
        setFocus('numero')
      }
    } catch (e) {
      setError('cep', { message: 'CEP inválido ou não encontrado' })
    } finally {
      setLoadingCep(false)
    }
  }, [cepValue, setValue, setError, clearErrors, setFocus])

  async function onSubmit(data: ProfileFormData) {
    if (!user?.id) {
      setSubmitError('Usuário não autenticado. Por favor, faça o login novamente.')
      return
    }
    setSubmitError(null)

    const formData = new FormData();
    const enderecoCompleto = `${data.rua}, ${data.numero} - ${data.bairro}, ${data.cidade} - ${data.estado.toUpperCase()}`;

    formData.append('nome', data.nome);
    formData.append('cpf', stripDigits(data.cpf));
    formData.append('dataNascimento', data.dataNascimento);
    formData.append('contato', stripDigits(data.contato));
    formData.append('cep', stripDigits(data.cep));
    formData.append('endereco', enderecoCompleto);
    
    if (imageFile) {
        formData.append('Imagem', imageFile);
    }

    try {
      await cadastrar(user.id, formData);
      
      const { rua, numero, bairro, cidade, estado, ...restOfData } = data;
      const profileForUpdate = {
        ...restOfData,
        endereco: enderecoCompleto,
        cpf: stripDigits(data.cpf),
        contato: stripDigits(data.contato),
        cep: stripDigits(data.cep),
        usuarioId: parseInt(user.id, 10),
      };

      if (user) {
        updateProfile(profileForUpdate);
      }
      reset();
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Não foi possível completar o perfil.');
    }
  }


  return (
    <BaseModal title="Complete seu Perfil" isOpen={isOpen} isBlocking>
        <p className="mb-6 text-center text-gray-500 -mt-4">
          Preencha seus dados para podermos começar.
        </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
                <div
                    className="h-28 w-28 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-transparent group-hover:border-brand-orange transition-all"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="Avatar Preview" className="h-full w-full object-cover" />
                    ) : (
                        <User size={48} className="text-gray-500" />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-semibold">Alterar</p>
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
            <p className="text-sm text-gray-500 -mt-2">Foto de Perfil (Opcional)</p>
        </div>
        
        <fieldset disabled={isSubmitting} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  placeholder="000.000.000-00"
                  {...field}
                  onChange={(e) => field.onChange(maskCPF(e.target.value))}
                  error={errors.cpf?.message}
                  variant="light"
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Data de Nascimento"
              type="date"
              {...register('dataNascimento')}
              error={errors.dataNascimento?.message}
              variant="light"
            />
            <Controller
              name="contato"
              control={control}
              render={({ field }) => (
                <Input
                  label="Celular com DDD"
                  placeholder="(11) 99999-9999"
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
                  placeholder="00000-000"
                  {...field}
                  onBlur={handleCepBlur}
                  onChange={(e) => field.onChange(maskCEP(e.target.value))}
                  error={errors.cep?.message}
                  variant="light"
                />
              )}
            />
            <Input
              label="Rua / Logradouro"
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
              label="UF"
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

          {loadingCep && <p className="mt-2 text-sm text-gray-500">Buscando CEP...</p>}
        </fieldset>

        {submitError && <p className="text-sm text-red-500">{submitError}</p>}

        <div className="pt-4">
          <Button
            type="submit"
            variant="brand"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full font-bold text-white hover:bg-orange-600"
          >
            Salvar e Continuar
          </Button>
        </div>
      </form>
    </BaseModal>
  )
}
