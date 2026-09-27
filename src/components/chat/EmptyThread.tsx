import { t } from '../../i18n/index.ts'

export const EmptyThread = () => {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center px-6 text-center md:flex">
      <p className="text-lg font-medium text-[#17212b]">{t('chat.pickTitle')}</p>
      <p className="mt-2 max-w-sm text-sm text-tg-muted">{t('chat.pickText')}</p>
    </div>
  )
}
