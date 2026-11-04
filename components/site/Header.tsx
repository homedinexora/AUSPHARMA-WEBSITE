import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { therapies } from "@/lib/therapies";

export function Header() {
  return (
    <header className="bg-brand-800 text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-white focus:px-4 focus:py-2 focus:text-brand-800"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="rounded-sm">
          <Logo />
        </Link>
        <form
          action="/search"
          role="search"
          className="order-3 w-full sm:order-none sm:ml-auto sm:w-auto sm:min-w-80 lg:min-w-[28rem]"
        >
          <label htmlFor="site-search" className="sr-only">
            Search products
          </label>
          <div className="flex items-center gap-2 rounded-sm bg-white px-3 py-2 text-ink">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="shrink-0 text-ink-soft"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="site-search"
              name="q"
              type="search"
              placeholder="Search products or composition"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-soft"
            />
          </div>
        </form>
      </div>
      <nav aria-label="Therapy areas" className="border-t border-white/15">
        <ul className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 py-3 text-sm font-semibold whitespace-nowrap sm:px-6 lg:px-8">
          {therapies.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/therapy/${t.slug}`}
                className="rounded-sm text-white/90 hover:text-white hover:underline"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
