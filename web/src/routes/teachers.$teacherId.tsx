import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeacherDetail } from "@/hooks/useTeachers";
import { getFileUrl } from "@/lib/pocketbase";
import { normalizeText } from "@/lib/utils";
import { seo } from "@/lib/seo";
import { TargetFeelingsBox } from "@/components/target-feelings-box";

export const Route = createFileRoute("/teachers/$teacherId")({
  head: () => ({
    meta: seo({
      title: "Chi tiết Thầy Cô",
      description: "Trang check-in và gửi lời tri ân cho từng Thầy Cô.",
    }),
  }),
  component: TeacherDetailPage,
});

function TeacherDetailPage() {
  const { teacherId } = Route.useParams();

  const {
    data: teacher,
    isLoading,
    error,
  } = useTeacherDetail(teacherId);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !teacher) {
    return <NotFoundState />;
  }

  const avatarUrl = getFileUrl("teachers", teacher.id, teacher.avatar);
  const subject = teacher.subject?.trim() || "Đang cập nhật môn học";
  const period = teacher.period?.trim() || "Đang cập nhật giai đoạn";
  const tribute =
    normalizeText(teacher.tribute) || "Lời tri ân đang được cập nhật...";
  const initial = teacher.name.trim().substring(0, 1) || "T";

  return (
    <div className="flex min-h-screen flex-col">
      <section className="flex min-h-[calc(100svh-5rem)] items-center bg-white/70 py-8 md:py-10">
        <div className="section-container">
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-lg border-4 border-white bg-slate-100 shadow-xl md:border-8 lg:max-h-[72svh]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={teacher.name}
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
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
                <div
                  className="pl-3 font-serif text-xl italic leading-relaxed text-slate-600 md:text-3xl"
                  dangerouslySetInnerHTML={{ __html: tribute }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <TargetFeelingsBox
        targetId={teacher.id}
        targetType="teacher"
        title={`Lưu bút viết về ${teacher.name}`}
        emptyMessage="Chưa có lưu bút nào viết riêng cho Thầy Cô."
      />
    </div>
  );
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
  );
}

function NotFoundState() {
  return (
    <div className="section-container py-14 text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-dashed border-slate-200 bg-white/70 p-7">
        <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
        <h1 className="font-serif text-2xl font-bold text-reunion-ink">
          Không tìm thấy Thầy Cô
        </h1>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-md text-[10px] font-bold uppercase tracking-widest"
        >
          <Link to="/teachers">Về danh sách Thầy Cô</Link>
        </Button>
      </div>
    </div>
  );
}
