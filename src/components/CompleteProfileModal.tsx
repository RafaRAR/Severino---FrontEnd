import { useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Wrench } from 'lucide-react'
import { Dialog } from './ui/Dialog'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { MaskedInput, CPF_MASK, CELULAR_MASK, CEP_MASK } from './ui/MaskedInput'
import { ForwardedSelect, CATEGORIAS_PRESTADOR } from './ui/Select'
import { fetchCep, completarPerfil, type CompletarPerfilPayload } from '../services/api'
import type { AuthUser } from '../services/api'

function stripDigits(s: string): string {
  return s.replace(/\D/g, '')
}

const baseSchema = z.object({
  cpf: z
    .string()
    .min(1, 'Informe o CPF')
    .refine((v) => stripDigits(v).length === 11, 'CPF deve ter 11 dígitos'),
  celular: z
    .string()
    .min(1, 'Informe o celular')
    .refine((v) => stripDigits(v).length === 13, 'Celular deve ter DDD + 9 dígitos'),
  cep: z
    .string()
    .min(1, 'Informe o CEP')
    .refine((v) => stripDigits(v).length === 8, 'CEP deve ter 8 dígitos'),
  cidade: z.string().min(1, 'Preencha o CEP para buscar cidade'),
  bairro: z.string().min(1, 'Preencha o CEP para buscar bairro'),
  estado: z.string().min(1, 'Preencha o CEP para buscar estado'),
  numero: z.string().min(1, 'Informe o número'),
  complemento: z.string().optional(),
})

const clienteSchema = baseSchema

const prestadorSchema = baseSchema.extend({
  categoria: z.string().min(1, 'Selecione uma categoria'),
})

type ClienteFormData = z.infer<typeof clienteSchema>
type PrestadorFormData = z.infer<typeof prestadorSchema>
type FormData = ClienteFormData | PrestadorFormData

interface CompleteProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (user: AuthUser) => void
}

export function CompleteProfileModal({
  isOpen,
  onClose,
  onComplete,
}: CompleteProfileModalProps) {
  const [tipoPerfil, setTipoPerfil] = useState<'cliente' | 'prestador'>('cliente')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loadingCep, setLoadingCep] = useState(false)

  const schema = tipoPerfil === 'prestador' ? prestadorSchema : clienteSchema

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      cpf: '',
      celular: '',
      cep: '',
      cidade: '',
      bairro: '',
      estado: '',
      numero: '',
      complemento: '',
      categoria: '',
    },
  })

  const cepValue = watch('cep')

  const handleCepBlur = useCallback(async () => {
    const cep = cepValue ? stripDigits(String(cepValue)) : ''
    if (cep.length !== 8) return

    setLoadingCep(true)
    clearErrors(['cep', 'cidade', 'bairro', 'estado'])
    try {
      const data = await fetchCep(cep)
      setValue('cidade', data.localidade ?? '')
      setValue('bairro', data.bairro ?? '')
      setValue('estado', data.uf ?? '')
    } catch (e) {
      setError('cep', { message: e instanceof Error ? e.message : 'CEP não encontrado' })
      setValue('cidade', '')
      setValue('bairro', '')
      setValue('estado', '')
    } finally {
      setLoadingCep(false)
    }
  }, [cepValue, setValue, setError, clearErrors])

  async function onSubmit(data: FormData) {
    setSubmitError(null)
    const payload: CompletarPerfilPayload = {
      tipoPerfil,
      cpf: stripDigits(data.cpf),
      celular: stripDigits(data.celular),
      cep: stripDigits(data.cep),
      cidade: data.cidade,
      bairro: data.bairro,
      estado: data.estado,
      numero: data.numero,
      complemento: data.complemento,
    }
    if (tipoPerfil === 'prestador' && 'categoria' in data && data.categoria) {
      payload.categoria = data.categoria
    }
    try {
      const user = await completarPerfil(payload)
      onComplete(user)
      reset()
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Não foi possível completar o perfil.')
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="rounded-xl bg-brand-ice p-6 shadow-md">
        <h2 className="mb-2 text-xl font-bold text-brand-navy">Completar Perfil</h2>
        <p className="mb-6 text-sm text-brand-navy/80">
          Preencha seus dados para continuar usando o Severino.
        </p>

        <div className="mb-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              setTipoPerfil('cliente')
              reset()
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 shadow-md transition ${
              tipoPerfil === 'cliente'
                ? 'border-brand-orange bg-brand-orange/10 text-brand-navy'
                : 'border-gray-200 bg-white text-brand-navy/70 hover:border-brand-orange/50'
            }`}
          >
            <User className="size-5" />
            <span className="font-medium">Cliente</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTipoPerfil('prestador')
              reset()
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 shadow-md transition ${
              tipoPerfil === 'prestador'
                ? 'border-brand-orange bg-brand-orange/10 text-brand-navy'
                : 'border-gray-200 bg-white text-brand-navy/70 hover:border-brand-orange/50'
            }`}
          >
            <Wrench className="size-5" />
            <span className="font-medium">Prestador</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {submitError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-600">
              {submitError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="cpf"
              render={({ field }) => (
                <MaskedInput
                  label="CPF"
                  mask={CPF_MASK}
                  placeholder="000.000.000-00"
                  {...field}
                  error={errors.cpf?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="celular"
              render={({ field }) => (
                <MaskedInput
                  label="Celular"
                  mask={CELULAR_MASK}
                  placeholder="+55 (11) 99999-9999"
                  {...field}
                  error={errors.celular?.message}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="cep"
            render={({ field }) => (
              <MaskedInput
                label="CEP"
                mask={CEP_MASK}
                placeholder="00000-000"
                {...field}
                onBlur={() => {
                  field.onBlur()
                  handleCepBlur()
                }}
                error={errors.cep?.message}
              />
            )}
          />
          {loadingCep && (
            <p className="text-xs text-brand-navy/60">Buscando endereço...</p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Cidade"
              readOnly
              variant="light"
              className="cursor-not-allowed bg-gray-100"
              {...register('cidade')}
              error={errors.cidade?.message}
            />
            <Input
              label="Bairro"
              readOnly
              variant="light"
              className="cursor-not-allowed bg-gray-100"
              {...register('bairro')}
              error={errors.bairro?.message}
            />
            <Input
              label="Estado"
              readOnly
              variant="light"
              className="cursor-not-allowed bg-gray-100"
              {...register('estado')}
              error={errors.estado?.message}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Número"
              variant="light"
              placeholder="Ex: 123"
              {...register('numero')}
              error={errors.numero?.message}
            />
            <Input
              label="Complemento"
              variant="light"
              placeholder="Apto, sala..."
              {...register('complemento')}
              error={errors.complemento?.message}
            />
          </div>

          {tipoPerfil === 'prestador' && (
            <Controller
              control={control}
              name="categoria"
              render={({ field }) => (
                <ForwardedSelect
                  label="Categoria"
                  options={[...CATEGORIAS_PRESTADOR]}
                  {...field}
                  error={'categoria' in errors ? errors.categoria?.message : undefined}
                />
              )}
            />
          )}

          <Button type="submit" variant="brand" loading={isSubmitting} className="w-full">
            Completar Perfil
          </Button>
        </form>
      </div>
    </Dialog>
  )
}
