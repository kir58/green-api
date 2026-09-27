import { useEffect, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import {
  checkAccount,
  deleteNotification,
  enableIncomingPolling,
  getErrorMessage,
  getStateInstance,
  isAbortError,
  readIncomingMode,
  receiveNotification,
  sendTextMessage,
} from '../api/greenApi.ts'
import { t } from '../i18n'
import { mapNotification } from '../model/mapNotification.ts'
import { isValidPhone, normalizePhone } from '../model/phone.ts'
import { emptyState, reducer } from '../model/reducer.ts'
import { loadPersisted, savePersisted } from '../model/storage.ts'
import type { ChatMessage, Session, State } from '../model/types.ts'
import { ChatContext, normalizeSession } from './ChatContext.ts'
import type { OpenChatResult } from './ChatContext.ts'

const createInitialState = (): State => {
  const saved = loadPersisted()
  if (!saved?.session) {
    return emptyState
  }
  const activeExists = saved.chats.some((chat) => chat.chatId === saved.activeChatId)
  return {
    ...emptyState,
    session: saved.session,
    chats: saved.chats,
    activeChatId: activeExists ? saved.activeChatId : null,
    inbox: { kind: 'checking' },
  }
}

const sleep = (ms: number, signal: AbortSignal) => {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, null, () => createInitialState())
  const stateRef = useRef(state)
  const settingsEpoch = useRef(0)
  const settingsAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    stateRef.current = state
  })

  useEffect(() => {
    const saved = savePersisted({
      session: state.session,
      chats: state.chats,
      activeChatId: state.activeChatId,
    })
    dispatch({
      type: 'storageResult',
      error: saved ? null : t('errors.storage'),
    })
  }, [state.session, state.chats, state.activeChatId])

  useEffect(() => {
    const session = state.session
    if (!session) {
      return
    }

    const controller = new AbortController()
    settingsAbortRef.current = controller
    const epoch = ++settingsEpoch.current
    let stopped = false

    const run = async () => {
      try {
        const mode = await readIncomingMode(session, controller.signal)
        if (stopped || epoch !== settingsEpoch.current) {
          return
        }
        dispatch({ type: 'inboxChanged', inbox: mode })
      } catch (error) {
        if (stopped || epoch !== settingsEpoch.current || isAbortError(error)) {
          return
        }
        dispatch({
          type: 'inboxChanged',
          inbox: { kind: 'error', message: getErrorMessage(error), phase: 'read' },
        })
      }
    }

    void run()

    return () => {
      stopped = true
      controller.abort()
      if (settingsAbortRef.current === controller) {
        settingsAbortRef.current = null
      }
    }
  }, [state.session, state.settingsNonce])

  useEffect(() => {
    const session = state.session
    if (!session || state.inbox.kind !== 'polling') {
      return
    }

    const controller = new AbortController()
    let stopped = false

    const loop = async () => {
      while (!stopped) {
        const started = Date.now()
        try {
          const notification = await receiveNotification(session, controller.signal)
          if (stopped) {
            return
          }

          if (notification) {
            const incoming = mapNotification(notification)
            if (incoming) {
              dispatch({ type: 'incomingReceived', ...incoming })
            }
            await deleteNotification(session, notification.receiptId, controller.signal)
          } else if (Date.now() - started < 1000) {
            await sleep(1000, controller.signal)
          }

          if (!stopped) {
            dispatch({ type: 'connectionChanged', error: null })
          }
        } catch (error) {
          if (stopped || isAbortError(error)) {
            return
          }

          if (!stopped) {
            dispatch({ type: 'connectionChanged', error: getErrorMessage(error) })
          }
          try {
            await sleep(2000, controller.signal)
          } catch (sleepError) {
            if (isAbortError(sleepError)) {
              return
            }
          }
        }
      }
    }

    void loop()

    return () => {
      stopped = true
      controller.abort()
    }
  }, [state.session, state.inbox.kind])

  const login = async (session: Session): Promise<OpenChatResult> => {
    const normalized = normalizeSession(session)
    try {
      const instanceState = await getStateInstance(normalized)

      if (instanceState === 'authorized') {
        dispatch({ type: 'sessionSaved', session: normalized })
        return { ok: true }
      }

      if (instanceState === 'notAuthorized') {
        return { ok: false, error: t('auth.notAuthorized') }
      }

      if (instanceState === 'blocked') {
        return { ok: false, error: t('auth.blocked') }
      }

      if (instanceState === 'suspended') {
        return { ok: false, error: t('auth.suspended') }
      }

      if (instanceState === 'starting') {
        return { ok: false, error: t('auth.starting') }
      }

      if (instanceState === 'pendingPassword') {
        return { ok: false, error: t('auth.pendingPassword') }
      }

      return {
        ok: false,
        error: t('auth.unexpectedState', { state: instanceState || t('errors.unknown') }),
      }
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) }
    }
  }

  const logout = () => {
    dispatch({ type: 'sessionCleared' })
  }

  const retryInbox = () => {
    dispatch({ type: 'settingsRetry' })
  }

  const enableInbox = async () => {
    const session = stateRef.current.session
    const signal = settingsAbortRef.current?.signal
    if (!session || !signal || stateRef.current.enablingInbox) {
      return
    }

    const epoch = ++settingsEpoch.current
    dispatch({ type: 'inboxEnableStarted' })
    try {
      await enableIncomingPolling(session, signal)
      if (
        epoch !== settingsEpoch.current ||
        signal.aborted ||
        stateRef.current.session !== session
      ) {
        return
      }
      dispatch({ type: 'inboxEnabled', notice: t('inbox.enabled') })
    } catch (error) {
      if (
        epoch !== settingsEpoch.current ||
        isAbortError(error) ||
        stateRef.current.session !== session
      ) {
        return
      }
      dispatch({
        type: 'inboxChanged',
        inbox: { kind: 'error', message: getErrorMessage(error), phase: 'enable' },
      })
    }
  }

  const openChat = async (phoneRaw: string): Promise<OpenChatResult> => {
    const session = stateRef.current.session
    if (!session) {
      return { ok: false, error: t('errors.loginFirst') }
    }

    if (stateRef.current.openingChat) {
      return { ok: false, error: t('errors.chatOpening') }
    }

    const phone = normalizePhone(phoneRaw)
    if (!isValidPhone(phone)) {
      return {
        ok: false,
        error: t('errors.invalidPhone', { phone: t('newChat.placeholder') }),
      }
    }

    dispatch({ type: 'chatOpenStarted' })
    try {
      const account = await checkAccount(session, phone)
      if (stateRef.current.session !== session) {
        dispatch({ type: 'chatOpenFinished' })
        return { ok: false, error: t('errors.sessionEnded') }
      }

      if (account.exist === false || !account.chatId) {
        dispatch({ type: 'chatOpenFinished' })
        return { ok: false, error: t('errors.accountNotFound') }
      }
      const username = account.username?.replace(/^@/, '')
      dispatch({
        type: 'chatOpened',
        chat: {
          chatId: String(account.chatId),
          phone: account.phoneNumber ? String(account.phoneNumber) : phone,
          title: username || phone,
          messages: [],
        },
      })
      return { ok: true }
    } catch (error) {
      dispatch({ type: 'chatOpenFinished' })
      return { ok: false, error: getErrorMessage(error) }
    }
  }

  const selectChat = (chatId: string) => {
    dispatch({ type: 'chatSelected', chatId })
  }

  const deliver = async (chatId: string, localId: string, text: string) => {
    const session = stateRef.current.session
    if (!session) {
      return
    }
    try {
      const idMessage = await sendTextMessage(session, chatId, text)
      dispatch({ type: 'sendSucceeded', localId, idMessage })
    } catch (error) {
      dispatch({ type: 'sendFailed', localId, error: getErrorMessage(error) })
    }
  }

  const sendMessage = async (text: string) => {
    const snapshot = stateRef.current
    const chatId = snapshot.activeChatId
    const trimmed = text.trim()
    if (!snapshot.session || !chatId || !trimmed) {
      return
    }

    if (trimmed.length > 4096) {
      return
    }

    const localId = crypto.randomUUID()
    const message: ChatMessage = {
      localId,
      id: localId,
      chatId,
      text: trimmed,
      direction: 'out',
      timestamp: Date.now(),
      status: 'sending',
    }
    dispatch({ type: 'sendStarted', message })
    await deliver(chatId, localId, trimmed)
  }

  const retryMessage = async (localId: string) => {
    const snapshot = stateRef.current
    if (!snapshot.session) {
      return
    }
    const chat = snapshot.chats.find((item) =>
      item.messages.some((message) => message.localId === localId),
    )
    const message = chat?.messages.find((item) => item.localId === localId)
    if (!chat || !message || message.status !== 'failed') {
      return
    }
    dispatch({ type: 'sendRetried', localId })
    await deliver(chat.chatId, localId, message.text)
  }

  const value = {
    state,
    login,
    logout,
    retryInbox,
    enableInbox,
    openChat,
    selectChat,
    sendMessage,
    retryMessage,
  }

  return <ChatContext value={value}>{children}</ChatContext>
}
