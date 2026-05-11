import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Download, ImagePlus, Loader2, RotateCcw, Share2, ZoomIn } from 'lucide-react'

import { Button } from '@/components/ui/button'
import avatarFrameSrc from '@/assets/avatar-frame.png'
import { getStoredReunionAccessCode, pocketBaseUrl } from '@/lib/pocketbase'
import { seo } from '@/lib/seo'

const OUTPUT_SIZE = 1080
const MAX_ZOOM = 3
const PHOTO_CENTER_X = 540
const PHOTO_CENTER_Y = 559
const PHOTO_RADIUS = 391

type LoadedImage = {
  element: HTMLImageElement
  url: string
  width: number
  height: number
}

type Position = {
  x: number
  y: number
}

export const Route = createFileRoute('/avatar')({
  head: () => ({
    meta: seo({
      title: 'Tạo avatar Facebook',
      description: 'Tạo ảnh đại diện Facebook với frame Giao Lộ Khối 9.',
    }),
  }),
  component: AvatarComponent,
})

function AvatarComponent() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; position: Position } | null>(null)
  const [userImage, setUserImage] = useState<LoadedImage | null>(null)
  const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  const minScale = useMemo(() => {
    if (!userImage) return 1
    return Math.max(OUTPUT_SIZE / userImage.width, OUTPUT_SIZE / userImage.height)
  }, [userImage])

  const scaledSize = useMemo(() => {
    if (!userImage) return { width: OUTPUT_SIZE, height: OUTPUT_SIZE }
    const scale = minScale * zoom
    return {
      width: userImage.width * scale,
      height: userImage.height * scale,
    }
  }, [minScale, userImage, zoom])

  const clampPosition = useCallback(
    (nextPosition: Position) => clampImagePosition(nextPosition, scaledSize.width, scaledSize.height),
    [scaledSize.height, scaledSize.width],
  )

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (!canvas || !context) return

    // Cấu hình chất lượng cao cho việc xử lý ảnh
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    context.fillStyle = '#FDFCF8'
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    if (userImage) {
      const safePosition = clampImagePosition(position, scaledSize.width, scaledSize.height)
      context.save()
      context.beginPath()
      context.arc(PHOTO_CENTER_X, PHOTO_CENTER_Y, PHOTO_RADIUS, 0, Math.PI * 2)
      context.clip()
      context.drawImage(
        userImage.element,
        (OUTPUT_SIZE - scaledSize.width) / 2 + safePosition.x,
        (OUTPUT_SIZE - scaledSize.height) / 2 + safePosition.y,
        scaledSize.width,
        scaledSize.height,
      )
      context.restore()
    } else {
      context.save()
      context.beginPath()
      context.arc(PHOTO_CENTER_X, PHOTO_CENTER_Y, PHOTO_RADIUS, 0, Math.PI * 2)
      context.clip()
      context.fillStyle = '#E8E0D2'
      context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      context.restore()
    }

    if (frameImage) {
      context.drawImage(frameImage, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    }
  }, [frameImage, position, scaledSize.height, scaledSize.width, userImage])

  useEffect(() => {
    const frame = new Image()
    frame.onload = () => setFrameImage(frame)
    frame.onerror = () => setError('Chưa tải được frame avatar. Vui lòng kiểm tra file avatar-frame.png.')
    frame.src = avatarFrameSrc
  }, [])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  useEffect(() => {
    return () => {
      if (userImage) URL.revokeObjectURL(userImage.url)
    }
  }, [userImage])

  const resetImage = useCallback(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]

      if (!file) return

      if (!file.type.startsWith('image/')) {
        setError('Vui lòng chọn một file ảnh.')
        return
      }

      const imageUrl = URL.createObjectURL(file)
      const image = new Image()

      image.onload = () => {
        if (userImage) URL.revokeObjectURL(userImage.url)
        setUserImage({
          element: image,
          url: imageUrl,
          width: image.naturalWidth,
          height: image.naturalHeight,
        })
        setError('')
        resetImage()
      }
      image.onerror = () => {
        URL.revokeObjectURL(imageUrl)
        setError('Không đọc được ảnh này. Vui lòng thử ảnh khác.')
      }
      image.src = imageUrl
    },
    [resetImage, userImage],
  )

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!userImage) return

      event.currentTarget.setPointerCapture(event.pointerId)
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        position,
      }
      setIsDragging(true)
    },
    [position, userImage],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const dragState = dragRef.current

      if (!dragState || dragState.pointerId !== event.pointerId) return

      const canvas = canvasRef.current
      const rect = canvas?.getBoundingClientRect()

      if (!rect) return

      const scale = OUTPUT_SIZE / rect.width
      const nextPosition = {
        x: dragState.position.x + (event.clientX - dragState.startX) * scale,
        y: dragState.position.y + (event.clientY - dragState.startY) * scale,
      }

      setPosition(clampPosition(nextPosition))
    },
    [clampPosition],
  )

  const endDrag = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
      setIsDragging(false)
    }
  }, [])

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      const clampedZoom = Math.min(Math.max(nextZoom, 1), MAX_ZOOM)
      setZoom(clampedZoom)

      if (!userImage) return

      const nextScale = minScale * clampedZoom
      setPosition((current) =>
        clampImagePosition(current, userImage.width * nextScale, userImage.height * nextScale),
      )
    },
    [minScale, userImage],
  )

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      if (!userImage) return
      event.preventDefault()
      const delta = -event.deltaY / 500
      handleZoomChange(zoom + delta)
    },
    [handleZoomChange, userImage, zoom],
  )

  const exportBlob = useCallback(async () => {
    drawCanvas()

    const canvas = canvasRef.current

    if (!canvas) return null

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  }, [drawCanvas])

  const downloadAvatar = useCallback(async () => {
    setIsExporting(true)

    try {
      const blob = await exportBlob()

      if (!blob) {
        setError('Không tạo được ảnh tải về. Vui lòng thử lại.')
        return
      }

      downloadBlob(blob)
      setError('')
    } finally {
      setIsExporting(false)
    }
  }, [exportBlob])

  const shareAvatar = useCallback(async () => {
    setIsExporting(true)
    const shareWindow = window.open('about:blank', '_blank')

    try {
      const blob = await exportBlob()

      if (!blob) {
        shareWindow?.close()
        setError('Không tạo được ảnh chia sẻ. Vui lòng thử lại.')
        return
      }

      shareWindow?.document.write('<p style="font-family: sans-serif; padding: 24px;">Đang chuẩn bị ảnh chia sẻ...</p>')

      const formData = new FormData()
      formData.append('image', blob, 'giao-lo-khoi-9-avatar.png')
      formData.append('access_code', getStoredReunionAccessCode())

      const response = await fetch(`${pocketBaseUrl.replace(/\/$/, '')}/api/avatar-shares`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Avatar upload failed')
      }

      const data = (await response.json()) as { facebookShareUrl?: string }

      if (!data.facebookShareUrl) {
        throw new Error('Missing Facebook share URL')
      }

      if (shareWindow) {
        shareWindow.location.href = data.facebookShareUrl
        shareWindow.opener = null
      } else {
        window.location.assign(data.facebookShareUrl)
      }
      setError('')
    } catch (shareError) {
      shareWindow?.close()
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return
      setError('Không upload được ảnh chia sẻ. Vui lòng thử lại hoặc dùng nút Tải ảnh.')
    } finally {
      setIsExporting(false)
    }
  }, [exportBlob])

  return (
    <div className="bg-reunion-paper">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <section className="page-hero">
        <div className="section-container grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end">
          <div className="max-w-3xl space-y-3 lg:col-span-8">
            <span className="eyebrow">Avatar Facebook</span>
            <h1 className="font-serif text-4xl font-bold leading-tight text-reunion-ink md:text-5xl">
              Tạo ảnh đại diện cho ngày gặp lại.
            </h1>
            <p className="max-w-2xl font-serif text-base italic leading-relaxed text-slate-500 md:text-lg">
              Chọn một tấm ảnh, canh gương mặt vào khung kỷ niệm rồi tải về để đổi avatar hoặc đăng lên Facebook.
            </p>
          </div>

          <div className="soft-panel p-5 lg:col-span-4">
            <div className="flex items-start gap-3 md:gap-4">
              <ImagePlus className="mt-1 h-5 w-5 shrink-0 text-reunion-gold md:h-6 md:w-6" />
              <div>
                <h2 className="font-serif text-xl font-bold text-reunion-ink md:text-2xl">Một tấm ảnh, một lời hẹn gặp lại</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Đổi avatar để bạn bè nhận ra nhau nhanh hơn, rồi cùng đếm ngược tới ngày Giao Lộ Khối 9 gặp lại.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-container">
          <div className="grid gap-5 lg:grid-cols-[minmax(280px,360px),minmax(0,1fr)] lg:items-start lg:gap-8">
            <div className="soft-panel order-2 self-start p-4 md:p-6 lg:order-1">
              <div className="space-y-4 lg:space-y-5">
              <div className="hidden lg:block">
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.24em] text-reunion-gold">
                  Ảnh của bạn
                </label>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-start rounded-md border-slate-200 bg-white px-4 text-sm font-bold text-reunion-ink hover:bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4 text-reunion-gold" />
                  {userImage ? 'Chọn ảnh khác' : 'Tải ảnh lên'}
                </Button>
              </div>

              <div className="space-y-3 rounded-md border border-slate-100 bg-slate-50/70 p-3 lg:border-0 lg:bg-transparent lg:p-0">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="avatar-zoom" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                    <ZoomIn className="h-4 w-4 text-reunion-gold" />
                    Phóng ảnh
                  </label>
                  <span className="text-xs font-bold text-reunion-forest">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  id="avatar-zoom"
                  type="range"
                  min="1"
                  max={MAX_ZOOM}
                  step="0.01"
                  value={zoom}
                  disabled={!userImage}
                  onChange={(event) => handleZoomChange(Number(event.target.value))}
                  className="h-2 w-full accent-reunion-forest disabled:opacity-40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-md border-slate-200 text-[11px] font-bold uppercase tracking-widest"
                  disabled={!userImage}
                  onClick={resetImage}
                >
                  <RotateCcw className="h-4 w-4" />
                  Căn lại
                </Button>
                <Button
                  type="button"
                  className="h-11 rounded-md bg-reunion-forest text-[11px] font-bold uppercase tracking-widest text-white hover:bg-emerald-900"
                  disabled={!userImage || isExporting}
                  onClick={downloadAvatar}
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Tải ảnh
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="col-span-2 h-11 rounded-md border-reunion-forest text-[11px] font-bold uppercase tracking-widest text-reunion-forest hover:bg-reunion-forest hover:text-white lg:col-span-1"
                  disabled={!userImage || isExporting}
                  onClick={shareAvatar}
                >
                  {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                  Chia sẻ Facebook
                </Button>
              </div>

              {error && (
                <p className="rounded-md border border-reunion-gold/20 bg-reunion-gold/10 px-4 py-3 text-sm leading-relaxed text-reunion-sepia">
                  {error}
                </p>
              )}
              </div>
            </div>

            <div className="order-1 self-start lg:order-2">
              <div className="lg:hidden">
                <Button
                  type="button"
                  className="h-12 w-full rounded-md bg-reunion-forest text-xs font-bold uppercase tracking-widest text-white hover:bg-emerald-900"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  {userImage ? 'Chọn ảnh khác' : 'Tải ảnh lên'}
                </Button>
              </div>

              <div className="soft-panel mt-3 p-4 md:p-6 lg:mt-0">
                <label className="mb-3 hidden text-[10px] font-bold uppercase tracking-[0.24em] text-reunion-gold lg:block">
                  Khung xem trước
                </label>
                <div className="mx-auto w-full max-w-[min(100%,680px)] rounded-md border border-slate-100 bg-reunion-paper p-1">
                  <canvas
                    ref={canvasRef}
                    width={OUTPUT_SIZE}
                    height={OUTPUT_SIZE}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onWheel={handleWheel}
                    className={`aspect-square w-full touch-none rounded-md bg-reunion-paper ${
                      userImage ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                    }`}
                    aria-label="Khung xem trước avatar"
                  />
                </div>
                <p className="mx-auto mt-3 max-w-[680px] px-2 text-center text-xs font-medium leading-relaxed text-slate-500 md:text-sm">
                  {userImage ? 'Kéo ảnh trong khung để căn mặt, dùng thanh zoom hoặc cuộn chuột để phóng gần hơn.' : 'Tải ảnh lên để bắt đầu tạo avatar.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function clampImagePosition(position: Position, imageWidth: number, imageHeight: number): Position {
  const maxX = Math.max(0, (imageWidth - OUTPUT_SIZE) / 2)
  const maxY = Math.max(0, (imageHeight - OUTPUT_SIZE) / 2)

  return {
    x: clamp(position.x, -maxX, maxX),
    y: clamp(position.y, -maxY, maxY),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'giao-lo-khoi-9-avatar.jpg'
  link.click()
  URL.revokeObjectURL(url)
}
