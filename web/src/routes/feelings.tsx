import { useCreateFeeling, useFeelings } from "@/hooks/useFeelings";
import { useClasses } from "@/hooks/useClasses";
import { useMembers } from "@/hooks/useMembers";
import { useTeachers } from "@/hooks/useTeachers";
import { getMemberClassName } from "@/lib/members";
import { cn, normalizeText } from "@/lib/utils";
import {
  Check,
  ChevronsUpDown,
  MessageSquareQuote,
  PenLine,
  Send,
  UserRoundCheck,
} from "lucide-react";
import type { Feeling } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { getFileUrl } from "@/lib/pocketbase";
import { seo } from "@/lib/seo";

const feelingTargetTypes = ["general", "class", "teacher", "member"] as const;

type FeelingTargetType = (typeof feelingTargetTypes)[number];
type FeelingFilter = "all" | FeelingTargetType;
type FeelingSearch = {
  open?: boolean;
  target_type?: FeelingTargetType;
  target_id?: string;
};

const FEELINGS_PAGE_SIZE = 6;

const feelingSchema = z
  .object({
    author_name: z.string().min(2, "Vui lòng nhập tên của bạn."),
    content: z
      .string()
      .min(10, "Lời nhắn cần ít nhất 10 ký tự.")
      .max(1000, "Lời nhắn tối đa 1000 ký tự."),
    target_type: z.enum(["general", "class", "teacher", "member"]),
    target_id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.target_type !== "general" && !data.target_id) {
      ctx.addIssue({
        code: "custom",
        path: ["target_id"],
        message: "Vui lòng chọn người nhận lời nhắn.",
      });
    }
  });

type FeelingFormValues = z.infer<typeof feelingSchema>;

function normalizeTargetType(
  value: unknown
): FeelingFormValues["target_type"] | undefined {
  return feelingTargetTypes.find((targetType) => targetType === value);
}

export const Route = createFileRoute("/feelings")({
  validateSearch: (search: Record<string, unknown>): FeelingSearch => {
    const targetType = normalizeTargetType(search.target_type);
    const targetId =
      typeof search.target_id === "string" ? search.target_id : "";
    const shouldOpen =
      search.open === true || search.open === "true" || search.open === "1";

    return {
      ...(shouldOpen ? { open: true } : {}),
      ...(targetType ? { target_type: targetType } : {}),
      ...(targetId ? { target_id: targetId } : {}),
    };
  },
  head: () => ({
    meta: seo({
      title: "Lưu bút",
      description:
        "Gửi lời nhắn cho cả lớp, bạn bè hoặc Thầy Cô và đọc những dòng lưu bút đã được duyệt.",
    }),
  }),
  component: FeelingsPage,
});

