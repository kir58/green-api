import { afterEach, describe, expect, it, vi } from 'vitest'
import { t } from '../i18n/index.ts'
import { loadPersisted, savePersisted } from './storage.ts'
import type { Session } from './types.ts'

const session: Session = {
  apiUrl: 'https://1103.api.green-api.com',
  idInstance: '110100001',
  apiTokenInstance: 'token',
}

const memory = new Map<string, string>()

const installStorage = (setItem: (key: string, value: string) => void) => {
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem,
    removeItem: (key: string) => {
      memory.delete(key)
    },
  })
}

describe('storage', () => {
  afterEach(() => {
    memory.clear()
    vi.unstubAllGlobals()
  })

  it('сохраняет сессию и помечает прерванную отправку как ошибку', () => {
    installStorage((key, value) => {
      memory.set(key, value)
    })
    const saved = savePersisted({
      session,
      activeChatId: 'chat-1',
      chats: [
        {
          chatId: 'chat-1',
          phone: '79990001122',
          title: 'Анна',
          messages: [
            {
              localId: 'local-1',
              id: 'local-1',
              chatId: 'chat-1',
              text: 'Жду',
              direction: 'out',
              timestamp: 10,
              status: 'sending',
            },
          ],
        },
      ],
    })

    expect(saved).toBe(true)
    expect(loadPersisted()?.chats[0]?.messages[0]).toMatchObject({
      status: 'failed',
      error: t('message.interrupted'),
    })
  })

  it('отбрасывает битые чаты и не бросает исключение при переполнении', () => {
    installStorage((key, value) => {
      memory.set(key, value)
    })
    memory.set(
      'green-api-telegram',
      JSON.stringify({
        session,
        activeChatId: 'missing',
        chats: [{ chatId: 1 }, { title: 'без id' }, null],
      }),
    )

    expect(loadPersisted()).toMatchObject({ session, chats: [], activeChatId: 'missing' })

    installStorage(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    expect(() => savePersisted({ session, chats: [], activeChatId: null })).not.toThrow()
    expect(savePersisted({ session, chats: [], activeChatId: null })).toBe(false)
  })

  it('удаляет запись при выходе', () => {
    installStorage((key, value) => {
      memory.set(key, value)
    })
    savePersisted({ session, chats: [], activeChatId: null })
    expect(savePersisted({ session: null, chats: [], activeChatId: null })).toBe(true)
    expect(loadPersisted()).toBeNull()
  })
})
