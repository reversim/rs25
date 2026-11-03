// Single source of truth for the primary navigation links.
// Consumed by both the desktop header bar (header.astro) and the mobile
// drawer (header/navDrawer.astro) so the two can never drift apart.
export interface NavLink {
  href: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/#sponsors", label: "Sponsors" },
  { href: "/speakers", label: "Speakers" },
  { href: "/agenda", label: "Agenda" },
  { href: "/about", label: "Team" },
];

// Marks the drawer link for the section the visitor is currently in.
// "/" only matches the homepage exactly; the others also match their
// sub-pages, so /about/some-member still highlights "Team".
export function isActiveNavLink(href: string, pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (href === "/") return path === "/";
  return path === href || path.startsWith(`${href}/`);
}
