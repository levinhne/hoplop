import type { Member } from '@/types'

export function getMemberClassName(member: Member, fallback = 'Chưa cập nhật lớp') {
  return member.expand?.class_ref?.name?.trim() || fallback
}
