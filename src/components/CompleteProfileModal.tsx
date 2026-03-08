import { useState, useCallback, useEffect, type ReactNode } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Wrench } from 'lucide-react'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { cadastrar, fetchCep, type CadastroPayload } from '../services/api'
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
  role: z.enum(['Cliente', 'Prestador']),
})

type ProfileFormData = z.infer<typeof profileSchema>
type Role = 'Cliente' | 'Prestador'

interface CompleteProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CompleteProfileModal({ isOpen, onClose }: CompleteProfileModalProps) {
  const { user, updateUser } = useAuth()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loadingCep, setLoadingCep] = useState(false)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    reset,
    trigger,
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

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setValue('role', role, { shouldValidate: true, shouldDirty: true })
    trigger('role');
  }

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

    const { rua, numero, bairro, cidade, estado, ...restOfData } = data
    const enderecoCompleto = `${rua}, ${numero} - ${bairro}, ${cidade} - ${estado.toUpperCase()}`

    const payload: CadastroPayload = {
      ...restOfData,
      endereco: enderecoCompleto,
      cpf: stripDigits(data.cpf),
      contato: stripDigits(data.contato),
      cep: stripDigits(data.cep),
      usuarioId: parseInt(user.id, 10),
    }

    try {
      await cadastrar(user.id, payload)
      if (user) {
        updateUser({ ...user, profileComplete: true })
      }
      reset()
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Não foi possível completar o perfil.')
    }
  }

  return (
    <Dialog isOpen={isOpen} isBlocking>
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="mb-2 text-center text-2xl font-bold text-brand-navy">
          Complete seu Perfil
        </h2>
        <p className="mb-6 text-center text-gray-500">
          Primeiro, nos diga que tipo de conta você precisa.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <RoleCard
                icon={<User className="size-7" />}
                title="Sou Cliente"
                description="Quero contratar profissionais."
                onClick={() => handleRoleSelect('Cliente')}
                selected={selectedRole === 'Cliente'}
              />
              <RoleCard
                icon={<Wrench className="size-7" />}
                title="Sou Prestador"
                description="Quero oferecer meus serviços."
                onClick={() => handleRoleSelect('Prestador')}
                selected={selectedRole === 'Prestador'}
              />
            </div>
            {errors.role && <p className="mt-2 text-xs text-red-500">{errors.role.message}</p>}
          </div>

          <fieldset disabled={!selectedRole || isSubmitting} className="space-y-4 pt-2">
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
              disabled={!selectedRole || isSubmitting}
              className="w-full font-bold text-white hover:bg-orange-600"
            >
              Salvar e Continuar
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}

interface RoleCardProps {
  icon: ReactNode
  title: string
  description: string
  onClick: () => void
  selected: boolean
}

function RoleCard({ icon, title, description, onClick, selected }: RoleCardProps) {
  const baseClasses =
    'group flex h-full flex-col items-start rounded-lg p-4 text-left transition duration-200';
  const selectedClasses = 'border-2 border-brand-orange bg-orange-50';
  const unselectedClasses = 'border border-gray-300 hover:border-gray-400';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${selected ? selectedClasses : unselectedClasses}`}
    >
      <div className="mb-3">{icon}</div>
      <h4 className="mb-1 text-base font-bold text-brand-navy">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  )
}
