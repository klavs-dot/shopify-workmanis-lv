/** Tiny classNames merger. Skips falsy entries and joins the rest with a
 *  single space — enough for our Tailwind-only styling, no need for clsx. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
