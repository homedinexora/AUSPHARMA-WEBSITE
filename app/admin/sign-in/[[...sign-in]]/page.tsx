import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function AdminSignIn() {
  return (
    <div className="flex justify-center py-10">
      <Suspense fallback={<p className="text-sm text-ink-soft">Loading sign-in…</p>}>
        <SignIn path="/admin/sign-in" fallbackRedirectUrl="/admin" />
      </Suspense>
    </div>
  );
}
