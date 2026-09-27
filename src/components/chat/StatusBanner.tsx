import { useChat } from '../../context/ChatContext.ts'
import { t } from '../../i18n/index.ts'

export const StatusBanner = () => {
  const { state, enableInbox, retryInbox } = useChat()
  const { storageError, inbox, notice } = state

  const requestEnable = () => {
    if (inbox.kind === 'webhook') {
      const confirmed = window.confirm(t('inbox.confirmWebhook', { url: inbox.webhookUrl }))
      if (!confirmed) {
        return
      }
    }
    void enableInbox()
  }

  if (storageError) {
    return (
      <p className="bg-[#fff4e5] px-4 py-2 text-center text-sm text-[#8a5a00]" role="status">
        {storageError}
      </p>
    )
  }

  if (state.connectionError) {
    return (
      <p className="bg-[#fff4e5] px-4 py-2 text-center text-sm text-[#8a5a00]" role="status">
        {state.connectionError}
      </p>
    )
  }

  const inboxMessage = {
    idle: null,
    checking: null,
    polling: null,
    disabled: t('inbox.disabled'),
    webhook: inbox.kind === 'webhook' ? t('inbox.webhook', { url: inbox.webhookUrl }) : null,
    error: inbox.kind === 'error' ? inbox.message : null,
  }[inbox.kind]

  if (inboxMessage) {
    const retryRead = inbox.kind === 'error' && inbox.phase === 'read'
    let actionLabel = t('inbox.enable')

    if (retryRead) {
      actionLabel = t('inbox.retry')
    }

    if (state.enablingInbox) {
      actionLabel = t('inbox.enabling')
    }

    return (
      <div
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#e7f3ff] px-4 py-2 text-center text-sm text-[#18598a]"
        role="status"
      >
        <p className="max-w-3xl break-words">{inboxMessage}</p>
        <button
          type="button"
          className="font-medium underline disabled:opacity-60"
          disabled={state.enablingInbox}
          onClick={retryRead ? retryInbox : requestEnable}
        >
          {actionLabel}
        </button>
      </div>
    )
  }

  if (notice) {
    return (
      <p className="bg-[#e7f3ff] px-4 py-2 text-center text-sm text-[#18598a]" role="status">
        {notice}
      </p>
    )
  }

  return null
}
