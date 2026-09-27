import { useChat } from '../../context/ChatContext.ts'
import { t } from '../../i18n/index.ts'
import { formatMessageTime } from '../../model/format.ts'
import type { ChatMessage } from '../../model/types.ts'

export const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const { retryMessage } = useChat()
  const outgoing = message.direction === 'out'

  return (
    <li className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[min(78%,32rem)] rounded-2xl px-3 py-2 shadow-sm ${
          outgoing ? 'rounded-br-md bg-tg-bubble' : 'rounded-bl-md bg-white'
        }`}
      >
        <p className="text-[15px] leading-5 break-words whitespace-pre-wrap text-[#17212b]">
          {message.text}
        </p>
        <p
          className={`mt-1 text-right text-[11px] ${outgoing ? 'text-[#5f8f4e]' : 'text-tg-muted'}`}
        >
          {message.status === 'sending'
            ? t('message.sending')
            : formatMessageTime(message.timestamp)}
        </p>
        {message.status === 'failed' ? (
          <p className="mt-1 text-xs text-red-600">
            {message.error || t('message.failed')}{' '}
            <button
              type="button"
              className="font-medium underline"
              onClick={() => void retryMessage(message.localId)}
            >
              {t('message.retry')}
            </button>
          </p>
        ) : null}
      </div>
    </li>
  )
}
