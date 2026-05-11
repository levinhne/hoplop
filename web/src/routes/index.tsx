import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMemberClassName } from "@/lib/members";
import { getFileUrl } from "@/lib/pocketbase";
import { normalizeText } from "@/lib/utils";
import { useFeelings } from "@/hooks/useFeelings";
import { useGallery } from "@/hooks/useGallery";
import { useMembers } from "@/hooks/useMembers";
import { useStats } from "@/hooks/useStats";
import { useTeachers } from "@/hooks/useTeachers";
import { seo } from "@/lib/seo";
import {
  ArrowRight,
  ImagePlus,
  MessageSquareQuote,
  PenLine,
} from "lucide-react";
import type { Feeling, Member, Teacher } from "@/types";

const heroTypingLines = [
  "Ngày ấy chúng ta ngồi chung một lớp.",
  "Tiếng trống năm ấy vẫn còn vang đâu đó trong tim.",
  "Có những người bạn, lâu không gặp nhưng chưa từng xa.",
  "Mỗi nụ cười hôm nay là một mảnh thanh xuân quay về.",
  "Gặp lại không chỉ để nhớ, mà để thương nhau thêm một lần nữa.",
  "Có một thời áo trắng, đi qua rồi vẫn sáng trong ký ức.",
  "Sân trường cũ, hàng ghế cũ, và những cái tên chưa bao giờ cũ.",
  "Gặp lại nhau để biết rằng, năm tháng đã đi qua rất dịu dàng.",
  "Ngày ấy đi học là để học, nhưng nhớ nhất vẫn là để gặp nhau.",
  "Có những cái tên chỉ cần nhắc lại, cả một thời áo trắng ùa về.",
  "Thanh xuân không quay lại, nhưng kỷ niệm thì vẫn biết đường trở về.",
  "Một lần gặp lại, đủ để những năm tháng cũ mỉm cười.",
  "Chúng ta từng chung một lớp, rồi cùng giữ một góc trời ký ức.",
  "Những trò nghịch ngợm năm ấy, giờ kể lại vẫn thấy thương.",
  "Có những người bạn cũ, gặp lại vẫn thân như vừa mới hôm qua.",
  "Tiếng cười năm ấy không mất đi, chỉ nằm yên trong tim mỗi người.",
  "Sau bao năm xa cách, điều quý nhất là vẫn còn nhận ra nhau bằng nụ cười.",
  "Mỗi người một hành trình, nhưng ký ức lớp mình vẫn chung một lối về.",
  "Có những buổi tan trường đã xa, nhưng cảm giác chờ nhau vẫn còn rất gần.",
  "Năm tháng làm chúng ta lớn lên, còn kỷ niệm giữ chúng ta lại bên nhau.",
  "Một góc sân, một hàng cây, đủ gọi về cả tuổi học trò.",
  "Bạn cũ gặp lại, câu đầu tiên chưa nói hết mà lòng đã thấy vui.",
  "Có những ngày bình thường năm ấy, bây giờ nhớ lại hóa thành điều quý giá.",
  "Chúng ta đã đi qua tuổi nhỏ cùng nhau, nên ký ức ấy không bao giờ lạc mất.",
  "Hôm nay gặp lại, để thấy thanh xuân vẫn còn nguyên trong ánh mắt mỗi người.",
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: seo({
      description:
        "Trang chủ họp lớp Giao Lộ Khối 9 với bạn bè, Thầy Cô, ảnh kỷ niệm, lưu bút và thông tin xác nhận tham gia.",
    }),
  }),
  component: HomeComponent,
});

