import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import Autoplay from 'embla-carousel-autoplay'
import { getMemberClassName } from '@/lib/members'
import { getFileUrl } from '@/lib/pocketbase'
import { normalizeText } from '@/lib/utils'
import { useFeelings } from '@/hooks/useFeelings'
import { useGallery } from '@/hooks/useGallery'
import { useMembers } from '@/hooks/useMembers'
import { useStats } from '@/hooks/useStats'
import { useTeachers } from '@/hooks/useTeachers'
import { seo } from '@/lib/seo'
import { ArrowRight, MessageSquareQuote, PenLine } from 'lucide-react'
import type { Feeling, Member, Teacher } from '@/types'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: seo({
      description:
        'Trang chủ họp lớp Giao Lộ Khối 9 với bạn bè, thầy cô, ảnh kỷ niệm, lưu bút và thông tin xác nhận tham gia.',
    }),
  }),
  component: HomeComponent,
})

function HomeComponent() {
  const { data: stats, isLoading: isLoadingStats } = useStats()
  const { data: members, isLoading: isLoadingMembers } = useMembers()
  const { data: teachers, isLoading: isLoadingTeachers } = useTeachers()
  const { data: feelings, isLoading: isLoadingFeelings } = useFeelings()
  const { data: gallery, isLoading: isLoadingGallery } = useGallery()

  const previewMembers = members?.slice(0, 4) ?? []
  const previewTeachers = teachers?.slice(0, 4) ?? []
  const latestFeelings = feelings?.slice(0, 12) ?? []
  const sliderImages = gallery?.slice(0, 6) ?? []

  const autoplayPlugin = Autoplay({ delay: 4000, stopOnInteraction: false })

  return (
    <div className="flex flex-col">
      <section className="page-hero relative overflow-hidden">
        <div className="section-container grid grid-cols-1 items-center gap-10 lg:grid-cols-12 md:gap-12">
          <div className="relative z-10 space-y-6 md:space-y-8 lg:col-span-6">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-6 md:w-8 bg-reunion-gold"></span>
                <span className="eyebrow mb-0 text-[10px] md:text-[11px]">Hành trình hồi ức</span>
              </div>
              <h1 className="heading-hero text-4xl md:text-5xl lg:text-6xl">
                Gặp lại để nhớ, <br />
                <span className="heading-hero-italic">để kể, để cười</span> <br />
                như ngày xưa.
              </h1>
            </div>

            <p className="max-w-xl text-base md:text-lg font-serif italic leading-relaxed text-slate-500">
              Một không gian nhỏ để chúng mình cùng lật lại những trang lưu bút,
              tìm lại nụ cười của bạn bè và ánh mắt hiền từ của thầy cô năm ấy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 md:pt-4">
              <Button asChild className="h-12 rounded-none bg-reunion-forest px-7 text-xs font-bold uppercase tracking-widest text-white transition-all hover:translate-x-1 hover:bg-emerald-900">
                <Link to="/members">Xem thành viên</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-none border-2 border-reunion-forest px-7 text-xs font-bold uppercase tracking-widest text-reunion-forest transition-all hover:bg-reunion-forest hover:text-white">
                <Link to="/feelings">Viết lời nhắn</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-5 pt-4 md:gap-8 md:pt-6">
              <HeroStat value={stats?.membersCount?.toString() || '0'} label="Thành viên" isLoading={isLoadingStats} />
              <HeroDivider />
              <HeroStat value={stats?.teachersCount?.toString() || '0'} label="Thầy cô" isLoading={isLoadingStats} />
              <HeroDivider />
              <HeroStat value={stats?.rsvpsCount?.toString() || '0'} label="Xác nhận" isLoading={isLoadingStats} />
            </div>
          </div>

          <div className="relative lg:col-span-6">
            <div className="relative z-10 flex min-h-[340px] md:min-h-[500px] flex-col overflow-hidden rounded-lg border-8 md:border-[10px] border-white bg-reunion-forest shadow-xl">
              <Carousel
                plugins={[autoplayPlugin]}
                className="h-full w-full"
                opts={{
                  loop: true,
                }}
              >
                <CarouselContent className="h-[324px] md:h-[480px]">
                  {isLoadingGallery ? (
                    <CarouselItem className="relative h-full w-full bg-white">
                      <Skeleton className="h-full w-full rounded-none" />
                    </CarouselItem>
                  ) : sliderImages.length > 0 ? (
                    sliderImages.map((item) => (
                      <CarouselItem key={item.id} className="relative h-full w-full">
                        <img
                          src={getFileUrl('gallery', item.id, item.image)}
                          alt={item.caption || 'Kỷ niệm'}
                          className="h-full w-full object-cover grayscale-[0.2] transition-transform ease-linear hover:scale-110"
                          style={{ transitionDuration: '4s' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-reunion-forest/80 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8">
                          <p className="font-serif text-xs md:text-sm italic leading-relaxed text-white/90 line-clamp-3 md:line-clamp-none">
                            {item.caption || "Có những mùa hè không bao giờ kết thúc trong tim mỗi chúng ta."}
                          </p>
                        </div>
                      </CarouselItem>
                    ))
                  ) : (
                    <CarouselItem className="relative h-full w-full bg-reunion-forest p-7 md:p-8 text-white">
                      <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                      <div className="relative z-10 flex h-full flex-col justify-end space-y-4 md:space-y-6">
                        <div className="h-1 w-12 md:w-16 bg-reunion-gold" />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] text-reunion-gold">Album kỷ niệm</span>
                        <h3 className="text-3xl md:text-5xl font-serif font-bold italic leading-tight">
                          Học trò <br /> năm ấy
                        </h3>
                        <p className="max-w-xs text-xs md:text-sm font-serif italic leading-relaxed opacity-80">
                          "Có những mùa hè không bao giờ kết thúc trong tim mỗi chúng ta."
                        </p>
                        <AvatarStack members={previewMembers} total={stats?.membersCount ?? 0} />
                      </div>
                    </CarouselItem>
                  )}
                </CarouselContent>
              </Carousel>

              <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 md:px-4 md:py-1.5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                <div className="h-1.5 w-1.5 rounded-full bg-reunion-gold animate-pulse" />
                Live Memories
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white content-section">
        <div className="section-container">
          <SectionHeader
            eyebrow="Danh sách"
            title="Bạn bè trong lớp"
            description="Một vài gương mặt trong hành trình, lấy trực tiếp từ dữ liệu bạn bè."
            to="/members"
            action="Xem tất cả"
          />

          {isLoadingMembers ? (
            <PreviewSkeleton />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {previewMembers.map((member) => (
                <MemberPreviewCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white/60 content-section">
        <div className="section-container">
          <SectionHeader
            eyebrow="Tri ân"
            title="Thầy cô"
            description="Những lời tri ân dành cho các thầy cô đã dìu dắt chúng mình những năm tháng cũ."
            to="/teachers"
            action="Xem tri ân"
          />

          {isLoadingTeachers ? (
            <PreviewSkeleton />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {previewTeachers.map((teacher) => (
                <TeacherPreviewCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden content-section">
        <div className="section-container mb-6 md:mb-8">
          <SectionHeader
            eyebrow="Lưu bút"
            title="Những lời nhắn mới nhất"
            description="Một dòng chảy nhỏ của các lời nhắn đã duyệt, cập nhật từ trang lưu bút."
            to="/feelings"
            action="Viết lời nhắn"
          />
        </div>

        {isLoadingFeelings ? (
          <FeelingMarqueeSkeleton />
        ) : latestFeelings.length > 0 ? (
          <div className="space-y-4 md:space-y-5">
            <FeelingMarquee feelings={latestFeelings} direction="left" />
            <FeelingMarquee feelings={[...latestFeelings].reverse()} direction="right" />
          </div>
        ) : (
          <div className="section-container">
            <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-6 md:p-8 text-center">
              <MessageSquareQuote className="mx-auto mb-4 h-8 w-8 md:h-10 md:w-10 text-slate-300" />
              <p className="font-serif italic text-sm md:text-base text-slate-400">Chưa có lời nhắn nào được duyệt.</p>
            </div>
          </div>
        )}
      </section>

      <section className="py-6 md:py-8">
        <div className="section-container">
          <div className="grid grid-cols-1 items-center gap-7 border-y border-reunion-gold/20 py-10 md:gap-8 md:py-12 lg:grid-cols-12">
            <div className="space-y-4 md:space-y-5 lg:col-span-8">
              <span className="eyebrow">Gửi một dòng hồi ức</span>
              <h2 className="text-3xl font-serif font-bold text-reunion-ink md:text-4xl">
                Có điều gì muốn nhắn tới lớp, bạn bè hay thầy cô?
              </h2>
              <p className="max-w-2xl font-serif italic text-sm md:text-base leading-relaxed text-slate-500">
                Form lưu bút đầy đủ nằm ở trang riêng để bạn chọn người nhận, viết nội dung và gửi vào hàng chờ duyệt.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:justify-end">
              <Button asChild className="h-12 rounded-none bg-reunion-forest px-7 text-xs font-bold uppercase tracking-widest text-white hover:bg-emerald-900">
                <Link to="/feelings">
                  <PenLine className="h-4 w-4" />
                  Mở trang lưu bút
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 bg-white/50 content-section">
        <div className="section-container">
          <div className="mb-8 md:mb-10 text-center">
            <span className="eyebrow">Thống kê hành trình</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-reunion-ink">Những con số biết nói</h2>
          </div>
          
          <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-5 md:divide-y-0 md:divide-x">
            <SummaryItem value={stats?.membersCount?.toString() || '0'} label="Thành viên đã nhập" isLoading={isLoadingStats} />
            <SummaryItem value={stats?.teachersCount?.toString() || '0'} label="Thầy cô tri ân" isLoading={isLoadingStats} />
            <SummaryItem value={stats?.feelingsCount?.toString() || '0'} label="Lưu bút đã duyệt" isLoading={isLoadingStats} />
            <SummaryItem value={stats?.galleryCount?.toString() || '0'} label="Ảnh kỷ niệm" isLoading={isLoadingStats} />
            <SummaryItem value={stats?.rsvpsCount?.toString() || '0'} label="Đã xác nhận" isLoading={isLoadingStats} />
          </div>

          <div className="mt-10 md:mt-12 flex justify-center">
            <Button asChild className="h-12 md:h-14 rounded-none bg-reunion-forest px-8 md:px-10 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-emerald-900 active:scale-95">
              <Link to="/rsvp">
                Tham gia họp lớp ngay
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function HeroStat({ value, label, isLoading }: { value: string; label: string; isLoading?: boolean }) {
  return (
    <div>
      {isLoading ? (
        <Skeleton className="mb-2 h-10 w-16 rounded-md" />
      ) : (
        <div className="text-3xl md:text-4xl font-serif font-bold text-reunion-forest">{value}</div>
      )}
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
    </div>
  )
}

function HeroDivider() {
  return <div className="hidden h-12 w-px bg-slate-100 sm:block" />
}

function SummaryItem({ value, label, isLoading }: { value: string; label: string; isLoading?: boolean }) {
  return (
    <div className="px-5 py-7 text-center">
      {isLoading ? (
        <Skeleton className="mx-auto mb-4 h-12 w-20 rounded-md" />
      ) : (
        <div className="mb-2 text-4xl font-serif font-bold text-reunion-ink">{value}</div>
      )}
      <div className="text-[10px] font-bold uppercase leading-relaxed tracking-[0.24em] text-slate-400">{label}</div>
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
  to,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  to: '/members' | '/teachers' | '/feelings'
  action: string
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:mb-10">
      <div className="max-w-2xl space-y-3">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="text-3xl font-serif font-bold text-reunion-ink md:text-4xl">{title}</h2>
        <div className="h-1 w-12 bg-reunion-gold"></div>
        <p className="font-serif italic leading-relaxed text-slate-500">{description}</p>
      </div>
      <Button asChild variant="outline" className="h-10 rounded-md border-slate-200 px-6 text-[10px] font-bold uppercase tracking-widest">
        <Link to={to}>
          {action}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  )
}

function PreviewSkeleton() {
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

function FeelingMarqueeSkeleton() {
  return (
    <div className="space-y-4 md:space-y-5">
      {[1, 2].map((row) => (
        <div key={row} className="flex gap-5 overflow-hidden px-6 md:px-8">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="w-72 shrink-0 rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
              <Skeleton className="mb-4 h-5 w-1/2" />
              <Skeleton className="mb-3 h-4 w-full" />
              <Skeleton className="mb-3 h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function MemberPreviewCard({ member }: { member: Member }) {
  const thumbUrl = getFileUrl('members', member.id, member.thumb)
  const initial = member.name.trim().substring(0, 1) || 'B'

  return (
    <Link to="/members" className="journal-card group block cursor-pointer border-2 border-slate-50 text-left">
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={member.name}
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
      <div className="space-y-2 p-5">
        <h3 className="font-serif text-lg font-bold text-reunion-ink transition-colors group-hover:text-reunion-forest">
          {member.name}
        </h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-reunion-gold">
          {getMemberClassName(member, 'Lớp 9A')}
        </p>
      </div>
    </Link>
  )
}

function TeacherPreviewCard({ teacher }: { teacher: Teacher }) {
  const avatarUrl = getFileUrl('teachers', teacher.id, teacher.avatar)
  const initial = teacher.name.trim().substring(0, 1) || 'T'

  return (
    <Link to="/teachers" className="journal-card group block cursor-pointer border-2 border-slate-50 text-left">
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
      <div className="space-y-2 p-5">
        <h3 className="font-serif text-lg font-bold text-reunion-ink transition-colors group-hover:text-reunion-forest">
          {teacher.name}
        </h3>
        <p className="text-[10px] font-bold uppercase tracking-widest text-reunion-gold">
          {teacher.subject || 'Đang cập nhật'}
        </p>
      </div>
    </Link>
  )
}

function FeelingMarquee({
  feelings,
  direction,
}: {
  feelings: Feeling[]
  direction: 'left' | 'right'
}) {
  const loopItems = feelings.length > 0 ? [...feelings, ...feelings] : []

  return (
    <div className="home-marquee">
      <div className={direction === 'left' ? 'home-marquee-track' : 'home-marquee-track home-marquee-track-reverse'}>
        {loopItems.map((feeling, index) => (
          <FeelingPreviewCard key={`${feeling.id}-${index}`} feeling={feeling} />
        ))}
      </div>
    </div>
  )
}

function FeelingPreviewCard({ feeling }: { feeling: Feeling }) {
  return (
    <Link
      to="/feelings"
      className="w-72 shrink-0 rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-reunion-gold/30"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-base font-bold text-reunion-ink">{feeling.author_name}</h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-reunion-gold">
            {getFeelingTarget(feeling)}
          </p>
        </div>
        <MessageSquareQuote className="h-5 w-5 text-reunion-gold/60" />
      </div>
      <p className="line-clamp-4 font-serif text-sm italic leading-relaxed text-slate-600">
        "{normalizeText(feeling.content)}"
      </p>
    </Link>
  )
}

function AvatarStack({ members, total }: { members: Member[]; total: number }) {
  return (
    <div className="flex -space-x-3 pt-4">
      {members.slice(0, 4).map((member) => {
        const thumbUrl = getFileUrl('members', member.id, member.thumb)
        const initial = member.name.trim().substring(0, 1) || 'B'

        return (
          <div key={member.id} className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-reunion-forest bg-slate-200 text-sm font-bold text-reunion-forest">
            {thumbUrl ? <img src={thumbUrl} alt={member.name} className="h-full w-full object-cover" /> : initial}
          </div>
        )
      })}
      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-reunion-forest bg-reunion-gold text-xs font-bold text-white">
        +{Math.max(total - members.length, 0)}
      </div>
    </div>
  )
}

function getFeelingTarget(feeling: Feeling) {
  if (feeling.target_type === 'teacher') {
    return feeling.expand?.teacher_target?.name ? `Gửi ${feeling.expand.teacher_target.name}` : 'Gửi thầy cô'
  }

  if (feeling.target_type === 'member') {
    return feeling.expand?.member_target?.name ? `Gửi ${feeling.expand.member_target.name}` : 'Gửi bạn bè'
  }

  return 'Gửi cả lớp'
}
