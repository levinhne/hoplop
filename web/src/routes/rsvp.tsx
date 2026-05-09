import { createFileRoute, Link } from '@tanstack/react-router'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useClasses } from '@/hooks/useClasses'
import { useCreateRsvp } from '@/hooks/useRsvps'
import { ArrowLeft, Send, UsersRound, ImagePlus } from 'lucide-react'
import type { RsvpStatus } from '@/types'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { seo } from '@/lib/seo'

const statusLabels: Record<RsvpStatus, string> = {
  attending: 'Sẽ tham gia',
  maybe: 'Chưa chắc',
  not_attending: 'Không tham gia được',
}

const rsvpSchema = z.object({
  full_name: z.string().min(2, 'Vui lòng nhập họ tên.'),
  class_year: z.string().max(120, 'Tên lớp quá dài.').optional(),
  contact: z.string().min(6, 'Vui lòng nhập số điện thoại hoặc Zalo.'),
  facebook_url: z.string().trim().max(300, 'Link Facebook quá dài.').refine((value) => !value || isValidUrl(value), 'Vui lòng nhập link Facebook hợp lệ.').optional(),
  status: z.enum(['attending', 'maybe', 'not_attending']),
  location: z.string().max(200, 'Nơi ở hiện tại quá dài.').optional(),
  bio: z.string().max(1000, 'Giới thiệu bản thân tối đa 1000 ký tự.').optional(),
  thumb: z.any().optional(),
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự.').optional(),
})

type RsvpFormValues = z.infer<typeof rsvpSchema>

export const Route = createFileRoute('/rsvp')({
  head: () => ({
    meta: seo({
      title: 'Xác nhận tham gia',
      description: 'Form xác nhận tham gia họp lớp, gửi thông tin liên hệ, trạng thái tham gia và ảnh đại diện.',
    }),
  }),
  component: RsvpPage,
})