function HomeComponent() {
  const { data: stats, isLoading: isLoadingStats } = useStats();
  const { data: members, isLoading: isLoadingMembers } = useMembers();
  const { data: teachers, isLoading: isLoadingTeachers } = useTeachers();
  const { data: feelings, isLoading: isLoadingFeelings } = useFeelings();
  const { data: gallery, isLoading: isLoadingGallery } = useGallery();

  const previewMembers = useMemo(
    () => getRandomItems(members ?? [], 4),
    [members]
  );
  const previewTeachers = teachers?.slice(0, 4) ?? [];
  const latestFeelings = feelings?.slice(0, 12) ?? [];
  const sliderImages = gallery?.slice(0, 6) ?? [];
  const typedHeroLine = useTypingLoop(heroTypingLines);
  const showHeroActions = useShowAfterScrollRatio(1 / 5);
  const activeSlideIndex = useHeroSlideIndex(sliderImages.length);

  return (
    <div className="flex flex-col">
      <section className="home-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-reunion-forest">
          {isLoadingGallery ? (
            <Skeleton className="h-full w-full rounded-none bg-reunion-forest/80" />
          ) : sliderImages.length > 0 ? (
            sliderImages.map((item, index) => {
              const isActive = index === activeSlideIndex;

              return (
                <div
                  key={item.id}
                  className="hero-crossfade-slide absolute inset-0"
                  data-active={isActive}
                  aria-hidden={!isActive}
                >
                  <img
                    src={getFileUrl("gallery", item.id, item.image)}
                    alt={item.caption || "Kỷ niệm"}
                    className="hero-crossfade-image h-full w-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-reunion-forest/95 via-reunion-forest/68 to-reunion-ink/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-reunion-ink/65 via-transparent to-reunion-ink/25" />
                </div>
              );
            })
          ) : (
            <div className="relative h-full overflow-hidden bg-reunion-forest">
              <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-reunion-forest via-reunion-ink to-reunion-wine/80" />
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-reunion-paper/35 to-transparent" />

        <div className="section-container relative z-20 flex min-h-[100svh] flex-col justify-center pb-12 pt-24 md:pb-16 md:pt-32">
          <div className="max-w-4xl space-y-6 md:space-y-8">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-6 md:w-8 bg-reunion-gold"></span>
                <span className="eyebrow mb-0 text-[10px] text-reunion-gold md:text-[11px]">
                  Hành trình hồi ức
                </span>
              </div>
              <h1 className="heading-hero max-w-3xl text-4xl text-white drop-shadow-lg md:text-6xl lg:text-7xl">
                Gặp lại để nhớ, <br />
                <span className="heading-hero-italic text-reunion-gold">
                  để kể, để cười
                </span>{" "}
                <br />
                như ngày xưa.
              </h1>
            </div>

            <p className="max-w-2xl text-base font-serif italic leading-relaxed text-white/80 md:text-xl">
              Một không gian nhỏ để chúng mình cùng lật lại những trang lưu bút,
              tìm lại nụ cười của bạn bè và ánh mắt hiền từ của Thầy Cô năm ấy.
            </p>

            <div className="hero-typing min-h-[6.75rem] max-w-3xl font-serif text-2xl font-semibold italic leading-snug text-white md:min-h-[6.5rem] md:text-4xl">
              <span>{typedHeroLine}</span>
              <span className="hero-typing-caret" aria-hidden="true" />
            </div>

            <div
              className={`flex flex-col gap-3 pt-1 transition-all duration-700 ease-out sm:flex-row md:pt-2 ${
                showHeroActions
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-5 opacity-0"
              }`}
              aria-hidden={!showHeroActions}
            >
              <Button
                asChild
                className="h-11 rounded-md bg-reunion-gold px-6 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:translate-x-1 hover:bg-[#9a7947]"
              >
                <Link to="/members">Xem thành viên</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-md border-2 border-white/80 bg-white/10 px-6 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-sm transition-all hover:bg-white hover:text-reunion-forest"
              >
                <Link to="/feelings">Viết lời nhắn</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-md border-2 border-white/80 bg-white/10 px-6 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-sm transition-all hover:bg-white hover:text-reunion-forest"
              >
                <Link to="/avatar">Tạo avatar</Link>
              </Button>
            </div>

            <div
              className={`flex flex-wrap gap-4 pt-2 transition-all duration-700 ease-out md:gap-6 md:pt-3 ${
                showHeroActions
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-5 opacity-0"
              }`}
              aria-hidden={!showHeroActions}
            >
              <HeroStat
                value={stats?.membersCount?.toString() || "0"}
                label="Thành viên"
                isLoading={isLoadingStats}
                variant="light"
              />
              <HeroDivider variant="light" />
              <HeroStat
                value={stats?.teachersCount?.toString() || "0"}
                label="Thầy Cô"
                isLoading={isLoadingStats}
                variant="light"
              />
              <HeroDivider variant="light" />
              <HeroStat
                value={stats?.rsvpsCount?.toString() || "0"}
                label="Xác nhận"
                isLoading={isLoadingStats}
                variant="light"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-reunion-gold/10 bg-reunion-paper content-section">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            title="Thầy Cô"
            description="Những lời tri ân dành cho các Thầy Cô đã dìu dắt chúng mình những năm tháng cũ."
            to="/teachers"
            action="Xem tri ân"
          />

          {isLoadingTeachers ? (
            <PreviewSkeleton />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <FeelingMarquee
              feelings={[...latestFeelings].reverse()}
              direction="right"
            />
          </div>
        ) : (
          <div className="section-container">
            <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-6 md:p-8 text-center">
              <MessageSquareQuote className="mx-auto mb-4 h-8 w-8 md:h-10 md:w-10 text-slate-300" />
              <p className="font-serif italic text-sm md:text-base text-slate-400">
                Chưa có lời nhắn nào được duyệt.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="py-6 md:py-8">
        <div className="section-container">
          <div className="grid grid-cols-1 items-center gap-7 border-y border-reunion-gold/20 py-10 md:gap-8 md:py-12 lg:grid-cols-12">
            <div className="space-y-4 md:space-y-5 lg:col-span-8">
              <span className="eyebrow">Gửi một dấu hiệu gặp lại</span>
              <h2 className="text-3xl font-serif font-bold text-reunion-ink md:text-4xl">
                Đổi avatar và viết một dòng nhắn cho ngày họp lớp.
              </h2>
              <p className="max-w-2xl font-serif italic text-sm md:text-base leading-relaxed text-slate-500">
                Tạo ảnh đại diện có frame Giao Lộ Khối 9, rồi ghé trang lưu bút
                để gửi lời nhắn tới lớp, bạn bè hay Thầy Cô.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:justify-end">
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-md border-reunion-forest px-7 text-xs font-bold uppercase tracking-widest text-reunion-forest hover:bg-reunion-forest hover:text-white"
              >
                <Link to="/avatar">
                  <ImagePlus className="h-4 w-4" />
                  Tạo avatar
                </Link>
              </Button>
              <Button
                asChild
                className="h-12 rounded-md bg-reunion-forest px-7 text-xs font-bold uppercase tracking-widest text-white hover:bg-emerald-900"
              >
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
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-reunion-ink">
              Những con số biết nói
            </h2>
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-100 md:grid-cols-5 md:divide-y-0 md:divide-x">
            <SummaryItem
              value={stats?.membersCount?.toString() || "0"}
              label="Thành viên đã nhập"
              isLoading={isLoadingStats}
            />
            <SummaryItem
              value={stats?.teachersCount?.toString() || "0"}
              label="Thầy Cô tri ân"
              isLoading={isLoadingStats}
            />
            <SummaryItem
              value={stats?.feelingsCount?.toString() || "0"}
              label="Lưu bút đã duyệt"
              isLoading={isLoadingStats}
            />
            <SummaryItem
              value={stats?.galleryCount?.toString() || "0"}
              label="Ảnh kỷ niệm"
              isLoading={isLoadingStats}
            />
            <SummaryItem
              value={stats?.rsvpsCount?.toString() || "0"}
              label="Đã xác nhận"
              isLoading={isLoadingStats}
            />
          </div>

          <div className="mt-10 md:mt-12 flex justify-center">
            <Button
              asChild
              className="h-12 rounded-md bg-reunion-forest px-8 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-emerald-900 active:scale-95 md:h-14 md:px-10"
            >
              <Link to="/rsvp">
                Tham gia họp lớp ngay
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function useTypingLoop(lines: string[]) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentLine = lines[lineIndex] ?? "";
    const isLineComplete = !isDeleting && charIndex === currentLine.length;
    const isLineDeleted = isDeleting && charIndex === 0;
    const delay = isLineComplete ? 9000 : isDeleting ? 28 : 55;

    const timeout = window.setTimeout(() => {
      if (isLineComplete) {
        setIsDeleting(true);
        return;
      }

      if (isLineDeleted) {
        setIsDeleting(false);
        setLineIndex((current) => (current + 1) % lines.length);
        return;
      }

      setCharIndex((current) => current + (isDeleting ? -1 : 1));
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [charIndex, isDeleting, lineIndex, lines]);

  return lines[lineIndex]?.slice(0, charIndex) ?? "";
}

function useShowAfterScrollRatio(ratio: number) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY >= window.innerHeight * ratio);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [ratio]);

  return isVisible;
}

function useHeroSlideIndex(slideCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slideCount <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, 5200);

    return () => window.clearInterval(interval);
  }, [slideCount]);

  return slideCount > 0 ? activeIndex % slideCount : 0;
}

