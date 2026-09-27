import { useChat } from '../../context/ChatContext.ts'
import { t } from '../../i18n/index.ts'
import { ChatList } from './ChatList.tsx'
import { NewChatForm } from './NewChatForm.tsx'

export const ChatSidebar = ({ hidden, onOpen }: { hidden: boolean; onOpen: () => void }) => {
  const { logout } = useChat()

  return (
    <aside
      className={`${hidden ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-tg-line`}
    >
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-semibold text-[#17212b]">{t('chat.title')}</h1>
        <button type="button" onClick={logout} className="text-sm font-medium text-tg-accent">
          {t('chat.logout')}
        </button>
      </header>
      <NewChatForm />
      <ChatList onOpen={onOpen} />
    </aside>
  )
}
