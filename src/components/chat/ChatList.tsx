import { useChat } from '../../context/ChatContext.ts'
import { t } from '../../i18n/index.ts'
import { ChatListItem } from './ChatListItem.tsx'

export const ChatList = ({ onOpen }: { onOpen: () => void }) => {
  const { state, selectChat } = useChat()

  const openChat = (chatId: string) => {
    selectChat(chatId)
    onOpen()
  }

  if (state.chats.length === 0) {
    return <p className="px-4 py-6 text-sm text-tg-muted">{t('chat.empty')}</p>
  }

  return (
    <ul className="min-h-0 flex-1 overflow-y-auto">
      {state.chats.map((chat) => (
        <ChatListItem
          key={chat.chatId}
          chat={chat}
          active={chat.chatId === state.activeChatId}
          onSelect={openChat}
        />
      ))}
    </ul>
  )
}
