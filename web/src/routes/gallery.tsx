import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { getFileUrl } from '@/lib/pocketbase'
import { useGalleryList } from '@/hooks/useGallery'
import { cn } from '@/lib/utils'
import { seo } from '@/lib/seo'
import { ImageIcon, Images } from 'lucide-react'
import type { GalleryItem } from '@/types'

type GalleryFilter = 'all' | GalleryItem['category']

const categoryLabels: Record<GalleryItem['category'], string> = {
  school: 'Sân trường',
  reunion: 'Hội ngộ',
  old_days: 'Ngày xưa',
}

const filterOptions: Array<{ value: GalleryFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'school', label: 'Sân trường' },
  { value: 'reunion', label: 'Hội ngộ' },
  { value: 'old_days', label: 'Ngày xưa' },
]

export const Route = createFileRoute('/gallery')({
  head: () => ({
    meta: seo({
      title: 'Kỷ niệm',
      description: 'Album ảnh kỷ niệm của lớp, gồm sân trường, ngày xưa và những lần hội ngộ.',
    }),
  }),
  component: GalleryPage,
})

function GalleryPage() {
  const { data: gallery, isLoading, error } = useGalleryList()
  const [selectedCategory, setSelectedCategory] = useState<GalleryFilter>('all')

  const visibleGallery = useMemo(() => {
    if (!gallery) return []
    if (selectedCategory === 'all') return gallery

    return gallery.filter((item) => item.category === selectedCategory)
  }, [gallery, selectedCategory])

  if (error) {
    return (
      <div className="section-container py-14 text-center">
        <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-100 bg-white p-7 shadow-sm">
          <Images className="mx-auto h-8 w-8 text-reunion-gold" />
          <h1 className="font-serif text-2xl font-bold text-reunion-ink">Không tải được album kỷ niệm</h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Vui lòng kiểm tra PocketBase và quyền xem collection `gallery`.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-reunion-paper">
      <section className="page-hero">
        <div className="section-container grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="max-w-3xl space-y-3 lg:col-span-8">
            <span className="eyebrow">Album kỷ niệm</span>
            <h1 className="font-serif text-4xl font-bold leading-tight text-reunion-ink md:text-5xl">
              Những khung hình còn ở lại
            </h1>
            <p className="max-w-2xl font-serif text-base italic leading-relaxed text-slate-500 md:text-lg">
              Sân trường, chuyến đi cuối cấp và những lần hội ngộ được gom lại thành một cuốn album chung của lớp.
            </p>
          </div>

          <div className="lg:col-span-4">
            <GalleryHeroPreview gallery={gallery} isLoading={isLoading} />
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-container">
          <div className="filter-panel flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl space-y-3">
              <div className="flex items-center gap-3 text-reunion-gold">
                <ImageIcon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Thư viện ảnh</span>
              </div>
              <p className="font-serif italic leading-relaxed text-slate-500">
                Chọn từng nhóm ảnh để xem lại những lát cắt khác nhau của ký ức.
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-10 w-24 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-md border px-4 text-[10px] font-bold uppercase tracking-widest transition',
                      selectedCategory === option.value
                        ? 'border-reunion-forest bg-reunion-forest text-white'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-reunion-gold hover:text-reunion-forest'
                    )}
                    onClick={() => setSelectedCategory(option.value)}
                  >
                    {option.label}
                    <span className={cn('text-[9px]', selectedCategory === option.value ? 'text-white/70' : 'text-slate-300')}>
                      {countGallery(gallery, option.value)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <GallerySkeleton />
          ) : visibleGallery.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleGallery.map((item, index) => (
                <GalleryCard key={item.id} item={item} featured={index % 5 === 0} />
              ))}
            </div>
          ) : (
            <EmptyGallery selectedCategory={selectedCategory} />
          )}
        </div>
      </section>
    </div>
  )
}

