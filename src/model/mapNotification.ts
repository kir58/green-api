import { t } from '../i18n/index.ts'
import type { ChatMessage, IncomingNotification } from './types.ts'

export type IncomingText = {
  chatId: string
  title: string
  phone: string
  message: ChatMessage
}

const toMillis = (timestamp: number | undefined) => {
  if (!timestamp) {
    return Date.now()
  }
  return timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp
}

const readText = (messageData: NonNullable<IncomingNotification['body']>['messageData']) => {
  if (messageData?.typeMessage === 'textMessage') {
    return messageData.textMessageData?.textMessage
  }

  if (messageData?.typeMessage === 'extendedTextMessage') {
    return messageData.extendedTextMessageData?.text
  }

  return null
}

export const mapNotification = (notification: IncomingNotification): IncomingText | null => {
  const body = notification.body
  if (body?.typeWebhook !== 'incomingMessageReceived') {
    return null
  }

  const rawChatId = body.senderData?.chatId
  if (rawChatId === undefined || rawChatId === null || rawChatId === '') {
    return null
  }
  const chatId = String(rawChatId)
  const text = readText(body.messageData)?.trim()
  const rawPhone = body.senderData?.senderPhoneNumber
  const phone = rawPhone ? String(rawPhone) : ''
  const title = body.senderData?.chatName || body.senderData?.senderName || phone || chatId
  const id = body.idMessage || `in-${notification.receiptId}`

  return {
    chatId,
    title,
    phone,
    message: {
      localId: id,
      id,
      chatId,
      text: text || t('message.unsupported'),
      direction: 'in',
      timestamp: toMillis(body.timestamp),
      status: 'sent',
    },
  }
}
