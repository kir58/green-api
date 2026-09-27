import type { Chat, ChatMessage, MessageStatus, Session } from './types.ts'
import { t } from '../i18n/index.ts'

const STORAGE_KEY = 'green-api-telegram'

export type Persisted = {
  session: Session | null
  chats: Chat[]
  activeChatId: string | null
}

const isSession = (value: unknown): value is Session => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const session = value as Session
  return (
    typeof session.apiUrl === 'string' &&
    typeof session.idInstance === 'string' &&
    typeof session.apiTokenInstance === 'string'
  )
}

const isMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const message = value as ChatMessage
  const statuses: MessageStatus[] = ['sending', 'sent', 'failed']
  return (
    typeof message.localId === 'string' &&
    typeof message.id === 'string' &&
    typeof message.chatId === 'string' &&
    typeof message.text === 'string' &&
    (message.direction === 'in' || message.direction === 'out') &&
    typeof message.timestamp === 'number' &&
    statuses.includes(message.status)
  )
}

const reviveChats = (value: unknown): Chat[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') {
      return []
    }
    const chat = item as Chat
    if (typeof chat.chatId !== 'string' || typeof chat.title !== 'string') {
      return []
    }
    const messages = Array.isArray(chat.messages) ? chat.messages.filter(isMessage) : []
    return [
      {
        chatId: chat.chatId,
        phone: typeof chat.phone === 'string' ? chat.phone : '',
        title: chat.title,
        messages: messages.map((message) =>
          message.status === 'sending'
            ? { ...message, status: 'failed' as const, error: t('message.interrupted') }
            : message,
        ),
      },
    ]
  })
}

export const loadPersisted = (): Persisted | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    const record = parsed as Partial<Persisted>
    const session = isSession(record.session) ? record.session : null
    if (!session) {
      return null
    }
    return {
      session,
      chats: reviveChats(record.chats),
      activeChatId: typeof record.activeChatId === 'string' ? record.activeChatId : null,
    }
  } catch {
    return null
  }
}

export const savePersisted = (state: Persisted) => {
  try {
    if (!state.session) {
      sessionStorage.removeItem(STORAGE_KEY)
      return true
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
