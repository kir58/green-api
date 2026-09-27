import { describe, expect, it } from 'vitest'
import { t } from '../i18n/index.ts'
import { mapNotification } from './mapNotification.ts'
import type { IncomingNotification } from './types.ts'

const incoming = (patch: IncomingNotification['body']): IncomingNotification => {
  return {
    receiptId: 7,
    body: {
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1_700_000_000,
      idMessage: 'msg-1',
      senderData: {
        chatId: '79990001122@c.us',
        chatName: 'Анна',
        senderPhoneNumber: 79990001122,
      },
      ...patch,
    },
  }
}

describe('mapNotification', () => {
  it('читает обычный и расширенный текст', () => {
    const text = mapNotification(
      incoming({
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: ' Привет ' } },
      }),
    )
    const extended = mapNotification(
      incoming({
        messageData: {
          typeMessage: 'extendedTextMessage',
          extendedTextMessageData: { text: 'Ссылка' },
        },
      }),
    )

    expect(text?.message.text).toBe('Привет')
    expect(text?.message.timestamp).toBe(1_700_000_000_000)
    expect(extended?.message.text).toBe('Ссылка')
    expect(text?.title).toBe('Анна')
  })

  it('показывает заглушку для нетекстового входящего', () => {
    const mapped = mapNotification(
      incoming({
        messageData: { typeMessage: 'imageMessage' },
      }),
    )

    expect(mapped?.message.text).toBe(t('message.unsupported'))
    expect(mapped?.chatId).toBe('79990001122@c.us')
  })

  it('игнорирует статусы и прочие вебхуки', () => {
    expect(
      mapNotification({
        receiptId: 1,
        body: { typeWebhook: 'outgoingMessageStatus', idMessage: 'msg-1' },
      }),
    ).toBeNull()
  })
})
