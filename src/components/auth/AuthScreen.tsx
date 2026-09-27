import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { normalizeSession, useChat } from '../../context/ChatContext.ts'
import { t } from '../../i18n/index.ts'
import { PaperPlaneIcon } from '../icons/PaperPlaneIcon.tsx'
import { AuthField } from './AuthField.tsx'

export const AuthScreen = () => {
  const { login } = useChat()
  const [apiUrl, setApiUrl] = useState('')
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault()

    if (pending) {
      return
    }

    const session = normalizeSession({ apiUrl, idInstance, apiTokenInstance })

    if (!session.apiUrl || session.apiUrl === 'https://') {
      setError(t('auth.apiUrlRequired'))
      return
    }

    if (!/^https:\/\/(?:[a-z0-9-]+\.)*green-api\.com$/i.test(session.apiUrl)) {
      setError(t('auth.apiUrlHost'))
      return
    }

    if (!/^\d+$/.test(session.idInstance)) {
      setError(t('auth.idInstanceDigits'))
      return
    }

    if (!session.apiTokenInstance) {
      setError(t('auth.tokenRequired'))
      return
    }

    setError(null)
    setPending(true)
    const result = await login(session)

    if (!result.ok) {
      setPending(false)
      setError(result.error)
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[linear-gradient(160deg,#6fb2e8_0%,#d5e4ef_52%,#eef4f8_100%)] px-4 py-10">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl bg-white px-6 py-8 shadow-[0_20px_60px_rgba(23,33,43,0.16)]"
      >
        <div className="mb-6 flex items-center gap-3">
          <PaperPlaneIcon className="size-10" />
          <div>
            <h1 className="text-2xl font-semibold text-[#17212b]">{t('app.title')}</h1>
            <p className="text-sm text-tg-muted">{t('auth.subtitle')}</p>
          </div>
        </div>

        <AuthField
          id="apiUrl"
          label={t('auth.apiUrl')}
          value={apiUrl}
          placeholder={t('auth.apiUrlPlaceholder')}
          onChange={setApiUrl}
          autoFocus
        />
        <AuthField
          id="idInstance"
          label={t('auth.idInstance')}
          value={idInstance}
          placeholder={t('auth.idInstancePlaceholder')}
          inputMode="numeric"
          onChange={setIdInstance}
        />
        <AuthField
          id="apiTokenInstance"
          label={t('auth.apiTokenInstance')}
          value={apiTokenInstance}
          placeholder={t('auth.tokenPlaceholder')}
          type={showToken ? 'text' : 'password'}
          onChange={setApiTokenInstance}
          trailing={
            <button
              type="button"
              className="text-sm font-medium text-tg-accent"
              onClick={() => setShowToken((current) => !current)}
            >
              {showToken ? t('auth.hideToken') : t('auth.showToken')}
            </button>
          }
        />

        {error ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-xl bg-tg-accent text-sm font-semibold text-white transition hover:bg-[#2b82d6] disabled:opacity-50"
        >
          {pending ? t('auth.checking') : t('auth.submit')}
        </button>
      </form>
    </main>
  )
}