function GalleryCard({ item, featured }: { item: GalleryItem; featured: boolean }) {
  const imageUrl = getFileUrl('gallery', item.id, item.image)
  const category = categoryLabels[item.category] ?? 'Kỷ niệm'
  const caption = item.caption || 'Ảnh kỷ niệm của lớp'

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={cn(
            'journal-card group cursor-pointer border-2 border-slate-50 bg-white text-left',
            featured && 'sm:col-span-2'
          )}
        >
          <div className={cn('relative overflow-hidden bg-slate-100', featured ? 'aspect-[16/10]' : 'aspect-[4/3]')}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={caption}
                className="h-full w-full object-cover grayscale-[0.15] transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-14 w-14 text-slate-200" />
              </div>
            )}
            <div className="absolute top-4 right-4 border border-slate-100 bg-white/90 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-reunion-forest opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100">
              Phóng to
            </div>
          </div>
          <div className="space-y-2 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-reunion-gold">{category}</p>
            <h3 className="font-serif text-lg font-bold leading-snug text-reunion-ink transition-colors group-hover:text-reunion-forest">
              {caption}
            </h3>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="inline-flex w-auto max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden rounded-xl border-none bg-white p-0 shadow-2xl [&>button]:right-3 [&>button]:top-3 [&>button]:bg-white/90 [&>button]:text-reunion-ink [&>button]:shadow-sm">
        <div className="flex max-h-[calc(100vh-1.5rem)] flex-col overflow-hidden">
          <div className="flex min-h-64 items-center justify-center bg-slate-950">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={caption}
                className="block h-auto max-h-[calc(100vh-9.5rem)] max-w-[calc(100vw-1.5rem)] object-contain"
              />
            ) : (
              <div className="flex h-80 w-80 max-w-[calc(100vw-1.5rem)] items-center justify-center">
                <ImageIcon className="h-16 w-16 text-white/20" />
              </div>
            )}
          </div>
          <div className="space-y-2 border-t border-slate-100 bg-white p-4 sm:p-5">
            <span className="eyebrow">{category}</span>
            <DialogTitle className="font-serif text-xl font-bold leading-snug text-reunion-ink sm:text-2xl">
              {caption}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Ảnh kỷ niệm thuộc nhóm {category}
            </DialogDescription>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function GalleryHeroPreview({
  gallery,
  isLoading,
}: {
  gallery: GalleryItem[] | undefined
  isLoading?: boolean
}) {
  const previewItems = gallery?.slice(0, 3) ?? []

  return (
    <div className="soft-panel overflow-hidden p-3">
      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="aspect-[3/4] rounded-md" />
          ))}
        </div>
      ) : previewItems.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {previewItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'relative overflow-hidden rounded-md bg-slate-100 shadow-sm',
                index === 1 ? 'mt-5 aspect-[3/4]' : 'aspect-[3/4]'
              )}
            >
              <img
                src={getFileUrl('gallery', item.id, item.image)}
                alt={item.caption || 'Kỷ niệm'}
                className="h-full w-full object-cover grayscale-[0.15]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-reunion-ink/45 to-transparent" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-36 flex-col justify-end rounded-md bg-reunion-forest p-5 text-white">
          <Images className="mb-4 h-6 w-6 text-reunion-gold" />
          <p className="font-serif text-lg italic leading-relaxed">
            Mỗi tấm ảnh là một mảnh ký ức đang chờ được đặt vào album chung.
          </p>
        </div>
      )}
    </div>
  )
}

function EmptyGallery({ selectedCategory }: { selectedCategory: GalleryFilter }) {
  const category = selectedCategory === 'all' ? '' : ` thuộc nhóm ${filterOptions.find((item) => item.value === selectedCategory)?.label}`

  return (
    <div className="py-14 text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-dashed border-slate-200 bg-white/70 p-7">
        <Images className="mx-auto h-8 w-8 text-slate-300" />
        <p className="font-serif italic text-slate-400">
          Chưa có ảnh kỷ niệm{category} được cập nhật.
        </p>
      </div>
    </div>
  )
}

function countGallery(gallery: GalleryItem[] | undefined, category: GalleryFilter) {
  if (!gallery) return 0
  if (category === 'all') return gallery.length

  return gallery.filter((item) => item.category === category).length
}
