import type { Chat } from './types.ts'
import { intlLocale, t } from '../i18n/index.ts'

const avatarColors = ['#e17076', '#7bc862', '#65aadd', '#ee7aae', '#6ec9cb', '#faa774']

export const formatMessageTime = (timestamp: number) => {
  return new Intl.DateTimeFormat(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

export const formatPhone = (phone: string) => {
  if (!phone) {
    return ''
  }
  return phone.startsWith('+') ? phone : `+${phone}`
}

export const lastPreview = (chat: Chat) => {
  const last = chat.messages.at(-1)
  if (!last) {
    return t('chat.noMessages')
  }
  return last.direction === 'out' ? t('chat.outgoingPreview', { text: last.text }) : last.text
}

export const avatarLabel = (title: string) => {
  const compact = title.replace(/\s/g, '')
  const digits = compact.replace(/\D/g, '')
  if (digits.length >= 10 && digits.length === compact.replace(/^\+/, '').length) {
    return digits.slice(-2)
  }
  return title.trim().slice(0, 1).toUpperCase() || '?'
}

export const avatarColor = (id: string) => {
  let hash = 0
  for (const char of id) {
    hash = (hash + char.charCodeAt(0)) % avatarColors.length
  }
  return avatarColors[hash] ?? avatarColors[0]
}
