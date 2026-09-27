import { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../model/types.ts'
import { MessageBubble } from './MessageBubble.tsx'

export const MessageList = ({ messages }: { messages: ChatMessage[] }) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 md:px-8">
      <ul className="mx-auto mt-auto flex w-full max-w-3xl flex-col gap-2">
        {messages.map((message) => (
          <MessageBubble key={message.localId} message={message} />
        ))}
      </ul>
      <div ref={bottomRef} />
    </div>
  )
}
