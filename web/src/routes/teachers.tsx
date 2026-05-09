import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, Outlet, useMatchRoute } from '@tanstack/react-router'
import { useTeachers } from '@/hooks/useTeachers'
import { getFileUrl } from '@/lib/pocketbase'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { GraduationCap, Search } from 'lucide-react'
import type { Teacher } from '@/types'
import { normalizeSearch } from '@/lib/utils'
import { seo } from '@/lib/seo'

const tributeQuotes = [
  'Ơn thầy cô là ngọn đèn lặng lẽ, soi chúng em qua những năm tháng đầu đời.',
  'Có những bài học không nằm trong vở, nhưng theo chúng em đến tận hôm nay.',
  'Một lời giảng năm xưa, một ánh mắt hiền từ, vẫn còn ấm trong ký ức.',
  'Thầy cô gieo hạt mầm tử tế, để chúng em lớn lên bằng lòng biết ơn.',
  'Nhờ thầy cô, những ngày vụng dại năm ấy trở thành hành trang dịu dàng.',
  'Có những tiếng gọi bảng, nhắc lại thôi cũng thấy cả lớp học ùa về.',
  'Thầy cô đã dạy chúng em cách lớn lên, bằng tri thức và bằng yêu thương.',
  'Bao năm đi xa, chúng em vẫn nhớ dáng thầy cô bên bục giảng cũ.',
]

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
  const matchRoute = useMatchRoute()
  const { data: teachers, isLoading, error } = useTeachers()
  const [selectedSubject, setSelectedSubject] = useState('Tất cả')
  const [searchTerm, setSearchTerm] = useState('')
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [isQuoteVisible, setIsQuoteVisible] = useState(true)
  const isDetailRoute = Boolean(matchRoute({ to: '/teachers/$teacherId' }))

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsQuoteVisible(false)
      window.setTimeout(() => {
        setQuoteIndex((current) => (current + 1) % tributeQuotes.length)
        setIsQuoteVisible(true)
      }, 450)
    }, 4200)

    return () => window.clearInterval(interval)
  }, [])

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

  if (isDetailRoute) {
    return <Outlet />
  }

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

          <div className="soft-panel relative overflow-hidden p-6 lg:col-span-4 md:p-7">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-reunion-gold/20" />
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.28em] text-reunion-gold">
              Tri ân
            </span>
            <p
              className={`min-h-[5.25rem] font-serif text-lg italic leading-relaxed text-reunion-sepia transition-all duration-500 md:min-h-[5.5rem] md:text-xl ${
                isQuoteVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
            >
              "{tributeQuotes[quoteIndex]}"
            </p>
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
  const teacherInitial = teacher.name.trim().substring(0, 1) || 'T'

  return (
    <Link
      to="/teachers/$teacherId"
      params={{ teacherId: teacher.id }}
      className="journal-card group block cursor-pointer border-2 border-slate-50 text-left"
    >
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
    </Link>
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
