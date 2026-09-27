import axios, { isAxiosError } from 'axios'
import type { IncomingMode, IncomingNotification, Session } from '../model/types.ts'
import { t } from '../i18n'

const RECEIVE_TIMEOUT_SECONDS = 20
const RECEIVE_REQUEST_TIMEOUT_MS = 30_000

export type AccountCheck = {
  exist?: boolean
  chatId?: string
  username?: string
  phoneNumber?: number
}

const createClient = (session: Session, timeout: number, signal?: AbortSignal) => {
  return axios.create({
    baseURL: `${session.apiUrl}/waInstance${session.idInstance}`,
    timeout,
    signal,
    headers: { 'Content-Type': 'application/json' },
  })
}

const methodPath = (session: Session, method: string, extra?: string) => {
  const token = encodeURIComponent(session.apiTokenInstance)
  return extra ? `/${method}/${token}/${extra}` : `/${method}/${token}`
}

export const getErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const data: unknown = error.response?.data
    if (typeof data === 'string' && data.trim()) {
      if (/<html/i.test(data)) {
        return t('errors.rejected')
      }
      return data.trim()
    }

    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      const message = record.message ?? record.error ?? record.description
      if (typeof message === 'string' && message.trim()) {
        return message.trim()
      }
      return JSON.stringify(data)
    }

    if (error.code === 'ECONNABORTED') {
      return t('errors.timeout')
    }

    if (!error.response) {
      return t('errors.network')
    }
    return error.message || t('errors.requestFailed')
  }

  if (error instanceof Error && error.message) {
    return error.message
  }
  return t('errors.unknown')
}

export const isAbortError = (error: unknown) => {
  if (isAxiosError(error) && error.code === 'ERR_CANCELED') {
    return true
  }
  return error instanceof DOMException && error.name === 'AbortError'
}

type InstanceSettings = {
  webhookUrl?: string
  incomingWebhook?: string
}

export const classifyIncomingMode = (settings: InstanceSettings): IncomingMode => {
  const webhookUrl = settings.webhookUrl?.trim() ?? ''
  if (webhookUrl) {
    return { kind: 'webhook', webhookUrl }
  }

  if (settings.incomingWebhook === 'yes') {
    return { kind: 'polling' }
  }

  return { kind: 'disabled' }
}

export const readIncomingMode = async (session: Session, signal: AbortSignal) => {
  const http = createClient(session, 15_000, signal)
  const { data } = await http.get<InstanceSettings>(methodPath(session, 'getSettings'))
  return classifyIncomingMode(data)
}

export const enableIncomingPolling = async (session: Session, signal: AbortSignal) => {
  const http = createClient(session, 15_000, signal)
  await http.post(methodPath(session, 'setSettings'), {
    webhookUrl: '',
    incomingWebhook: 'yes',
  })
}

export const getStateInstance = async (session: Session) => {
  const http = createClient(session, 15_000)
  const { data } = await http.get<{ stateInstance?: string }>(
    methodPath(session, 'getStateInstance'),
  )
  return data.stateInstance ?? ''
}

export const checkAccount = async (session: Session, phone: string) => {
  const http = createClient(session, 15_000)
  const { data } = await http.post<AccountCheck>(methodPath(session, 'checkAccount'), {
    phoneNumber: Number(phone),
  })
  return data
}

export const sendTextMessage = async (session: Session, chatId: string, message: string) => {
  const http = createClient(session, 15_000)
  const { data } = await http.post<{ idMessage?: string }>(methodPath(session, 'sendMessage'), {
    chatId,
    message,
  })
  if (!data?.idMessage) {
    throw new Error(t('errors.noMessageId'))
  }
  return data.idMessage
}

export const receiveNotification = async (session: Session, signal: AbortSignal) => {
  const http = createClient(session, RECEIVE_REQUEST_TIMEOUT_MS, signal)
  const { data } = await http.get<IncomingNotification | null | ''>(
    methodPath(session, 'receiveNotification'),
    { params: { receiveTimeout: RECEIVE_TIMEOUT_SECONDS } },
  )
  if (!data || typeof data !== 'object' || typeof data.receiptId !== 'number') {
    return null
  }
  return data
}

export const deleteNotification = async (
  session: Session,
  receiptId: number,
  signal: AbortSignal,
) => {
  const http = createClient(session, 15_000, signal)
  await http.delete(methodPath(session, 'deleteNotification', String(receiptId)))
}
