import type { Chat, ChatMessage, InboxStatus, Session, State } from './types.ts'

export type Action =
  | { type: 'sessionSaved'; session: Session }
  | { type: 'sessionCleared' }
  | { type: 'chatOpenStarted' }
  | { type: 'chatOpenFinished' }
  | { type: 'chatOpened'; chat: Chat }
  | { type: 'chatSelected'; chatId: string }
  | { type: 'sendStarted'; message: ChatMessage }
  | { type: 'sendRetried'; localId: string }
  | { type: 'sendSucceeded'; localId: string; idMessage: string }
  | { type: 'sendFailed'; localId: string; error: string }
  | {
      type: 'incomingReceived'
      chatId: string
      title: string
      phone: string
      message: ChatMessage
    }
  | { type: 'connectionChanged'; error: string | null }
  | { type: 'noticeSet'; notice: string | null }
  | { type: 'inboxChanged'; inbox: InboxStatus }
  | { type: 'inboxEnableStarted' }
  | { type: 'inboxEnabled'; notice: string }
  | { type: 'settingsRetry' }
  | { type: 'storageResult'; error: string | null }

export const emptyState: State = {
  session: null,
  chats: [],
  activeChatId: null,
  connectionError: null,
  notice: null,
  openingChat: false,
  inbox: { kind: 'idle' },
  enablingInbox: false,
  settingsNonce: 0,
  storageError: null,
}

const touchChat = (chats: Chat[], chatId: string, update: (chat: Chat) => Chat) => {
  const current = chats.find((chat) => chat.chatId === chatId)
  if (!current) {
    return chats
  }
  return [update(current), ...chats.filter((chat) => chat.chatId !== chatId)]
}

const updateMessage = (
  chats: Chat[],
  localId: string,
  update: (message: ChatMessage) => ChatMessage,
) => {
  return chats.map((chat) => ({
    ...chat,
    messages: chat.messages.map((message) =>
      message.localId === localId ? update(message) : message,
    ),
  }))
}

const preferTitle = (current: string, phone: string, incoming: string) => {
  if (!incoming) {
    return current
  }

  if (!current || current === phone) {
    return incoming
  }
  return current
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'sessionSaved':
      return { ...emptyState, session: action.session, inbox: { kind: 'checking' } }
    case 'sessionCleared':
      return emptyState
    case 'chatOpenStarted':
      return { ...state, openingChat: true }
    case 'chatOpenFinished':
      return { ...state, openingChat: false }
    case 'chatOpened': {
      const existing = state.chats.find((chat) => chat.chatId === action.chat.chatId)
      const chats = existing
        ? state.chats.map((chat) =>
            chat.chatId === action.chat.chatId
              ? { ...chat, title: action.chat.title, phone: action.chat.phone }
              : chat,
          )
        : [action.chat, ...state.chats]
      return {
        ...state,
        chats,
        activeChatId: action.chat.chatId,
        openingChat: false,
      }
    }
    case 'chatSelected':
      return { ...state, activeChatId: action.chatId }
    case 'sendStarted':
      return {
        ...state,
        chats: touchChat(state.chats, action.message.chatId, (chat) => ({
          ...chat,
          messages: [...chat.messages, action.message],
        })),
      }
    case 'sendRetried':
      return {
        ...state,
        chats: updateMessage(state.chats, action.localId, (message) => ({
          ...message,
          status: 'sending',
          error: undefined,
        })),
      }
    case 'sendSucceeded':
      return {
        ...state,
        chats: updateMessage(state.chats, action.localId, (message) => ({
          ...message,
          id: action.idMessage,
          status: 'sent',
          error: undefined,
        })),
      }
    case 'sendFailed':
      return {
        ...state,
        chats: updateMessage(state.chats, action.localId, (message) => ({
          ...message,
          status: 'failed',
          error: action.error,
        })),
      }
    case 'incomingReceived': {
      const existing = state.chats.find((chat) => chat.chatId === action.chatId)
      if (existing?.messages.some((message) => message.id === action.message.id)) {
        return state
      }
      const chat: Chat = existing
        ? {
            ...existing,
            title: preferTitle(existing.title, existing.phone, action.title),
            phone: existing.phone || action.phone,
            messages: [...existing.messages, action.message],
          }
        : {
            chatId: action.chatId,
            title: action.title,
            phone: action.phone,
            messages: [action.message],
          }
      const rest = state.chats.filter((item) => item.chatId !== action.chatId)
      return { ...state, chats: [chat, ...rest], notice: null }
    }
    case 'connectionChanged':
      return state.connectionError === action.error
        ? state
        : { ...state, connectionError: action.error }
    case 'noticeSet':
      return state.notice === action.notice ? state : { ...state, notice: action.notice }
    case 'inboxChanged':
      return { ...state, inbox: action.inbox, enablingInbox: false }
    case 'inboxEnableStarted':
      return state.enablingInbox ? state : { ...state, enablingInbox: true }
    case 'inboxEnabled':
      return {
        ...state,
        inbox: { kind: 'polling' },
        enablingInbox: false,
        notice: action.notice,
      }
    case 'settingsRetry':
      return {
        ...state,
        inbox: { kind: 'checking' },
        enablingInbox: false,
        settingsNonce: state.settingsNonce + 1,
      }
    case 'storageResult':
      return state.storageError === action.error ? state : { ...state, storageError: action.error }
    default:
      return state
  }
}
