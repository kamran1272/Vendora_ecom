type ProductGalleryProps = {
  title: string
  images: string[]
}

export function ProductGallery({ title, images }: ProductGalleryProps) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-50 p-6">
        <div
          className="h-[420px] rounded-[1.2rem] bg-cover bg-center"
          style={{ backgroundImage: `url(${images[0]})` }}
          aria-label={title}
        />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {images.map((image, index) => (
          <button
            key={`${title}-${index}`}
            type="button"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-1 transition hover:border-[#1f2d4d]"
          >
            <div
              className="h-20 rounded-xl bg-cover bg-center"
              style={{ backgroundImage: `url(${image})` }}
              aria-label={`${title} thumbnail ${index + 1}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
