import { Link } from "@tanstack/react-router";
import { MessageSquareQuote, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTargetFeelings } from "@/hooks/useFeelings";
import { normalizeText } from "@/lib/utils";
import type { Feeling } from "@/types";

type TargetFeelingsBoxProps = {
  targetId: string;
  targetType: "member" | "teacher";
  title: string;
  emptyMessage: string;
};

export function TargetFeelingsBox({
  targetId,
  targetType,
  title,
  emptyMessage,
}: TargetFeelingsBoxProps) {
  const {
    data: targetFeelings,
    isLoading,
    error,
  } = useTargetFeelings({
    targetId,
    targetType,
  });

  return (
    <section className="border-t border-reunion-gold/10 bg-white/70 py-10 md:py-12">
      <div className="section-container">
        <div className="soft-panel p-5 md:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="eyebrow">Lưu bút</span>
              <h2 className="font-serif text-3xl font-bold text-reunion-ink md:text-4xl">
                {title}
              </h2>
            </div>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-md text-[10px] font-bold uppercase tracking-widest"
            >
              <Link
                to="/feelings"
                search={{
                  open: true,
                  target_type: targetType,
                  target_id: targetId,
                }}
              >
                Viết lưu bút
              </Link>
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-100 bg-red-50/60 p-5 text-sm text-red-700">
              Không tải được lưu bút đã duyệt.
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-slate-100 bg-white p-5"
                >
                  <Skeleton className="mb-3 h-5 w-40 rounded-md" />
                  <Skeleton className="mb-2 h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>
              ))}
            </div>
          ) : targetFeelings && targetFeelings.length > 0 ? (
            <div className="space-y-4">
              {targetFeelings.map((feeling) => (
                <TargetFeelingItem key={feeling.id} feeling={feeling} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-6 text-center">
              <MessageSquareQuote className="mx-auto mb-4 h-8 w-8 text-slate-300" />
              <p className="font-serif italic text-slate-400">{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TargetFeelingItem({ feeling }: { feeling: Feeling }) {
  const content = normalizeText(feeling.content);
  const createdAt = formatFeelingTime(feeling.created);

  return (
    <article className="rounded-lg border border-slate-100 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-reunion-ink">
            {feeling.author_name}
          </h3>
          {createdAt && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <PenLine className="h-3.5 w-3.5 text-reunion-gold/70" />
              {createdAt}
            </p>
          )}
        </div>
        <MessageSquareQuote className="h-5 w-5 text-reunion-gold/60" />
      </div>
      <div
        className="font-serif italic leading-relaxed text-slate-600"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  );
}

function formatFeelingTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return formatRelativeTime(date);
}

function formatRelativeTime(date: Date) {
  const diffInSeconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 1) return "Vừa xong";
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  if (diffInDays < 30) return `${diffInDays} ngày trước`;
  if (diffInMonths < 12) return `${diffInMonths} tháng trước`;
  return `${diffInYears} năm trước`;
}
