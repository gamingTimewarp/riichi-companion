import { useState } from 'react'

export default function InfoTooltip({ text, up = false }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        onBlur={() => setOpen(false)}
        className="ml-1 text-slate-500 hover:text-slate-300 focus:outline-none align-middle"
        aria-label="More information"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <span className={`absolute z-50 left-0 w-56 bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-lg p-2 shadow-lg leading-relaxed ${up ? 'bottom-5' : 'top-5'}`}>
          {text}
        </span>
      )}
    </span>
  )
}