function RsvpPage() {
  const createRsvp = useCreateRsvp()
  const { data: classes, isLoading: isLoadingClasses } = useClasses()
  const { toast } = useToast()
  const [thumbPreview, setThumbPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    control,
    formState: { errors },
  } = useForm<RsvpFormValues>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      full_name: '',
      class_year: '',
      contact: '',
      facebook_url: '',
      status: 'attending',
      location: '',
      bio: '',
      note: '',
    },
  })

  const selectedStatus = useWatch({ control, name: 'status' })
  const selectedClassYear = useWatch({ control, name: 'class_year' }) || ''

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('thumb', file)
      previewFile(file, setThumbPreview)
    }
  }

  const onSubmit = (values: RsvpFormValues) => {
    const formData = new FormData()
    formData.append('full_name', values.full_name)
    if (values.class_year) formData.append('class_year', values.class_year)
    formData.append('contact', values.contact)
    if (values.facebook_url) formData.append('facebook_url', values.facebook_url)
    formData.append('status', values.status)
    if (values.location) formData.append('location', values.location)
    if (values.bio) formData.append('bio', values.bio)
    if (values.note) formData.append('note', values.note)
    if (values.thumb) formData.append('thumb', values.thumb)

    createRsvp.mutate(formData, {
      onSuccess: () => {
        toast({
          variant: 'success',
          title: 'Gửi xác nhận thành công!',
          description: 'Thông tin sẽ xuất hiện tại mục "Bạn bè" sau khi BTC phê duyệt.',
        })
        reset({
          full_name: '',
          class_year: '',
          contact: '',
          facebook_url: '',
          status: 'attending',
          location: '',
          bio: '',
          note: '',
        })
        setThumbPreview(null)
      },
      onError: (error) => {
        if (isDuplicateContactError(error)) {
          setError('contact', {
            type: 'server',
            message: 'Số điện thoại/Zalo này đã được gửi trước đó.',
          })
          toast({
            variant: 'destructive',
            title: 'Thông tin đã tồn tại',
            description: 'Số điện thoại/Zalo này đã được gửi trước đó. Vui lòng liên hệ BTC nếu cần cập nhật.',
          })
          return
        }

        toast({
          variant: 'destructive',
          title: 'Lỗi gửi xác nhận',
          description: 'Vui lòng kiểm tra lại thông tin và thử lại sau.',
        })
      },
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <section className="page-hero">
        <div className="section-container grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="max-w-3xl space-y-3 lg:col-span-8">
            <span className="eyebrow">Xác nhận tham gia</span>
            <h1 className="font-serif text-4xl font-bold leading-tight text-reunion-ink md:text-5xl">
              Hẹn gặp nhau trong ngày hội ngộ
            </h1>
            <p className="max-w-2xl font-serif text-base italic leading-relaxed text-slate-500 md:text-lg">
              Hãy để lại thông tin của bạn để chúng mình cùng kết nối lại sau nhiều năm xa cách.
            </p>
          </div>

          <div className="soft-panel p-5 lg:col-span-4">
            <UsersRound className="mb-4 h-7 w-7 text-reunion-gold" />
            <p className="font-serif text-base italic leading-relaxed text-reunion-sepia">
              "Giao lộ Khối 9 - Nơi những con đường riêng của mỗi người gặp lại nhau."
            </p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-container grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="soft-panel space-y-6 p-6 md:p-7">
              <div className="space-y-3">
                <span className="eyebrow">Kết nối hành trình</span>
                <h2 className="font-serif text-3xl font-bold text-reunion-ink">Thông tin thành viên</h2>
                <div className="h-1 w-12 bg-reunion-gold"></div>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-slate-500">
                <p>
                  Khi ban tổ chức phê duyệt (Approved) thông tin của bạn, dữ liệu sẽ tự động được cập nhật vào danh sách "Bạn bè" của website.
                </p>
                <p>Hãy tải lên một bức ảnh dọc thật tươi tắn và viết vài dòng giới thiệu về mình hiện tại nhé!</p>
              </div>
              <Button asChild variant="outline" className="h-11 rounded-md text-[10px] font-bold uppercase tracking-widest">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                  Về trang chủ
                </Link>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <form className="soft-panel space-y-6 p-6 md:p-7" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Họ tên *" error={errors.full_name?.message}>
                  <input className="form-control" placeholder="Nguyễn Văn A" {...register('full_name')} />
                </Field>

                <Field label="Lớp" error={errors.class_year?.message}>
                  {isLoadingClasses ? (
                    <Skeleton className="h-12 w-full rounded-md" />
                  ) : (
                    <Select
                      value={selectedClassYear}
                      onValueChange={(value) => setValue('class_year', value, { shouldDirty: true, shouldValidate: true })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lớp" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map((classGroup) => (
                          <SelectItem key={classGroup.id} value={classGroup.name}>
                            {classGroup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="SĐT / Zalo *" error={errors.contact?.message}>
                  <input className="form-control" placeholder="BTC liên hệ xác nhận" {...register('contact')} />
                </Field>

                <Field label="Nơi ở hiện tại" error={errors.location?.message}>
                  <input className="form-control" placeholder="Hà Nội, TP.HCM..." {...register('location')} />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Link Facebook" error={errors.facebook_url?.message}>
                  <input className="form-control" placeholder="https://facebook.com/..." {...register('facebook_url')} />
                </Field>

                <Field label="Trạng thái tham gia" error={errors.status?.message}>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setValue('status', value as RsvpStatus, { shouldDirty: true, shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="border-t border-slate-200/70 pt-6">
                <div className="flex flex-col items-center gap-6 sm:flex-row">
                  <div className="relative group">
                    <div className="aspect-[4/5] h-40 overflow-hidden rounded-lg border-4 border-slate-50 bg-slate-100 shadow-sm transition group-hover:border-reunion-gold/30">
                      {thumbPreview ? (
                        <img src={thumbPreview} alt="Preview ảnh thẻ bạn bè" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <UsersRound className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-2 right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-reunion-forest text-white shadow-lg transition hover:scale-110 active:scale-95">
                      <ImagePlus className="h-5 w-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbChange} />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-serif text-lg font-bold text-reunion-ink">Ảnh của bạn</h3>
                    <p className="text-xs text-slate-400">Ảnh dọc dùng để hiển thị trên trang Bạn bè.</p>
                  </div>
                </div>
              </div>

              <Field label="Giới thiệu bản thân (Bio)" error={errors.bio?.message}>
                <textarea
                  className="form-control h-28 resize-none leading-relaxed"
                  placeholder="Công việc hiện tại, sở thích, hoặc vài dòng chào hỏi bạn bè..."
                  {...register('bio')}
                />
              </Field>

              <Field label="Ghi chú cho BTC" error={errors.note?.message}>
                <textarea
                  className="form-control h-24 resize-none leading-relaxed"
                  placeholder="Ví dụ: mình ăn chay, đến muộn..."
                  {...register('note')}
                />
              </Field>

              <Button
                type="submit"
                disabled={createRsvp.isPending}
                className="h-12 w-full rounded-none bg-reunion-forest text-[10px] font-bold uppercase tracking-widest text-white hover:bg-emerald-900"
              >
                <Send className="h-4 w-4" />
                {createRsvp.isPending ? 'Đang gửi...' : 'Gửi xác nhận'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}

function previewFile(file: File, onPreview: (value: string) => void) {
  const reader = new FileReader()
  reader.onloadend = () => {
    onPreview(reader.result as string)
  }
  reader.readAsDataURL(file)
}

function isValidUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isDuplicateContactError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const response = error as {
    data?: {
      data?: {
        code?: string
        field?: string
      }
      message?: string
    }
    message?: string
  }

  return (
    response.data?.data?.code === 'duplicate_contact' ||
    response.data?.data?.field === 'contact' ||
    response.data?.message?.includes('Số điện thoại/Zalo này đã được gửi trước đó') ||
    response.message?.includes('Số điện thoại/Zalo này đã được gửi trước đó')
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-3">
      <span className="ml-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</span>
      {children}
      {error && <span className="block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}
