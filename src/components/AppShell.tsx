import { useChat } from '../context/ChatContext.ts'
import { AuthScreen } from './auth/AuthScreen.tsx'
import { ChatLayout } from './chat/ChatLayout.tsx'

export const AppShell = () => {
  const { state } = useChat()
  return state.session ? <ChatLayout /> : <AuthScreen />
}
