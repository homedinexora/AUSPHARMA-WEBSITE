/**
 * Interim AUS Pharma logo reproduced from the approved mockup (white rounded square with a
 * teal "A" + wordmark). TODO(brand): replace with the official SVG from public/brand/ when supplied.
 */
export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const onDark = tone === "light";
  return (
    <span className="inline-flex items-center gap-2" aria-label="AUS Pharma">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="28" height="28" rx="7" fill={onDark ? "#ffffff" : "#087f75"} />
        <path
          d="M14 6.5 8.2 21.5h3.1l1.2-3.3h3l1.2 3.3h3.1L14 6.5Zm-.6 9.1L14 13.7l.6 1.9h-1.2Z"
          fill={onDark ? "#087f75" : "#ffffff"}
        />
      </svg>
      <span
        className={`text-lg font-bold tracking-tight ${onDark ? "text-white" : "text-brand-800"}`}
        aria-hidden="true"
      >
        AUS Pharma
      </span>
    </span>
  );
}
