import { useChat } from '../../context/ChatContext.ts'
import { t } from '../../i18n/index.ts'
import { formatPhone } from '../../model/format.ts'
import { BackIcon } from '../icons/BackIcon.tsx'
import { Avatar } from './Avatar.tsx'
import { Composer } from './Composer.tsx'
import { EmptyThread } from './EmptyThread.tsx'
import { MessageList } from './MessageList.tsx'

export const ChatThread = ({ hidden, onBack }: { hidden: boolean; onBack: () => void }) => {
  const { state } = useChat()
  const chat = state.chats.find((item) => item.chatId === state.activeChatId) ?? null

  return (
    <section className={`${hidden ? 'hidden md:flex' : 'flex'} min-h-0 flex-col bg-tg-wallpaper`}>
      {chat ? (
        <>
          <header className="flex items-center gap-3 border-b border-black/5 bg-white px-3 py-2.5 md:px-5">
            <button
              type="button"
              className="grid size-9 place-items-center rounded-full text-tg-accent md:hidden"
              onClick={onBack}
              aria-label={t('chat.backToList')}
            >
              <BackIcon className="size-6" />
            </button>
            <Avatar id={chat.chatId} title={chat.title} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#17212b]">{chat.title}</p>
              <p className="truncate text-sm text-tg-muted">
                {chat.phone ? formatPhone(chat.phone) : t('chat.personal')}
              </p>
            </div>
          </header>
          <MessageList messages={chat.messages} />
          <Composer key={chat.chatId} />
        </>
      ) : (
        <EmptyThread />
      )}
    </section>
  )
}
