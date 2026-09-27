import type { ReactNode } from 'react'

export const AuthField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  autoFocus,
  trailing,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: 'text' | 'password'
  inputMode?: 'numeric' | 'text'
  autoFocus?: boolean
  trailing?: ReactNode
}) => {
  return (
    <label className="mb-4 block" htmlFor={id}>
      <span className="mb-1.5 block text-sm font-medium text-[#17212b]">{label}</span>
      <span className="flex items-center gap-2 rounded-xl bg-[#f4f4f5] px-3 ring-tg-accent focus-within:ring-2">
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          type={type}
          inputMode={inputMode}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-[#9aa0a6]"
        />
        {trailing}
      </span>
    </label>
  )
}
