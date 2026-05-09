import { useMemo, useState } from 'react'
import { createFileRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { useClasses } from '@/hooks/useClasses'
import { useMembers } from '@/hooks/useMembers'
import { getFileUrl } from '@/lib/pocketbase'
import { getMemberClassName } from '@/lib/members'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Search, UsersRound } from 'lucide-react'
import type { Member } from '@/types'
import { normalizeSearch } from '@/lib/utils'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/members')({
  head: () => ({
    meta: seo({
      title: 'Bạn bè',
      description: 'Danh sách bạn bè trong lớp, có tìm kiếm theo tên và lọc theo lớp/niên khóa.',
    }),
  }),
  component: MembersPage,
})

function MembersPage() {
  const matchRoute = useMatchRoute()
  const { data: members, isLoading, error } = useMembers()
  const { data: classGroups, isLoading: isLoadingClasses } = useClasses()
  const [selectedClass, setSelectedClass] = useState('Tất cả')
  const [searchTerm, setSearchTerm] = useState('')
  const isDetailRoute = Boolean(matchRoute({ to: '/members/$memberId' }))

  const classes = useMemo(() => {
    const uniqueClasses = new Set<string>()

    classGroups?.forEach((classGroup) => {
      const className = normalizeValue(classGroup.name)
      if (className) uniqueClasses.add(className)
    })

    members?.forEach((member) => {
      uniqueClasses.add(getMemberClassName(member))
    })

    return ['Tất cả', ...Array.from(uniqueClasses)]
  }, [classGroups, members])

  const visibleMembers = useMemo(() => {
    if (!members) return []

    const normalizedSearch = normalizeSearch(searchTerm)

    return members.filter((member) => {
      const className = getMemberClassName(member)
      const matchesClass = selectedClass === 'Tất cả' || className === selectedClass
      const matchesName = !normalizedSearch || normalizeSearch(member.name).includes(normalizedSearch)

      return matchesClass && matchesName
    })
  }, [members, searchTerm, selectedClass])

  if (isDetailRoute) {
    return <Outlet />
  }

  if (error) {
    return (
      <div className="section-container py-14 text-center">
        <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-100 bg-white p-7 shadow-sm">
          <UsersRound className="mx-auto h-8 w-8 text-reunion-gold" />
          <h1 className="font-serif text-2xl font-bold text-reunion-ink">Không tải được danh sách bạn bè</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Vui lòng kiểm tra lại PocketBase hoặc cấu hình `VITE_POCKETBASE_URL`.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <section className="page-hero">
        <div className="section-container grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="max-w-2xl space-y-3 lg:col-span-8">
            <span className="eyebrow">Tập thể 9A</span>
            <h1 className="font-serif text-4xl font-bold leading-tight text-reunion-ink md:text-5xl">Chúng mình của hiện tại</h1>
            <p className="font-serif text-base italic leading-relaxed text-slate-500 md:text-lg">
              Bạn cũ giống như những ngôi sao, không phải lúc nào cũng thấy nhưng họ luôn ở đó.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-4">
            <MemberStat value={members?.length ?? 0} label="Thành viên" isLoading={isLoading} />
            <MemberStat value={classes.length > 1 ? classes.length - 1 : 0} label="Nhóm lớp" isLoading={isLoading} />
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-container">
          <div className="filter-panel">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-xl space-y-3">
                <div className="flex items-center gap-3 text-reunion-gold">
                  <Search className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Tìm bạn cũ</span>
                </div>
                <label className="sr-only" htmlFor="member-search">Tìm theo tên</label>
                <div className="relative max-w-lg">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <input
                    id="member-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Nhập tên bạn muốn tìm..."
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-reunion-ink outline-none transition focus:border-reunion-gold focus:ring-2 focus:ring-reunion-gold/10"
                  />
                </div>
              </div>

              {(searchTerm || selectedClass !== 'Tất cả') && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md px-4 text-[10px] font-bold uppercase tracking-widest"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedClass('Tất cả')
                  }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>

            {isLoading || isLoadingClasses ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-10 w-24 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {classes.map((className) => (
                  <Button
                    key={className}
                    type="button"
                    variant={selectedClass === className ? 'default' : 'outline'}
                    className="h-10 rounded-md px-4 text-[10px] font-bold uppercase tracking-widest"
                    onClick={() => setSelectedClass(className)}
                  >
                    {className}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/5] w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {visibleMembers.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
              {visibleMembers.length === 0 && (
                <EmptyMembers selectedClass={selectedClass} searchTerm={searchTerm} />
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function MemberCard({ member }: { member: Member }) {
  const thumbUrl = getFileUrl('members', member.id, member.thumb)
  const className = getMemberClassName(member, 'Lớp 9A')
  const memberInitial = member.name.trim().substring(0, 1) || 'B'

  return (
    <Link
      to="/members/$memberId"
      params={{ memberId: member.id }}
      className="journal-card group block cursor-pointer border-2 border-slate-50 text-left"
    >
      <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={member.name}
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl font-serif font-bold text-slate-200 uppercase">
            {memberInitial}
          </div>
        )}
        <div className="absolute top-4 right-4 px-2 py-1 rounded-none bg-white/90 backdrop-blur shadow-sm text-[8px] font-bold text-reunion-forest uppercase tracking-widest border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
          Chi tiết
        </div>
      </div>
      <div className="p-6 space-y-2">
        <h3 className="font-serif text-lg font-bold text-reunion-ink group-hover:text-reunion-forest transition-colors">
          {member.name}
        </h3>
        <p className="text-[10px] text-reunion-gold font-bold uppercase tracking-widest">
          {className}
        </p>
      </div>
    </Link>
  )
}

function MemberStat({ value, label, isLoading }: { value: number; label: string; isLoading?: boolean }) {
  return (
    <div className="soft-panel min-h-24 p-5">
      <UsersRound className="mb-4 h-5 w-5 text-reunion-gold" />
      {isLoading ? (
        <Skeleton className="h-8 w-12 rounded-md" />
      ) : (
        <div className="font-serif text-3xl font-bold text-reunion-ink">{value}</div>
      )}
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{label}</div>
    </div>
  )
}

function EmptyMembers({ selectedClass, searchTerm }: { selectedClass: string; searchTerm: string }) {
  const hasFilter = selectedClass !== 'Tất cả' || Boolean(searchTerm.trim())
  const message = hasFilter
    ? 'Không tìm thấy thành viên phù hợp với bộ lọc hiện tại.'
    : 'Chưa có dữ liệu thành viên nào được cập nhật.'

  return (
    <div className="col-span-full py-14 text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-dashed border-slate-200 bg-white/70 p-7">
        <UsersRound className="mx-auto h-8 w-8 text-slate-300" />
        <p className="font-serif italic text-slate-400">{message}</p>
      </div>
    </div>
  )
}

function normalizeValue(value?: string) {
  return value?.trim() ?? ''
}
