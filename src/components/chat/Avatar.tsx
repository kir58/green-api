import { avatarColor, avatarLabel } from '../../model/format.ts'

export const Avatar = ({
  id,
  title,
  size = 'md',
}: {
  id: string
  title: string
  size?: 'md' | 'sm'
}) => {
  const dimension = size === 'sm' ? 'size-10 text-sm' : 'size-12 text-base'
  return (
    <span
      className={`grid ${dimension} shrink-0 place-items-center rounded-full font-semibold text-white`}
      style={{ backgroundColor: avatarColor(id) }}
      aria-hidden="true"
    >
      {avatarLabel(title)}
    </span>
  )
}
