import { T } from "@/lib/tokens";

export function BrandMark({ size = 22, color }: { size?: number; color?: string }) {
  const c = color || T.gold;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3a9 9 0 11-6.4 15.4" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="6" cy="18.5" r="1.6" fill={c} />
    </svg>
  );
}
