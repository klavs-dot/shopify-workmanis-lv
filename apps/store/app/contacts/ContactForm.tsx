"use client";

// Client component. The wrapper page is a server component for SEO, but the
// form needs onSubmit handlers and will eventually call a server action.

export function ContactForm() {
  return (
    <form
      className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5"
      aria-label="Kontaktforma"
      onSubmit={(e) => e.preventDefault()}
    >
      <div>
        <label className="block text-xs font-medium text-neutral-700">
          Vārds
        </label>
        <input
          type="text"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-700">
          E-pasts
        </label>
        <input
          type="email"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-neutral-700">
          Ziņa
        </label>
        <textarea
          required
          rows={5}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled
        className="rounded-md bg-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 disabled:cursor-not-allowed"
        title="Forma vēl nav aktivizēta"
      >
        Sūtīt (drīzumā)
      </button>
      <p className="text-[11px] text-neutral-500">
        Forma šobrīd ir vizuāls placeholder. Drīzumā pievienosim sūtīšanu.
      </p>
    </form>
  );
}
