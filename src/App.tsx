import { AppShell } from './components/AppShell.tsx'
import { ChatProvider } from './context/ChatProvider.tsx'

export const App = () => {
  return (
    <ChatProvider>
      <AppShell />
    </ChatProvider>
  )
}
