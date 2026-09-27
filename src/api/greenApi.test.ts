import { describe, expect, it } from 'vitest'
import { classifyIncomingMode } from './greenApi.ts'

describe('classifyIncomingMode', () => {
  it('не считает вебхук режимом опроса', () => {
    expect(
      classifyIncomingMode({
        webhookUrl: ' https://example.com/hook ',
        incomingWebhook: 'yes',
      }),
    ).toEqual({ kind: 'webhook', webhookUrl: 'https://example.com/hook' })
  })

  it('различает готовую очередь и выключенные входящие', () => {
    expect(classifyIncomingMode({ webhookUrl: '', incomingWebhook: 'yes' })).toEqual({
      kind: 'polling',
    })
    expect(classifyIncomingMode({ incomingWebhook: 'no' })).toEqual({ kind: 'disabled' })
    expect(classifyIncomingMode({})).toEqual({ kind: 'disabled' })
  })
})
