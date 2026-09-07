import { useState } from 'react'

type ProductGalleryProps = {
  title: string
  images?: string[]
}

export function ProductGallery({ title, images }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set())
  const availableImages = (images ?? []).filter(Boolean)
  const imageCount = availableImages.length

  const moveImage = (direction: number) => {
    if (!imageCount) return
    setActiveImage((current) => (current + direction + imageCount) % imageCount)
    setImageLoading(true)
    setZoomed(false)
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50 p-6">
        <div className={`relative h-[min(420px,70vw)] min-h-64 rounded-[1.2rem] bg-slate-100 transition-transform duration-300 ${zoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'}`} onClick={() => setZoomed((value) => !value)}>
          {imageLoading && !failedImages.has(activeImage) && <div className="absolute inset-0 animate-pulse bg-slate-200" aria-label="Loading product image" />}
          {availableImages[activeImage] && !failedImages.has(activeImage) ? <img src={availableImages[activeImage]} alt={title} loading={activeImage === 0 ? 'eager' : 'lazy'} onLoad={() => setImageLoading(false)} onError={() => { setImageLoading(false); setFailedImages((current) => new Set(current).add(activeImage)) }} className={`h-full w-full rounded-[1.2rem] object-contain transition-opacity ${imageLoading ? 'opacity-0' : 'opacity-100'}`} /> : <div className="flex h-full items-center justify-center text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Image unavailable</div>}
        </div>
        {imageCount > 1 && <>
          <button type="button" aria-label="Previous product image" onClick={() => moveImage(-1)} className="absolute left-8 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-slate-700 shadow-sm">‹</button>
          <button type="button" aria-label="Next product image" onClick={() => moveImage(1)} className="absolute right-8 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl text-slate-700 shadow-sm">›</button>
        </>}
      </div>

      {imageCount > 0 ? <div className="mt-4 grid grid-cols-4 gap-3">
        {availableImages.map((image, index) => (
          <button
            key={`${title}-${index}`}
            type="button"
            className={`overflow-hidden rounded-2xl border bg-slate-50 p-1 transition hover:border-[#1f2d4d] ${activeImage === index ? 'border-[#1f2d4d]' : 'border-slate-200'}`}
            onClick={() => { setActiveImage(index); setImageLoading(true); setZoomed(false) }}
            aria-label={`Show ${title} image ${index + 1}`}
          >
            <img src={image} alt={`${title} thumbnail ${index + 1}`} loading="lazy" className="h-20 w-full rounded-xl object-cover" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} />
          </button>
        ))}
      </div> : <p className="px-2 pt-4 text-center text-sm text-slate-500">No additional product images are available.</p>}
    </div>
  )
}
