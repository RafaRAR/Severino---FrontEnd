import { useState, useCallback, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
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
  endereco: z.string().min(1, 'Informe o endereço'),
  role: z.enum(['Cliente', 'Prestador']).refine(
    (val) => val !== undefined,
    { message: 'Selecione um tipo de perfil.' }
  )
})

type ProfileFormData = z.infer<typeof profileSchema>

interface CompleteProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CompleteProfileModal({ isOpen, onClose }: CompleteProfileModalProps) {
  const { user, updateUser } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loadingCep, setLoadingCep] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      dataNascimento: '',
      contato: '',
      cep: '',
      endereco: '',
      role: undefined,
    },
  })

  useEffect(() => {
    if (user?.name) {
      setValue('nome', user.name)
    }
  }, [user, setValue])

  const cepValue = watch('cep')
  const handleCepBlur = useCallback(async () => {
    const cep = stripDigits(cepValue)
    if (cep.length !== 8) return

    setLoadingCep(true)
    clearErrors('cep')
    try {
      const data = await fetchCep(cep)
      if (data.localidade && data.uf) {
        setValue(
          'endereco',
          `${data.bairro ? data.bairro + ', ' : ''}${data.localidade}, ${data.uf}`,
        )
      }
    } catch (e) {
      setError('cep', { message: e instanceof Error ? e.message : 'CEP não encontrado' })
    } finally {
      setLoadingCep(false)
    }
  }, [cepValue, setValue, setError, clearErrors])

  async function onSubmit(data: ProfileFormData) {
    if (!user?.id) {
      setSubmitError('Usuário não autenticado. Por favor, faça o login novamente.')
      return
    }
    setSubmitError(null)

    const payload: CadastroPayload = {
      ...data,
      cpf: stripDigits(data.cpf),
      contato: stripDigits(data.contato),
      cep: stripDigits(data.cep),
      usuarioId: parseInt(user.id, 10),
    }

    try {
      await cadastrar(user.id, payload as CadastroPayload)
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
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="rounded-xl bg-white p-6 shadow-lg max-w-lg w-full">
        <h2 className="mb-2 text-xl font-bold text-gray-800">Completar Perfil</h2>
        <p className="mb-6 text-sm text-gray-600">
          Precisamos de mais algumas informações para continuar.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" {...register('nome')} error={errors.nome?.message} disabled />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                />
              )}
            />
            <Input
              label="Data de Nascimento"
              type="date"
              {...register('dataNascimento')}
              error={errors.dataNascimento?.message}
            />
          </div>

          <Controller
            name="contato"
            control={control}
            render={({ field }) => (
              <Input
                label="Contato (Celular)"
                placeholder="(11) 99999-9999"
                {...field}
                onChange={(e) => field.onChange(maskPhone(e.target.value))}
                error={errors.contato?.message}
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
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
                />
              )}
            />
            {loadingCep && <p className="text-xs text-gray-500">Buscando CEP...</p>}
          </div>

          <Input
            label="Endereço"
            {...register('endereco')}
            error={errors.endereco?.message}
            placeholder="Ex: Rua, Bairro, Cidade, Estado"
          />

          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                label="Eu sou"
                options={[
                  { value: 'Cliente', label: 'Cliente' },
                  { value: 'Prestador', label: 'Prestador de Serviço' },
                ]}
                {...field}
                error={errors.role?.message}
              />
            )}
          />

          {submitError && <p className="text-sm text-red-500">{submitError}</p>}

          <div className="pt-4">
            <Button type="submit" loading={isSubmitting} className="w-full bg-brand-orange">
              Salvar e Continuar
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
