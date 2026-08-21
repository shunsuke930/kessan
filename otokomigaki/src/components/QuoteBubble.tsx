import type { Quote } from '../quotes'

interface QuoteBubbleProps {
  quote: Quote
}

export function QuoteBubble({ quote }: QuoteBubbleProps) {
  return (
    <div className="pointer-events-none absolute inset-x-6 top-4 z-10 flex flex-col items-center">
      <div className="w-full border-2 border-slate-950 bg-slate-50 px-3 py-2 text-slate-900 shadow-md">
        <p className="text-[11px] leading-snug">{quote.text}</p>
        <p className="mt-1 text-right text-[10px] text-slate-500">― {quote.author}</p>
      </div>
      <div className="relative h-2.5 w-4">
        <div
          className="absolute top-0 left-0 h-0 w-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '10px solid #020617',
          }}
        />
        <div
          className="absolute top-0 left-0.5 h-0 w-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '8px solid #f8fafc',
          }}
        />
      </div>
    </div>
  )
}
