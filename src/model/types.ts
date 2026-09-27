export type Session = {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type MessageStatus = 'sending' | 'sent' | 'failed'
export type MessageDirection = 'in' | 'out'

export type ChatMessage = {
  localId: string
  id: string
  chatId: string
  text: string
  direction: MessageDirection
  timestamp: number
  status: MessageStatus
  error?: string
}

export type Chat = {
  chatId: string
  phone: string
  title: string
  messages: ChatMessage[]
}

export type IncomingMode =
  { kind: 'polling' } | { kind: 'webhook'; webhookUrl: string } | { kind: 'disabled' }

export type InboxStatus =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | IncomingMode
  | { kind: 'error'; message: string; phase: 'read' | 'enable' }

export type State = {
  session: Session | null
  chats: Chat[]
  activeChatId: string | null
  connectionError: string | null
  notice: string | null
  openingChat: boolean
  inbox: InboxStatus
  enablingInbox: boolean
  settingsNonce: number
  storageError: string | null
}

export type IncomingNotification = {
  receiptId: number
  body?: {
    typeWebhook?: string
    timestamp?: number
    idMessage?: string
    senderData?: {
      chatId?: string | number
      chatName?: string
      senderName?: string
      senderPhoneNumber?: number
    }
    messageData?: {
      typeMessage?: string
      textMessageData?: {
        textMessage?: string
      }
      extendedTextMessageData?: {
        text?: string
      }
    }
  }
}