function FeelingsPage() {
  const search = Route.useSearch();
  const {
    data: feelings,
    isLoading: isLoadingFeelings,
    error: feelingsError,
  } = useFeelings();
  const { data: classes, isLoading: isLoadingClasses } = useClasses();
  const { data: members, isLoading: isLoadingMembers } = useMembers();
  const { data: teachers, isLoading: isLoadingTeachers } = useTeachers();
  const createFeeling = useCreateFeeling();
  const { toast } = useToast();
  const [feelingFilter, setFeelingFilter] = useState<FeelingFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [targetComboboxOpen, setTargetComboboxOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(() =>
    Boolean(search.open)
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<FeelingFormValues>({
    resolver: zodResolver(feelingSchema),
    defaultValues: {
      author_name: "",
      content: "",
      target_type: search.target_type ?? "general",
      target_id:
        search.target_type && search.target_type !== "general"
          ? search.target_id ?? ""
          : "",
    },
  });

  const targetType = useWatch({ control, name: "target_type" });
  const targetId = useWatch({ control, name: "target_id" });
  const isLoadingTargets =
    targetType === "class"
      ? isLoadingClasses
      : targetType === "teacher"
      ? isLoadingTeachers
      : targetType === "member"
      ? isLoadingMembers
      : false;

  const targetOptions = useMemo(() => {
    if (targetType === "class") {
      return (
        classes?.map((classGroup) => ({
          id: classGroup.id,
          name: classGroup.name,
          meta: classGroup.school_year,
        })) ?? []
      );
    }

    if (targetType === "teacher") {
      return (
        teachers?.map((teacher) => ({
          id: teacher.id,
          name: teacher.name,
          meta: teacher.subject,
        })) ?? []
      );
    }

    if (targetType === "member") {
      return (
        members?.map((member) => ({
          id: member.id,
          name: member.name,
          meta: getMemberClassName(member),
        })) ?? []
      );
    }

    return [];
  }, [classes, members, targetType, teachers]);

  const selectedTarget = useMemo(() => {
    return targetOptions.find((option) => option.id === targetId);
  }, [targetId, targetOptions]);

  const visibleFeelings = useMemo(() => {
    if (!feelings) return [];
    if (feelingFilter === "all") return feelings;

    return feelings.filter((feeling) => feeling.target_type === feelingFilter);
  }, [feelingFilter, feelings]);

  const totalPages = Math.max(
    1,
    Math.ceil(visibleFeelings.length / FEELINGS_PAGE_SIZE)
  );
  const activePage = Math.min(currentPage, totalPages);
  const paginatedFeelings = visibleFeelings.slice(
    (activePage - 1) * FEELINGS_PAGE_SIZE,
    activePage * FEELINGS_PAGE_SIZE
  );

  const handleFilterChange = (filter: FeelingFilter) => {
    setFeelingFilter(filter);
    setCurrentPage(1);
  };

  const onSubmit = (values: FeelingFormValues) => {
    createFeeling.mutate(values, {
      onSuccess: () => {
        toast({
          variant: "success",
          title: "Gửi lưu bút thành công!",
          description: "Lời nhắn của bạn đang chờ BTC duyệt để hiển thị.",
        });
        reset({
          author_name: "",
          content: "",
          target_type: "general",
          target_id: "",
        });
        setTargetComboboxOpen(false);
        setIsFormDialogOpen(false);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Lỗi gửi lưu bút",
          description: "Vui lòng kiểm tra lại nội dung và thử lại.",
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-reunion-paper">
      <section className="page-hero">
        <div className="section-container grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="max-w-3xl space-y-3 lg:col-span-8">
            <span className="eyebrow">Lưu bút ngày gặp lại</span>
            <h1 className="font-serif text-4xl font-bold leading-tight text-reunion-ink md:text-5xl">
              Viết vài dòng gửi về thanh xuân
            </h1>
            <p className="max-w-2xl font-serif text-base italic leading-relaxed text-slate-500 md:text-lg">
              Gửi lời nhắn chung cho cả lớp, hoặc viết riêng cho một người bạn,
              một Thầy Cô mà bạn vẫn luôn nhớ.
            </p>
          </div>

          <div className="soft-panel p-5 lg:col-span-4">
            <MessageSquareQuote className="mb-4 h-7 w-7 text-reunion-gold" />
            <p className="font-serif text-base italic leading-relaxed text-reunion-sepia">
              "Có những câu chuyện chỉ cần một lần nhắc lại, cả sân trường cũ
              bỗng hiện về."
            </p>
            <Button
              type="button"
              className="mt-5 h-11 w-full rounded-md bg-reunion-forest text-[10px] font-bold uppercase tracking-widest text-white hover:bg-emerald-900"
              onClick={() => setIsFormDialogOpen(true)}
            >
              <PenLine className="h-4 w-4" />
              Gửi lưu bút
            </Button>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-container">
          <div className="space-y-6">
            <div className="filter-panel">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="eyebrow">Đã duyệt</span>
                  <h2 className="font-serif text-3xl font-bold text-reunion-ink">
                    Những lời nhắn đã gửi
                  </h2>
                </div>
              </div>

              {isLoadingFeelings ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} className="h-10 w-24 rounded-md" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <FeelingFilterButton
                    label="Tất cả"
                    count={feelings?.length ?? 0}
                    active={feelingFilter === "all"}
                    onClick={() => handleFilterChange("all")}
                  />
                  <FeelingFilterButton
                    label="Gửi tất cả"
                    count={countFeelings(feelings, "general")}
                    active={feelingFilter === "general"}
                    onClick={() => handleFilterChange("general")}
                  />
                  <FeelingFilterButton
                    label="Theo lớp"
                    count={countFeelings(feelings, "class")}
                    active={feelingFilter === "class"}
                    onClick={() => handleFilterChange("class")}
                  />
                  <FeelingFilterButton
                    label="Thầy Cô"
                    count={countFeelings(feelings, "teacher")}
                    active={feelingFilter === "teacher"}
                    onClick={() => handleFilterChange("teacher")}
                  />
                  <FeelingFilterButton
                    label="Bạn bè"
                    count={countFeelings(feelings, "member")}
                    active={feelingFilter === "member"}
                    onClick={() => handleFilterChange("member")}
                  />
                </div>
              )}
            </div>

            {feelingsError ? (
              <div className="rounded-lg border border-red-100 bg-white p-8 text-center text-sm text-red-700">
                Không tải được danh sách lời nhắn đã duyệt.
              </div>
            ) : isLoadingFeelings ? (
              <div className="space-y-5">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-slate-100 bg-white p-6"
                  >
                    <Skeleton className="mb-4 h-5 w-1/3" />
                    <Skeleton className="mb-3 h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : visibleFeelings.length ? (
              <div className="space-y-6">
                <div className="space-y-5">
                  {paginatedFeelings.map((feeling) => (
                    <FeelingCard key={feeling.id} feeling={feeling} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      Trang {activePage} / {totalPages}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-md border-slate-200 px-4 text-[10px] font-bold uppercase tracking-widest"
                        disabled={activePage === 1}
                        onClick={() =>
                          setCurrentPage((page) => Math.max(1, page - 1))
                        }
                      >
                        Trước
                      </Button>
                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1
                      ).map((page) => (
                        <Button
                          key={page}
                          type="button"
                          variant={page === activePage ? "default" : "outline"}
                          className="h-10 w-10 rounded-md px-0 text-xs font-bold"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-md border-slate-200 px-4 text-[10px] font-bold uppercase tracking-widest"
                        disabled={activePage === totalPages}
                        onClick={() =>
                          setCurrentPage((page) =>
                            Math.min(totalPages, page + 1)
                          )
                        }
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white/70 p-7 text-center">
                <UserRoundCheck className="mx-auto mb-4 h-8 w-8 text-slate-300" />
                <p className="font-serif italic text-slate-400">
                  Chưa có lời nhắn nào được duyệt.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Dialog
        open={isFormDialogOpen}
        onOpenChange={(open) => {
          setIsFormDialogOpen(open);
          if (!open) setTargetComboboxOpen(false);
        }}
      >
        <DialogContent className="max-h-[94svh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-xl border-none p-0 shadow-2xl sm:w-full">
          <div className="bg-white p-4 pb-5 pt-5 sm:p-6 md:p-8">
            <div className="mb-5 space-y-2 pr-8 sm:mb-6 sm:space-y-3 sm:pr-0">
              <div className="flex items-center gap-3 text-reunion-gold">
                <PenLine className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
                  Gửi lời nhắn
                </span>
              </div>
              <DialogTitle className="font-serif text-2xl font-bold leading-tight text-reunion-ink sm:text-3xl">
                Gửi vào lưu bút
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-slate-500 sm:max-w-xl">
                Lời nhắn mới sẽ được ban tổ chức duyệt trước khi hiển thị công
                khai.
              </DialogDescription>
            </div>

            <form
              className="space-y-5 sm:space-y-6"
              onSubmit={handleSubmit(onSubmit)}
            >
              <Field label="Bạn tên là gì?" error={errors.author_name?.message}>
                <input
                  type="text"
                  placeholder="Họ và tên của bạn"
                  className="form-control"
                  {...register("author_name")}
                />
              </Field>

              <Field
                label="Gửi tới"
                error={errors.target_type?.message || errors.target_id?.message}
              >
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  <TargetButton
                    label="Tất cả"
                    active={targetType === "general"}
                    onClick={() => {
                      setValue("target_type", "general");
                      setValue("target_id", "");
                      setTargetComboboxOpen(false);
                    }}
                  />
                  <TargetButton
                    label="Cả lớp"
                    active={targetType === "class"}
                    onClick={() => {
                      setValue("target_type", "class");
                      setValue("target_id", "");
                      setTargetComboboxOpen(false);
                    }}
                  />
                  <TargetButton
                    label="Thầy Cô"
                    active={targetType === "teacher"}
                    onClick={() => {
                      setValue("target_type", "teacher");
                      setValue("target_id", "");
                      setTargetComboboxOpen(false);
                    }}
                  />
                  <TargetButton
                    label="Bạn bè"
                    active={targetType === "member"}
                    onClick={() => {
                      setValue("target_type", "member");
                      setValue("target_id", "");
                      setTargetComboboxOpen(false);
                    }}
                  />
                </div>

                {targetType !== "general" && isLoadingTargets && (
                  <Skeleton className="mt-3 h-12 w-full rounded-lg" />
                )}

                {targetType !== "general" && !isLoadingTargets && (
                  <Popover
                    open={targetComboboxOpen}
                    onOpenChange={setTargetComboboxOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={targetComboboxOpen}
                        className="mt-3 h-11 w-full justify-between rounded-lg border-slate-200 bg-white px-3 text-left text-sm font-medium text-reunion-ink hover:bg-white hover:text-reunion-ink sm:h-12 sm:px-4"
                      >
                        <span
                          className={cn(
                            "truncate",
                            !selectedTarget && "text-slate-300"
                          )}
                        >
                          {selectedTarget
                            ? `${selectedTarget.name}${
                                selectedTarget.meta
                                  ? ` - ${selectedTarget.meta}`
                                  : ""
                              }`
                            : getTargetPlaceholder(targetType)}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-300" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput
                          placeholder={getTargetSearchPlaceholder(targetType)}
                        />
                        <CommandList>
                          <CommandEmpty>
                            Không tìm thấy người nhận.
                          </CommandEmpty>
                          <CommandGroup
                            heading={getTargetGroupHeading(targetType)}
                          >
                            {targetOptions.map((option) => (
                              <CommandItem
                                key={option.id}
                                value={`${option.name} ${option.meta ?? ""}`}
                                onSelect={() => {
                                  setValue("target_id", option.id, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                  setTargetComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 text-reunion-gold",
                                    targetId === option.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <span className="min-w-0 flex-1 truncate">
                                  {option.name}
                                  {option.meta ? ` - ${option.meta}` : ""}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </Field>

              <Field
                label="Lời nhắn gửi của bạn"
                error={errors.content?.message}
              >
                <textarea
                  placeholder="Hãy viết gì đó thật chân thành..."
                  className="form-control h-32 resize-none leading-relaxed sm:h-44"
                  {...register("content")}
                />
              </Field>

              <div className="sticky bottom-0 rounded-b-xl bg-white/95 pt-2 sm:static sm:bg-transparent sm:pt-0">
                <Button
                  type="submit"
                  disabled={createFeeling.isPending}
                  className="h-12 w-full rounded-md bg-reunion-forest text-[10px] font-bold uppercase tracking-widest text-white hover:bg-emerald-900"
                >
                  <Send className="h-4 w-4" />
                  {createFeeling.isPending ? "Đang gửi..." : "Gửi vào lưu bút"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeelingFilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-md border px-4 text-[10px] font-bold uppercase tracking-widest transition",
        active
          ? "border-reunion-forest bg-reunion-forest text-white"
          : "border-slate-200 bg-white text-slate-500 hover:border-reunion-gold hover:text-reunion-forest"
      )}
      onClick={onClick}
    >
      {label}
      <span
        className={cn(
          "text-[9px]",
          active ? "text-white/70" : "text-slate-300"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2.5 sm:space-y-3">
      <span className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 sm:text-[11px]">
        {label}
      </span>
      {children}
      {error && (
        <span className="block text-xs font-medium text-red-600">{error}</span>
      )}
    </label>
  );
}

function TargetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "h-10 rounded-md border px-1 text-[9px] font-bold uppercase tracking-wider transition sm:text-[10px] sm:tracking-widest",
        active
          ? "border-reunion-forest bg-reunion-forest text-white"
          : "border-slate-200 bg-white text-slate-500 hover:border-reunion-gold hover:text-reunion-forest"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function FeelingCard({ feeling }: { feeling: Feeling }) {
  const attachmentUrl = getFileUrl("feelings", feeling.id, feeling.attachment);
  const target = getFeelingTarget(feeling);
  const content = normalizeText(feeling.content);
  const shouldClamp = content.length > 180;
  const createdAt = formatFeelingTime(feeling.created);

  return (
    <article className="flex min-h-52 flex-col rounded-lg border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-bold text-reunion-ink">
            {feeling.author_name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-reunion-gold">
              {target}
            </p>
            {createdAt && (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <PenLine className="h-3.5 w-3.5 text-reunion-gold/70" />
                {createdAt}
              </p>
            )}
          </div>
        </div>
        <MessageSquareQuote className="h-5 w-5 text-reunion-gold/60" />
      </div>

      <div
        className="line-clamp-5 font-serif italic leading-relaxed text-slate-600"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {attachmentUrl && (
        <div className="mt-5 overflow-hidden rounded-lg bg-slate-100">
          <img
            src={attachmentUrl}
            alt={`Ảnh đính kèm của ${feeling.author_name}`}
            className="max-h-80 w-full object-cover"
          />
        </div>
      )}

      {shouldClamp && (
        <Dialog>
          <DialogTrigger asChild>
            <button className="mt-5 w-fit border-t border-slate-100 pt-4 text-[10px] font-bold uppercase tracking-[0.24em] text-reunion-gold transition hover:text-reunion-forest">
              Đọc đầy đủ
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-hidden rounded-xl border-none p-0 shadow-2xl">
            <div className="space-y-6 bg-white p-8 md:p-10">
              <div className="space-y-3">
                <span className="eyebrow">{target}</span>
                <DialogTitle className="font-serif text-3xl font-bold text-reunion-ink md:text-4xl">
                  {feeling.author_name}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Nội dung đầy đủ lời nhắn của {feeling.author_name}
                </DialogDescription>
                <div className="h-1 w-12 bg-reunion-gold"></div>
              </div>

              <div className="relative">
                <MessageSquareQuote className="absolute -left-4 -top-4 h-8 w-8 text-reunion-gold/10" />
                <p className="pl-2 font-serif text-lg italic leading-relaxed text-slate-600">
                  "{content}"
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
}

function countFeelings(
  feelings: Feeling[] | undefined,
  targetType: FeelingFilter
) {
  if (!feelings || targetType === "all") return feelings?.length ?? 0;

  return feelings.filter((feeling) => feeling.target_type === targetType)
    .length;
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

function getTargetPlaceholder(targetType: FeelingFormValues["target_type"]) {
  if (targetType === "class") return "Chọn lớp";
  if (targetType === "teacher") return "Chọn Thầy Cô";
  if (targetType === "member") return "Chọn bạn bè";
  return "Chọn người nhận";
}

function getTargetSearchPlaceholder(
  targetType: FeelingFormValues["target_type"]
) {
  if (targetType === "class") return "Tìm lớp...";
  if (targetType === "teacher") return "Tìm Thầy Cô...";
  if (targetType === "member") return "Tìm bạn bè...";
  return "Tìm người nhận...";
}

function getTargetGroupHeading(targetType: FeelingFormValues["target_type"]) {
  if (targetType === "class") return "Lớp";
  if (targetType === "teacher") return "Thầy Cô";
  if (targetType === "member") return "Bạn bè";
  return "Người nhận";
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