function HeroStat({
  value,
  label,
  isLoading,
  variant = "default",
}: {
  value: string;
  label: string;
  isLoading?: boolean;
  variant?: "default" | "light";
}) {
  const isLight = variant === "light";

  return (
    <div>
      {isLoading ? (
        <Skeleton className="mb-1.5 h-8 w-14 rounded-md bg-white/25" />
      ) : (
        <div
          className={`text-2xl md:text-3xl font-serif font-bold ${
            isLight ? "text-white" : "text-reunion-forest"
          }`}
        >
          {value}
        </div>
      )}
      <div
        className={`mt-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
          isLight ? "text-white/65" : "text-slate-400"
        }`}
      >
        {label}
      </div>
    </div>
  );
}

function HeroDivider({
  variant = "default",
}: {
  variant?: "default" | "light";
}) {
  return (
    <div
      className={`hidden h-10 w-px sm:block ${
        variant === "light" ? "bg-white/25" : "bg-slate-100"
      }`}
    />
  );
}

function SummaryItem({
  value,
  label,
  isLoading,
}: {
  value: string;
  label: string;
  isLoading?: boolean;
}) {
  return (
    <div className="px-5 py-7 text-center">
      {isLoading ? (
        <Skeleton className="mx-auto mb-4 h-12 w-20 rounded-md" />
      ) : (
        <div className="mb-2 text-4xl font-serif font-bold text-reunion-ink">
          {value}
        </div>
      )}
      <div className="text-[10px] font-bold uppercase leading-relaxed tracking-[0.24em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  to,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  to: "/members" | "/teachers" | "/feelings";
  action: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:mb-10">
      <div className="max-w-2xl space-y-3">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="text-3xl font-serif font-bold text-reunion-ink md:text-4xl">
          {title}
        </h2>
        <div className="h-1 w-12 bg-reunion-gold"></div>
        <p className="font-serif italic leading-relaxed text-slate-500">
          {description}
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        className="h-10 rounded-md border-slate-200 px-6 text-[10px] font-bold uppercase tracking-widest"
      >
        <Link to={to}>
          {action}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex overflow-hidden rounded-lg border border-slate-200/70 bg-white"
        >
          <Skeleton className="aspect-[4/5] w-1/2 shrink-0 rounded-none" />
          <div className="flex flex-1 flex-col justify-center space-y-3 p-5 md:p-6">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeelingMarqueeSkeleton() {
  return (
    <div className="space-y-4 md:space-y-5">
      {[1, 2].map((row) => (
        <div key={row} className="flex gap-5 overflow-hidden px-6 md:px-8">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="w-72 shrink-0 rounded-lg border border-slate-100 bg-white p-5 shadow-sm"
            >
              <Skeleton className="mb-4 h-5 w-1/2" />
              <Skeleton className="mb-3 h-4 w-full" />
              <Skeleton className="mb-3 h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function MemberPreviewCard({ member }: { member: Member }) {
  const thumbUrl = getFileUrl("members", member.id, member.thumb);
  const initial = member.name.trim().substring(0, 1) || "B";
  const className = getMemberClassName(member, "Lớp 9A");
  const bio = normalizeText(member.bio) || "Chưa cập nhật đôi dòng giới thiệu.";

  return (
    <Link
      to="/members"
      className="journal-card group flex cursor-pointer border-2 border-slate-50 text-left"
    >
      <div className="relative aspect-[4/5] w-1/2 shrink-0 overflow-hidden bg-slate-100">
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
      <div className="flex min-w-0 flex-1 flex-col justify-center space-y-3 p-5 md:p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-reunion-gold">
          {className}
        </p>
        <h3 className="break-words font-serif text-lg font-bold leading-tight text-reunion-ink transition-colors group-hover:text-reunion-forest md:text-xl">
          {member.name}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">
          {bio}
        </p>
      </div>
    </Link>
  );
}

function TeacherPreviewCard({ teacher }: { teacher: Teacher }) {
  const avatarUrl = getFileUrl("teachers", teacher.id, teacher.avatar);
  const initial = teacher.name.trim().substring(0, 1) || "T";
  const tribute =
    normalizeText(teacher.tribute) || "Lời tri ân đang được cập nhật.";

  return (
    <Link
      to="/teachers"
      className="journal-card group flex cursor-pointer border-2 border-slate-50 text-left"
    >
      <div className="relative aspect-[4/5] w-1/2 shrink-0 overflow-hidden bg-slate-100">
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
      <div className="flex min-w-0 flex-1 flex-col justify-center space-y-3 p-5 md:p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-reunion-gold">
          {teacher.subject || "Đang cập nhật"}
        </p>
        <h3 className="break-words font-serif text-lg font-bold leading-tight text-reunion-ink transition-colors group-hover:text-reunion-forest md:text-xl">
          {teacher.name}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">
          {tribute}
        </p>
      </div>
    </Link>
  );
}

function getRandomItems<T>(items: T[], limit: number) {
  if (items.length <= limit) return items;

  return [...items]
    .map((item) => ({ item, rank: Math.random() }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map(({ item }) => item);
}

function FeelingMarquee({
  feelings,
  direction,
}: {
  feelings: Feeling[];
  direction: "left" | "right";
}) {
  const loopItems = feelings.length > 0 ? [...feelings, ...feelings] : [];

  return (
    <div className="home-marquee">
      <div
        className={
          direction === "left"
            ? "home-marquee-track"
            : "home-marquee-track home-marquee-track-reverse"
        }
      >
        {loopItems.map((feeling, index) => (
          <FeelingPreviewCard
            key={`${feeling.id}-${index}`}
            feeling={feeling}
          />
        ))}
      </div>
    </div>
  );
}

function FeelingPreviewCard({ feeling }: { feeling: Feeling }) {
  return (
    <Link
      to="/feelings"
      className="w-72 shrink-0 rounded-lg border border-slate-100 bg-white p-5 shadow-sm transition hover:border-reunion-gold/30"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-base font-bold text-reunion-ink">
            {feeling.author_name}
          </h3>
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
  );
}

function getFeelingTarget(feeling: Feeling) {
  if (feeling.target_type === "class") {
    return feeling.expand?.class_target?.name
      ? `Gửi lớp ${feeling.expand.class_target.name}`
      : "Gửi cả lớp";
  }

  if (feeling.target_type === "teacher") {
    return feeling.expand?.teacher_target?.name
      ? `Gửi ${feeling.expand.teacher_target.name}`
      : "Gửi Thầy Cô";
  }

  if (feeling.target_type === "member") {
    return feeling.expand?.member_target?.name
      ? `Gửi ${feeling.expand.member_target.name}`
      : "Gửi bạn bè";
  }

  return "Gửi tất cả";
}
