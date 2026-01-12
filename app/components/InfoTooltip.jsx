"use client";

import { useState } from "react";

export default function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label="Information"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="ml-2 inline-flex items-center justify-center
                   w-5 h-5 rounded-full border border-gray-400
                   text-xs font-semibold text-gray-600
                   hover:bg-gray-100 focus:outline-none"
      >
        i
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-64 rounded-md
                     bg-gray-900 text-white text-xs p-3 shadow-lg"
        >
          {text}
        </div>
      )}
    </div>
  );
}
