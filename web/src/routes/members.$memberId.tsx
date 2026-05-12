import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPin, MessageCircle, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMembers } from "@/hooks/useMembers";
import { getMemberClassName } from "@/lib/members";
import { getFileUrl, pb } from "@/lib/pocketbase";
import { normalizeText } from "@/lib/utils";
import { seo } from "@/lib/seo";
import { TargetFeelingsBox } from "@/components/target-feelings-box";
import type { Member } from "@/types";

export const Route = createFileRoute("/members/$memberId")({
  head: () => ({
    meta: seo({
      title: "Chi tiết bạn bè",
      description: "Trang check-in và gửi lưu bút cho từng thành viên.",
    }),
  }),
  component: MemberDetailPage,
});

function MemberDetailPage() {
  const { memberId } = Route.useParams();
  const { data: members, isLoading: isLoadingMembers } = useMembers();

  const {
    data: member,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["members", memberId],
    queryFn: async () => {
      return pb.collection("members").getOne<Member>(memberId, {
        expand: "class_ref",
      });
    },
  });

  const relatedMembers = useMemo(() => {
    if (!member || !members) return [];

    const currentClassName = getMemberClassName(member);
    return members
      .filter(
        (item) =>
          item.id !== member.id && getMemberClassName(item) === currentClassName
      )
      .sort(
        (a, b) => stableScore(member.id, a.id) - stableScore(member.id, b.id)
      )
      .slice(0, 4);
  }, [member, members]);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !member) {
    return (
      <NotFoundState
        title="Không tìm thấy thành viên"
        to="/members"
        action="Về danh sách bạn bè"
      />
    );
  }

  const thumbUrl = getFileUrl("members", member.id, member.thumb);
  const className = getMemberClassName(member, "Lớp 9A");
  const bio = normalizeText(member.bio) || "Chưa có thông tin giới thiệu.";
  const initial = member.name.trim().substring(0, 1) || "B";
  const facebookUrl = member.facebook_url?.trim();

  return (
    <div className="flex min-h-screen flex-col">
      <section className="flex min-h-[calc(100svh-5rem)] items-center bg-white/70 py-8 md:py-10">
        <div className="section-container">
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-lg border-4 border-white bg-slate-100 shadow-xl md:border-8 lg:max-h-[72svh]">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={member.name}
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
                <span className="eyebrow">{className}</span>
                <h1 className="font-serif text-5xl font-bold leading-tight text-reunion-ink md:text-7xl">
                  {member.name}
                </h1>
                <div className="h-1 w-16 bg-reunion-gold" />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                {member.location && (
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
                    <MapPin className="h-4 w-4 text-reunion-gold" />
                    {member.location}
                  </div>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-reunion-forest transition hover:border-reunion-gold"
                  >
                    <ExternalLink className="h-4 w-4 text-reunion-gold" />
                    Facebook
                  </a>
                )}
              </div>

              <div className="relative max-w-3xl">
                <MessageCircle className="absolute -left-4 -top-4 h-10 w-10 text-reunion-gold/10" />
                <div
                  className="pl-3 font-serif text-xl italic leading-relaxed text-slate-600 md:text-3xl"
                  dangerouslySetInnerHTML={{ __html: bio }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <TargetFeelingsBox
        targetId={member.id}
        targetType="member"
        title={`Lưu bút viết về ${member.name}`}
        emptyMessage="Chưa có lưu bút nào viết riêng cho bạn này."
      />

      <section className="border-t border-reunion-gold/10 bg-reunion-paper py-10 md:py-12">
        <div className="section-container">
          <div className="mb-8 space-y-3">
            <span className="eyebrow">Cùng lớp</span>
            <h2 className="font-serif text-3xl font-bold text-reunion-ink md:text-4xl">
              Bạn cùng lớp
            </h2>
          </div>

          {isLoadingMembers ? (
            <RelatedSkeleton />
          ) : relatedMembers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {relatedMembers.map((item) => (
                <RelatedMemberCard key={item.id} member={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-7 text-center">
              <UsersRound className="mx-auto mb-4 h-8 w-8 text-slate-300" />
              <p className="font-serif italic text-slate-400">
                Chưa có thành viên cùng lớp khác.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RelatedMemberCard({ member }: { member: Member }) {
  const thumbUrl = getFileUrl("members", member.id, member.thumb);
  const className = getMemberClassName(member, "Lớp 9A");
  const initial = member.name.trim().substring(0, 1) || "B";
  const bio = normalizeText(member.bio) || "Chưa cập nhật đôi dòng giới thiệu.";

  return (
    <Link
      to="/members/$memberId"
      params={{ memberId: member.id }}
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
        <div
          className="line-clamp-3 text-sm leading-relaxed text-slate-500"
          dangerouslySetInnerHTML={{ __html: bio }}
        />
      </div>
    </Link>
  );
}

function RelatedSkeleton() {
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

function stableScore(seed: string, value: string) {
  let hash = 0;
  const input = `${seed}:${value}`;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
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

function NotFoundState({
  title,
  to,
  action,
}: {
  title: string;
  to: "/members";
  action: string;
}) {
  return (
    <div className="section-container py-14 text-center">
      <div className="mx-auto max-w-md space-y-4 rounded-lg border border-dashed border-slate-200 bg-white/70 p-7">
        <UsersRound className="mx-auto h-8 w-8 text-slate-300" />
        <h1 className="font-serif text-2xl font-bold text-reunion-ink">
          {title}
        </h1>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-md text-[10px] font-bold uppercase tracking-widest"
        >
          <Link to={to}>{action}</Link>
        </Button>
      </div>
    </div>
  );
}
