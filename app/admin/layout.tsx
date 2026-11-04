import { ClerkProvider, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ClerkProvider signInUrl="/admin/sign-in" signInFallbackRedirectUrl="/admin">
      <header className="bg-brand-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
              Admin
            </span>
          </Link>
          <div className="ml-auto">
            <Suspense>
              <UserButton />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </ClerkProvider>
  );
}
