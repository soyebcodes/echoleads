import Link from "next/link";

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-lg bg-ember text-ember-foreground shadow-ember"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M4 12c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M7 12c0-2.761 2.239-5 5-5s5 2.239 5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
        <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Brand({ href = "/", size = 32 }: { href?: string; size?: number }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <BrandMark size={size} />
      <span className="text-display text-lg font-bold tracking-tight text-foreground">
        Echo<span className="text-ember">Leads</span>
      </span>
    </Link>
  );
}
