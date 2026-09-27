import { useState } from 'react'
import { useChat } from '../../context/ChatContext.ts'
import { ChatSidebar } from './ChatSidebar.tsx'
import { ChatThread } from './ChatThread.tsx'
import { StatusBanner } from './StatusBanner.tsx'

export const ChatLayout = () => {
  const { state } = useChat()
  const [pane, setPane] = useState<'list' | 'chat'>(state.activeChatId ? 'chat' : 'list')
  const [trackedChatId, setTrackedChatId] = useState(state.activeChatId)

  if (state.activeChatId !== trackedChatId) {
    setTrackedChatId(state.activeChatId)

    if (state.activeChatId) {
      setPane('chat')
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-white">
      <StatusBanner />
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)]">
        <ChatSidebar hidden={pane === 'chat'} onOpen={() => setPane('chat')} />
        <ChatThread hidden={pane === 'list'} onBack={() => setPane('list')} />
      </div>
    </div>
  )
}
