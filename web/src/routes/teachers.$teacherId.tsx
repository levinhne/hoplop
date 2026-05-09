import { useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, GraduationCap, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useTeachers } from '@/hooks/useTeachers'
import { getFileUrl, pb } from '@/lib/pocketbase'
import { normalizeText } from '@/lib/utils'
import { seo } from '@/lib/seo'
import type { Teacher } from '@/types'

export const Route = createFileRoute('/teachers/$teacherId')({
  head: () => ({
    meta: seo({
      title: 'Chi tiết thầy cô',
      description: 'Trang check-in và gửi lời tri ân cho từng thầy cô.',
    }),
  }),
  component: TeacherDetailPage,
})

function TeacherDetailPage() {
  const { teacherId } = Route.useParams()
  const { data: teachers, isLoading: isLoadingTeachers } = useTeachers()

  const { data: teacher, isLoading, error } = useQuery({
    queryKey: ['teachers', teacherId],
    queryFn: async () => {
      return pb.collection('teachers').getOne<Teacher>(teacherId)
    },
  })

  const relatedTeachers = useMemo(() => {
    if (!teacher || !teachers) return []

    return teachers
      .filter((item) => item.id !== teacher.id)
      .sort((a, b) => stableScore(teacher.id, a.id) - stableScore(teacher.id, b.id))
      .slice(0, 4)
  }, [teacher, teachers])

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (error || !teacher) {
    return <NotFoundState />
  }

  const avatarUrl = getFileUrl('teachers', teacher.id, teacher.avatar)
  const subject = teacher.subject?.trim() || 'Đang cập nhật môn học'
  const period = teacher.period?.trim() || 'Đang cập nhật giai đoạn'
  const tribute = normalizeText(teacher.tribute) || 'Lời tri ân đang được cập nhật...'
  const initial = teacher.name.trim().substring(0, 1) || 'T'

  return (
    <div className="flex min-h-screen flex-col">
      <section className="flex min-h-[calc(100svh-5rem)] items-center bg-white/70 py-8 md:py-10">
        <div className="section-container">
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-lg border-4 border-white bg-slate-100 shadow-xl md:border-8 lg:max-h-[72svh]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={teacher.name} className="aspect-[4/5] h-full w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center text-8xl font-serif font-bold text-slate-200">
                    {initial}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-6 lg:col-span-7">
              <div className="max-w-3xl space-y-3 md:space-y-4">
                <span className="eyebrow">{subject}</span>
                <h1 className="font-serif text-5xl font-bold leading-tight text-reunion-ink md:text-7xl">
                  {teacher.name}
                </h1>
                <div className="h-1 w-16 bg-reunion-gold" />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
                  <BookOpen className="h-4 w-4 text-reunion-gold" />
                  {subject}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
                  <GraduationCap className="h-4 w-4 text-reunion-gold" />
                  {period}
                </div>
              </div>

              <div className="relative max-w-3xl">
                <Heart className="absolute -left-4 -top-4 h-10 w-10 text-reunion-gold/10" />
                <p className="pl-3 font-serif text-xl italic leading-relaxed text-slate-600 md:text-3xl">
                  "{tribute}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-reunion-gold/10 bg-reunion-paper py-10 md:py-12">
        <div className="section-container">
          <div className="mb-8 space-y-3">
            <span className="eyebrow">Tri ân</span>
            <h2 className="font-serif text-3xl font-bold text-reunion-ink md:text-4xl">Thầy cô khác</h2>
          </div>

          {isLoadingTeachers ? (
            <RelatedSkeleton />
          ) : relatedTeachers.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedTeachers.map((item) => (
                <RelatedTeacherCard key={item.id} teacher={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-7 text-center">
              <GraduationCap className="mx-auto mb-4 h-8 w-8 text-slate-300" />
              <p className="font-serif italic text-slate-400">Chưa có thầy cô khác.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function RelatedTeacherCard({ teacher }: { teacher: Teacher }) {
  const avatarUrl = getFileUrl('teachers', teacher.id, teacher.avatar)
  const subject = teacher.subject?.trim() || 'Đang cập nhật môn học'
  const initial = teacher.name.trim().substring(0, 1) || 'T'

  return (
    <Link
      to="/teachers/$teacherId"
      params={{ teacherId: teacher.id }}
      className="journal-card group block cursor-pointer border-2 border-slate-50 text-left"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={teacher.name}
            className="h-full w-full object-cover grayscale-[0.2] transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl font-serif font-bold uppercase text-slate-200">
            {initial}
          </div>
        )}
        <div className="absolute top-4 right-4 border border-slate-100 bg-white/90 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-reunion-forest opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
          Chi tiết
        </div>
      </div>
      <div className="space-y-2 p-6">
        <h3 className="font-serif text-lg font-bold text-reunion-ink transition-colors group-hover:text-reunion-forest">
          {teacher.name}
        </h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-reunion-gold">
          {subject}
        </p>
      </div>
    </Link>
  )
}

function RelatedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="space-y-4">
          <Skeleton className="aspect-[4/5] w-full rounded-xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function stableScore(seed: string, value: string) {
  let hash = 0
  const input = `${seed}:${value}`

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }

  return hash
}

function DetailSkeleton() {
  return (
    <div className="section-container grid grid-cols-1 gap-8 py-12 lg:grid-cols-12">
      <Skeleton className="aspect-[4/5] rounded-lg lg:col-span-5" />
      <div className="space-y-6 lg:col-span-7">
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-20 w-3/4 rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    </div>
  )
}

function NotFoundState() {
  return (
    <div className="section-container py-14 text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-dashed border-slate-200 bg-white/70 p-7">
        <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
        <h1 className="font-serif text-2xl font-bold text-reunion-ink">Không tìm thấy thầy cô</h1>
        <Button asChild variant="outline" className="h-10 rounded-md text-[10px] font-bold uppercase tracking-widest">
          <Link to="/teachers">Về danh sách thầy cô</Link>
        </Button>
      </div>
    </div>
  )
}
