export interface Category {
  slug: string;
  name: string;
  /** Short marketing line shown under the title on category cards. */
  tagline?: string;
  /** Optional cover image for /categories grid + /categories/[slug] hero. */
  image?: string;
  /** Lucide icon name, for the home-page category strip. Looked up lazily so
   *  we don't bundle the whole icon set. */
  icon?: string;
}
