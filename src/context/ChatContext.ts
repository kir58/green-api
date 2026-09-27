import { createContext, useContext } from 'react'
import type { Session, State } from '../model/types.ts'

export type OpenChatResult = { ok: true } | { ok: false; error: string }

export type ChatContextValue = {
  state: State
  login: (session: Session) => Promise<OpenChatResult>
  logout: () => void
  retryInbox: () => void
  enableInbox: () => Promise<void>
  openChat: (phone: string) => Promise<OpenChatResult>
  selectChat: (chatId: string) => void
  sendMessage: (text: string) => Promise<void>
  retryMessage: (localId: string) => Promise<void>
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export const normalizeSession = (input: Session): Session => {
  let apiUrl = input.apiUrl.trim().replace(/\/+$/, '')

  if (!/^https?:\/\//i.test(apiUrl)) {
    apiUrl = `https://${apiUrl}`
  }

  return {
    apiUrl,
    idInstance: input.idInstance.trim(),
    apiTokenInstance: input.apiTokenInstance.trim(),
  }
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat должен использоваться внутри ChatProvider')
  }
  return context
}
