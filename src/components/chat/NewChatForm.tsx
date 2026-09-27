import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useChat } from '../../context/ChatContext.ts'
import { t } from '../../i18n/index.ts'

export const NewChatForm = () => {
  const { state, openChat } = useChat()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    const result = await openChat(phone)

    if (result.ok) {
      setPhone('')
      setError(null)
      return
    }

    setError(result.error)
  }

  return (
    <form onSubmit={onSubmit} className="border-b border-tg-line px-3 py-3">
      <label
        className="mb-2 block text-xs font-medium uppercase tracking-wide text-tg-muted"
        htmlFor="phone"
      >
        {t('newChat.label')}
      </label>
      <div className="flex gap-2">
        <input
          id="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t('newChat.placeholder')}
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value)

            if (error) {
              setError(null)
            }
          }}
          className="min-w-0 flex-1 rounded-xl bg-[#f4f4f5] px-3 py-2 text-sm outline-none ring-tg-accent placeholder:text-[#9aa0a6] focus:ring-2"
        />
        <button
          type="submit"
          disabled={state.openingChat}
          className="rounded-xl bg-tg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {state.openingChat ? t('newChat.searching') : t('newChat.create')}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
