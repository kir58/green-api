import { describe, expect, it } from 'vitest'
import { emptyState, reducer } from './reducer.ts'
import type { ChatMessage, Session } from './types.ts'

const session: Session = {
  apiUrl: 'https://1103.api.green-api.com',
  idInstance: '110100001',
  apiTokenInstance: 'token',
}

const message = (patch: Partial<ChatMessage> = {}): ChatMessage => {
  return {
    localId: 'local-1',
    id: 'local-1',
    chatId: '79990001122@c.us',
    text: 'Привет',
    direction: 'out',
    timestamp: 1_700_000_000_000,
    status: 'sending',
    ...patch,
  }
}

describe('reducer', () => {
  it('при входе начинает проверку входящих и очищает прошлые чаты', () => {
    const next = reducer(
      {
        ...emptyState,
        chats: [
          {
            chatId: '1',
            phone: '1',
            title: 'Старый',
            messages: [],
          },
        ],
      },
      { type: 'sessionSaved', session },
    )

    expect(next.session).toEqual(session)
    expect(next.chats).toEqual([])
    expect(next.inbox).toEqual({ kind: 'checking' })
  })

  it('проводит сообщение от отправки до ошибки и повтора', () => {
    const withChat = reducer(emptyState, {
      type: 'chatOpened',
      chat: { chatId: message().chatId, phone: '79990001122', title: 'Анна', messages: [] },
    })
    const sending = reducer(withChat, { type: 'sendStarted', message: message() })
    const failed = reducer(sending, { type: 'sendFailed', localId: 'local-1', error: 'сеть' })
    const retried = reducer(failed, { type: 'sendRetried', localId: 'local-1' })
    const sent = reducer(retried, { type: 'sendSucceeded', localId: 'local-1', idMessage: 'api-1' })

    expect(sending.chats[0]?.messages[0]?.status).toBe('sending')
    expect(failed.chats[0]?.messages[0]?.error).toBe('сеть')
    expect(retried.chats[0]?.messages[0]?.status).toBe('sending')
    expect(sent.chats[0]?.messages[0]).toMatchObject({ id: 'api-1', status: 'sent' })
  })

  it('не дублирует входящее и заменяет заголовок-номер именем', () => {
    const opened = reducer(emptyState, {
      type: 'chatOpened',
      chat: {
        chatId: '79990001122@c.us',
        phone: '79990001122',
        title: '79990001122',
        messages: [],
      },
    })
    const named = reducer(
      { ...opened, notice: 'старое' },
      {
        type: 'incomingReceived',
        chatId: '79990001122@c.us',
        title: 'Анна',
        phone: '79990001122',
        message: message({ direction: 'in', status: 'sent', id: 'in-1', localId: 'in-1' }),
      },
    )
    const duplicate = reducer(named, {
      type: 'incomingReceived',
      chatId: '79990001122@c.us',
      title: 'Другое',
      phone: '79990001122',
      message: message({ direction: 'in', status: 'sent', id: 'in-1', localId: 'in-1' }),
    })

    expect(named.chats[0]?.title).toBe('Анна')
    expect(named.notice).toBeNull()
    expect(duplicate).toBe(named)
  })

  it('не трогает ту же ошибку связи и ту же ошибку хранилища', () => {
    const failed = reducer(emptyState, { type: 'connectionChanged', error: 'сеть' })
    expect(reducer(failed, { type: 'connectionChanged', error: 'сеть' })).toBe(failed)

    const storage = reducer(emptyState, { type: 'storageResult', error: 'квота' })
    expect(reducer(storage, { type: 'storageResult', error: 'квота' })).toBe(storage)
    expect(reducer(storage, { type: 'storageResult', error: null }).storageError).toBeNull()
  })

  it('повторяет чтение настроек отдельным счётчиком', () => {
    const next = reducer(
      {
        ...emptyState,
        enablingInbox: true,
        inbox: { kind: 'error', message: 'сбой', phase: 'read' },
      },
      { type: 'settingsRetry' },
    )

    expect(next.settingsNonce).toBe(1)
    expect(next.inbox).toEqual({ kind: 'checking' })
    expect(next.enablingInbox).toBe(false)
  })
})
