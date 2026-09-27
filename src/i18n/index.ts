import ru from '../locales/ru.json' with { type: 'json' }

const dictionaries = { ru }

export const locale = 'ru' as const
export const intlLocale = ru.meta.intl
export const htmlLang = ru.meta.htmlLang

type Dictionary = typeof ru

type Join<Prefix extends string, Key extends string> = Prefix extends '' ? Key : `${Prefix}.${Key}`

type Paths<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : {
      [Key in keyof T & string]: Paths<T[Key], Join<Prefix, Key>>
    }[keyof T & string]

export type MessageKey = Paths<Dictionary>

const read = (key: string) => {
  const node = key.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return undefined
    }
    return (current as Record<string, unknown>)[part]
  }, dictionaries[locale])

  return typeof node === 'string' ? node : key
}

export const t = (key: MessageKey, vars?: Record<string, string | number>) => {
  const template = read(key)
  if (!vars) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}
