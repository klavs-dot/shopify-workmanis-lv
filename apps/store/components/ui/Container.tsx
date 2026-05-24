import { cn } from "@/lib/utils";

/** Page-width wrapper with consistent horizontal padding.
 *  max-w-7xl matches a 1280px design grid which fits desktop monitors
 *  without stretching marketing copy too wide. */
export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
