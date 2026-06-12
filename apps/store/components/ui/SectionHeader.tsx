import Link from "next/link";

// Shared section header — keeps the type scale, bottom rule, and link style
// in lockstep across home sections and listing pages.
export function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-2 border-b border-neutral-200 pb-3">
      <h2 className="text-lg font-bold tracking-tight text-neutral-900 md:text-xl">
        {title}
      </h2>
      {href && linkLabel && (
        <Link
          href={href}
          className="group/link rounded-sm text-xs font-medium text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 md:text-sm"
        >
          {linkLabel}{" "}
          <span className="inline-block transition-transform group-hover/link:translate-x-0.5 motion-reduce:transition-none">
            →
          </span>
        </Link>
      )}
    </div>
  );
}
