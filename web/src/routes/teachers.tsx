import { useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import { BookOpen, GraduationCap, Heart } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { useTeachers } from "@/hooks/useTeachers";
import { getFileUrl } from "@/lib/pocketbase";
import { normalizeText } from "@/lib/utils";
import { seo } from "@/lib/seo";
import type { Teacher } from "@/types";

const tributeQuotes = [
  "Ơn Thầy Cô là ngọn đèn lặng lẽ, soi chúng em qua những năm tháng đầu đời.",
  "Có những bài học không nằm trong vở, nhưng theo chúng em đến tận hôm nay.",
  "Một lời giảng năm xưa, một ánh mắt hiền từ, vẫn còn ấm trong ký ức.",
  "Thầy Cô gieo hạt mầm tử tế, để chúng em lớn lên bằng lòng biết ơn.",
  "Nhờ Thầy Cô, những ngày vụng dại năm ấy trở thành hành trang dịu dàng.",
  "Có những tiếng gọi bảng, nhắc lại thôi cũng thấy cả lớp học ùa về.",
  "Thầy Cô đã dạy chúng em cách lớn lên, bằng tri thức và bằng yêu thương.",
  "Bao năm đi xa, chúng em vẫn nhớ dáng Thầy Cô bên bục giảng cũ.",
];

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: seo({
      title: "Thầy Cô",
      description:
        "Trang tri ân Thầy Cô, lưu giữ thông tin giảng dạy và những lời nhắn biết ơn.",
    }),
  }),
  component: TeachersPage,
});

function TeachersPage() {
  const matchRoute = useMatchRoute();
  const { data: teachers, isLoading, error } = useTeachers();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);
  const isDetailRoute = Boolean(matchRoute({ to: "/teachers/$teacherId" }));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsQuoteVisible(false);
      window.setTimeout(() => {
        setQuoteIndex((current) => (current + 1) % tributeQuotes.length);
        setIsQuoteVisible(true);
      }, 450);
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  if (isDetailRoute) {
    return <Outlet />;
  }

  if (error) {
    return (
      <div className="section-container py-14 text-center">
        <div className="mx-auto max-w-md space-y-4 rounded-lg border border-red-100 bg-white p-7 shadow-sm">
          <GraduationCap className="mx-auto h-8 w-8 text-reunion-gold" />
          <h1 className="font-serif text-2xl font-bold text-reunion-ink">
            Không tải được danh sách Thầy Cô
          </h1>
          <p className="text-sm leading-relaxed text-slate-500">
            Vui lòng kiểm tra lại PocketBase hoặc cấu hình
            `VITE_POCKETBASE_URL`.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <TeachersListSkeleton />;
  }

  if (!teachers?.length) {
    return <EmptyTeachers />;
  }

  return (
    <div className="bg-reunion-paper">
      <section className="page-hero">
        <div className="section-container grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="max-w-3xl space-y-3 lg:col-span-8">
            <span className="eyebrow">Ân sư trọng đạo</span>
            <h1 className="font-serif text-4xl font-bold leading-tight text-reunion-ink md:text-5xl">
              Người lái đò thầm lặng
            </h1>
            <p className="max-w-2xl font-serif text-base italic leading-relaxed text-slate-500 md:text-lg">
              Một chữ cũng là thầy, nửa chữ cũng là thầy. Những bài học năm xưa
              vẫn còn vang vọng tới hôm nay.
            </p>
          </div>

          <div className="soft-panel relative overflow-hidden p-6 md:p-7 lg:col-span-4">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full border border-reunion-gold/20" />
            <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.28em] text-reunion-gold">
              Tri ân
            </span>
            <p
              className={`min-h-[5.25rem] font-serif text-lg italic leading-relaxed text-reunion-sepia transition-all duration-500 md:min-h-[5.5rem] md:text-xl ${
                isQuoteVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0"
              }`}
            >
              "{tributeQuotes[quoteIndex]}"
            </p>
          </div>
        </div>
      </section>

      <section>
        {teachers.map((teacher, index) => (
          <TeacherSection
            key={teacher.id}
            teacher={teacher}
            index={index}
            total={teachers.length}
            variant={index % 2 === 0 ? "paper" : "white"}
          />
        ))}
      </section>
    </div>
  );
}

function TeacherSection({
  teacher,
  index,
  total,
  variant,
}: {
  teacher: Teacher;
  index: number;
  total: number;
  variant: "paper" | "white";
}) {
  const avatarUrl = getFileUrl("teachers", teacher.id, teacher.avatar);
  const subject = teacher.subject?.trim() || "Đang cập nhật môn học";
  const period = teacher.period?.trim() || "Đang cập nhật giai đoạn";
  const tribute =
    normalizeText(teacher.tribute) || "Lời tri ân đang được cập nhật...";
  const initial = teacher.name.trim().substring(0, 1) || "T";

  return (
    <section
      className={`${
        variant === "paper" ? "bg-reunion-paper" : "bg-white/70"
      } py-10 md:py-14`}
    >
      <div className="section-container w-full">
        <div className="mb-5 md:mb-6">
          <div className="w-fit rounded-full border border-reunion-gold/20 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <Link
              to="/teachers/$teacherId"
              params={{ teacherId: teacher.id }}
              className="group block overflow-hidden rounded-lg border-4 border-white bg-slate-100 shadow-xl md:border-8 lg:max-h-[68svh]"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={teacher.name}
                  className="aspect-[4/5] h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center text-8xl font-serif font-bold text-slate-200">
                  {initial}
                </div>
              )}
            </Link>
          </div>

          <div className="flex flex-col justify-center space-y-5 lg:col-span-7 lg:space-y-6">
            <div className="max-w-3xl space-y-3 md:space-y-4">
              <span className="eyebrow">{subject}</span>
              <h2 className="font-serif text-4xl font-bold leading-tight text-reunion-ink md:text-6xl lg:text-7xl">
                {teacher.name}
              </h2>
              <div className="h-1 w-16 bg-reunion-gold" />
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-600 md:gap-4">
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
              <p className="pl-3 font-serif text-lg italic leading-relaxed text-slate-600 md:text-2xl lg:text-3xl">
                "{tribute}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TeachersListSkeleton() {
  return (
    <div className="section-container grid min-h-[calc(100svh-5rem)] grid-cols-1 gap-8 py-12 lg:grid-cols-12 lg:items-center">
      <Skeleton className="aspect-[4/5] rounded-lg lg:col-span-5" />
      <div className="space-y-6 lg:col-span-7">
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-20 w-3/4 rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    </div>
  );
}

function EmptyTeachers() {
  return (
    <div className="section-container py-14 text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-dashed border-slate-200 bg-white/70 p-7">
        <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
        <p className="font-serif italic text-slate-400">
          Chưa có dữ liệu Thầy Cô nào được cập nhật.
        </p>
      </div>
    </div>
  );
}
