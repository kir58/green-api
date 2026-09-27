import { useRef, useState } from 'react'
import type { KeyboardEvent, SubmitEvent } from 'react'
import { useChat } from '../../context/ChatContext.ts'
import { t } from '../../i18n/index.ts'
import { SendIcon } from '../icons/SendIcon.tsx'

export const Composer = () => {
  const { sendMessage } = useChat()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const sendingRef = useRef(false)

  const submit = async () => {
    if (sendingRef.current) {
      return
    }

    const trimmed = text.trim()

    if (!trimmed) {
      return
    }

    if (trimmed.length > 4096) {
      setError(t('composer.tooLong'))
      return
    }

    sendingRef.current = true
    setError(null)
    setText('')
    try {
      await sendMessage(trimmed)
    } finally {
      sendingRef.current = false
    }
  }

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    void submit()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <form onSubmit={onSubmit} className="border-t border-black/5 bg-[#f0f2f5] px-3 py-3 md:px-6">
      {error ? (
        <p className="mx-auto mb-2 w-full max-w-3xl text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <textarea
          rows={1}
          value={text}
          autoFocus
          placeholder={t('composer.placeholder')}
          onChange={(event) => {
            setText(event.target.value)

            if (error) {
              setError(null)
            }
          }}
          onKeyDown={onKeyDown}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-white px-4 py-2.5 text-[15px] outline-none ring-tg-accent placeholder:text-[#9aa0a6] focus:ring-2"
        />
        <button
          type="submit"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-tg-accent text-white disabled:opacity-50"
          disabled={!text.trim()}
          aria-label={t('composer.send')}
        >
          <SendIcon className="size-6" />
        </button>
      </div>
    </form>
  )
}
