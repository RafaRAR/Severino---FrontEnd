declare module 'react-input-mask' {
  import type { ComponentType, InputHTMLAttributes } from 'react'

  export interface InputMaskProps extends InputHTMLAttributes<HTMLInputElement> {
    mask: string | (RegExp | string)[]
    maskChar?: string
    alwaysShowMask?: boolean
  }

  const InputMask: ComponentType<InputMaskProps>
  export default InputMask
}
