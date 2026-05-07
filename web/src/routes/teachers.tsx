import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTeachers } from '@/hooks/useTeachers'
import { getFileUrl } from '@/lib/pocketbase'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Heart, BookOpen, GraduationCap, MessageSquareQuote, Search, UsersRound } from 'lucide-react'
import type { Teacher } from '@/types'
import { normalizeSearch, normalizeText } from '@/lib/utils'
import { seo } from '@/lib/seo'

export const Route = createFileRoute('/teachers')({
  head: () => ({
    meta: seo({
      title: 'Thầy cô',
      description: 'Trang tri ân thầy cô, lưu giữ thông tin giảng dạy và những lời nhắn biết ơn.',
    }),
  }),
  component: TeachersPage,
})

function TeachersPage() {
  const { data: teachers, isLoading, error } = useTeachers()
  const [selectedSubject, setSelectedSubject] = useState('Tất cả')
  const [searchTerm, setSearchTerm] = useState('')

  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(
      teachers
        ?.map((teacher) => normalizeValue(teacher.subject))
        .filter(Boolean)
    )

    return ['Tất cả', ...Array.from(uniqueSubjects)]
  }, [teachers])

  const visibleTeachers = useMemo(() => {
    if (!teachers) return []
    const normalizedSearch = normalizeSearch(searchTerm)

    return teachers.filter((teacher) => {
      const matchesSubject = selectedSubject === 'Tất cả' || normalizeValue(teacher.subject) === selectedSubject
      const matchesName = !normalizedSearch || normalizeSearch(teacher.name).includes(normalizedSearch)
      return matchesSubject && matchesName
    })
  }, [selectedSubject, searchTerm, teachers])

  const homeroomCount = useMemo(() => {
    return teachers?.filter((teacher) => normalizeValue(teacher.period).toLowerCase().includes('chủ nhiệm')).length ?? 0
  }, [teachers])

  if (error) {
    return (
      <div className="section-container py-14 text-center">
        <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-100 bg-white p-7 shadow-sm">
          <GraduationCap className="mx-auto h-8 w-8 text-reunion-gold" />
          <h1 className="font-serif text-2xl font-bold text-reunion-ink">Không tải được danh sách thầy cô</h1>
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
          <div className="max-w-3xl space-y-3 lg:col-span-8">
            <span className="eyebrow">Ân sư trọng đạo</span>
            <h1 className="font-serif text-4xl font-bold leading-tight text-reunion-ink md:text-5xl">
              Người lái đò thầm lặng
            </h1>
            <p className="max-w-2xl font-serif text-base italic leading-relaxed text-slate-500 md:text-lg">
              Một chữ cũng là thầy, nửa chữ cũng là thầy. Những bài học năm xưa vẫn còn vang vọng tới hôm nay.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:col-span-4">
            <TeacherStat value={teachers?.length ?? 0} label="Thầy cô" icon={GraduationCap} isLoading={isLoading} />
            <TeacherStat value={subjects.length > 1 ? subjects.length - 1 : 0} label="Môn học" icon={BookOpen} isLoading={isLoading} />
            <TeacherStat value={homeroomCount} label="Chủ nhiệm" icon={UsersRound} isLoading={isLoading} />
            <Link
              to="/feelings"
              className="soft-panel flex min-h-24 flex-col justify-between p-5 text-reunion-forest transition-colors hover:border-reunion-gold/50"
            >
              <MessageSquareQuote className="h-5 w-5 text-reunion-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-reunion-forest">
                Gửi lời tri ân
              </span>
            </Link>
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
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Danh sách tri ân</span>
                </div>
                <label className="sr-only" htmlFor="teacher-search">Tìm theo tên</label>
                <div className="relative max-w-lg">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                  <input
                    id="teacher-search"
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nhập tên thầy cô muốn tìm..."
                    className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-reunion-ink outline-none transition focus:border-reunion-gold focus:ring-2 focus:ring-reunion-gold/10"
                  />
                </div>
              </div>

              {(searchTerm || selectedSubject !== 'Tất cả') && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md px-4 text-[10px] font-bold uppercase tracking-widest"
                  onClick={() => { setSearchTerm(''); setSelectedSubject('Tất cả') }}
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-10 w-24 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <Button
                    key={subject}
                    type="button"
                    variant={selectedSubject === subject ? 'default' : 'outline'}
                    className="h-10 rounded-md px-4 text-[10px] font-bold uppercase tracking-widest"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-6">
                  <Skeleton className="aspect-[4/5] w-full rounded-lg" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleTeachers.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
              {visibleTeachers.length === 0 && (
                <EmptyTeachers selectedSubject={selectedSubject} />
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const avatarUrl = getFileUrl('teachers', teacher.id, teacher.avatar)
  const subject = normalizeValue(teacher.subject) || 'Đang cập nhật môn học'
  const period = normalizeValue(teacher.period) || 'Đang cập nhật giai đoạn'
  const tribute = normalizeText(teacher.tribute) || 'Lời tri ân đang được cập nhật...'
  const teacherInitial = teacher.name.trim().substring(0, 1) || 'T'

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="journal-card group cursor-pointer border-2 border-slate-50 text-left">
          <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={teacher.name} 
                className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl font-serif font-bold text-slate-200 uppercase">
                {teacherInitial}
              </div>
            )}
            <div className="absolute top-4 right-4 px-2 py-1 rounded-none bg-white/90 backdrop-blur shadow-sm text-[8px] font-bold text-reunion-forest uppercase tracking-widest border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
              Chi tiết
            </div>
          </div>
          
          <div className="p-6 space-y-2">
            <h3 className="font-serif text-lg font-bold text-reunion-ink group-hover:text-reunion-forest transition-colors">
              {teacher.name}
            </h3>
            <p className="text-[10px] text-reunion-gold font-bold uppercase tracking-widest">
              {subject}
            </p>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl overflow-hidden rounded-xl border-none p-0 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-[4/5] md:aspect-auto h-full">
            {avatarUrl ? (
              <img src={avatarUrl} alt={teacher.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-8xl font-serif font-bold text-slate-200">
                {teacherInitial}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center space-y-5 p-7 md:p-8">
            <div className="space-y-3">
              <span className="eyebrow">{subject}</span>
              <DialogTitle className="font-serif text-3xl font-bold text-reunion-ink md:text-4xl">
                {teacher.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Lời tri ân và thông tin giảng dạy của {teacher.name}
              </DialogDescription>
              <div className="w-12 h-1 bg-reunion-gold"></div>
            </div>

            <div className="space-y-4 text-slate-600">
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="w-4 h-4 text-reunion-gold" />
                <span>Môn giảng dạy: {subject}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="w-4 h-4 text-reunion-gold" />
                <span>Giai đoạn: {period}</span>
              </div>
            </div>

            <div className="relative">
              <Heart className="absolute -top-4 -left-4 w-8 h-8 text-reunion-gold/10" />
              <p className="font-serif italic text-slate-500 leading-relaxed pl-2">
                {quote(tribute)}
              </p>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TeacherStat({
  value,
  label,
  icon: Icon,
  isLoading,
}: {
  value: number
  label: string
  icon: typeof GraduationCap
  isLoading?: boolean
}) {
  return (
    <div className="soft-panel min-h-24 p-5">
      <Icon className="mb-4 h-5 w-5 text-reunion-gold" />
      {isLoading ? (
        <Skeleton className="h-8 w-12 rounded-md" />
      ) : (
        <div className="font-serif text-3xl font-bold text-reunion-ink">{value}</div>
      )}
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{label}</div>
    </div>
  )
}

function EmptyTeachers({ selectedSubject }: { selectedSubject: string }) {
  const message =
    selectedSubject === 'Tất cả'
      ? 'Chưa có dữ liệu thầy cô nào được cập nhật.'
      : `Chưa có thầy cô thuộc môn ${selectedSubject}.`

  return (
    <div className="col-span-full py-14 text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-dashed border-slate-200 bg-white/70 p-7">
        <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
        <p className="font-serif italic text-slate-400">{message}</p>
      </div>
    </div>
  )
}

function normalizeValue(value?: string) {
  return value?.trim() ?? ''
}

function quote(value: string) {
  return `"${value}"`
}
