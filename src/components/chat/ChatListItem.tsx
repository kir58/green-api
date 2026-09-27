import { formatMessageTime, lastPreview } from '../../model/format.ts'
import type { Chat } from '../../model/types.ts'
import { Avatar } from './Avatar.tsx'

export const ChatListItem = ({
  chat,
  active,
  onSelect,
}: {
  chat: Chat
  active: boolean
  onSelect: (chatId: string) => void
}) => {
  const last = chat.messages.at(-1)

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(chat.chatId)}
        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left ${
          active ? 'bg-tg-accent text-white' : 'hover:bg-[#f4f4f5]'
        }`}
      >
        <Avatar id={chat.chatId} title={chat.title} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="truncate font-medium">{chat.title}</span>
            {last ? (
              <span className={`shrink-0 text-xs ${active ? 'text-white/80' : 'text-tg-muted'}`}>
                {formatMessageTime(last.timestamp)}
              </span>
            ) : null}
          </span>
          <span
            className={`mt-0.5 block truncate text-sm ${active ? 'text-white/80' : 'text-tg-muted'}`}
          >
            {lastPreview(chat)}
          </span>
        </span>
      </button>
    </li>
  )
}
