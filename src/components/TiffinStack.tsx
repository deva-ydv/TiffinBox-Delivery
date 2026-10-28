/**
 * The hero illustration: a stainless-steel tiffin carrier whose tiers drop into
 * place once on page load. Decorative only, so it is hidden from assistive tech.
 */
export function TiffinStack({ className = '' }: { className?: string }) {
  const tier = (y: number, delay: string) => (
    <g className="tier-drop" style={{ animationDelay: delay }}>
      <rect x="60" y={y} width="200" height="64" rx="12" fill="url(#steel)" stroke="#aeb8b2" strokeWidth="1.5" />
      <rect x="60" y={y + 27} width="200" height="8" fill="#f0b323" opacity="0.9" />
      <rect x="74" y={y + 8} width="172" height="3" rx="1.5" fill="#ffffff" opacity="0.7" />
    </g>
  );

  return (
    <svg viewBox="36 8 248 346" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="steel" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#d3dad6" />
          <stop offset="0.35" stopColor="#f3f5f4" />
          <stop offset="0.7" stopColor="#dde3df" />
          <stop offset="1" stopColor="#bfc8c3" />
        </linearGradient>
      </defs>

      <ellipse cx="160" cy="346" rx="104" ry="9" fill="#1b2420" opacity="0.1" />

      <g className="tier-drop" style={{ animationDelay: '0s' }}>
        <rect x="70" y="322" width="180" height="16" rx="8" fill="#9aa5a0" />
      </g>

      {tier(252, '0.12s')}
      {tier(182, '0.24s')}
      {tier(112, '0.36s')}

      {/* Side clamps hold the tiers together */}
      <g className="tier-drop" style={{ animationDelay: '0.48s' }}>
        <rect x="50" y="104" width="10" height="224" rx="5" fill="#8d9893" />
        <rect x="260" y="104" width="10" height="224" rx="5" fill="#8d9893" />
      </g>

      <g className="tier-drop" style={{ animationDelay: '0.6s' }}>
        <rect x="60" y="72" width="200" height="36" rx="14" fill="url(#steel)" stroke="#aeb8b2" strokeWidth="1.5" />
        <rect x="140" y="62" width="40" height="14" rx="7" fill="#8d9893" />
      </g>

      <g className="tier-drop" style={{ animationDelay: '0.72s' }}>
        <path d="M82 78 L82 38 Q82 26 94 26 L226 26 Q238 26 238 38 L238 78" fill="none" stroke="#8d9893" strokeWidth="7" strokeLinecap="round" />
        <rect x="128" y="18" width="64" height="15" rx="7.5" fill="#f0b323" />
      </g>
    </svg>
  );
}

/** Small three-tier mark used in the logo and as an image placeholder. */
export function TierMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <rect x="8" y="7" width="16" height="5" rx="2.5" fill="#f0b323" />
      <rect x="8" y="13" width="16" height="5" rx="2.5" fill="currentColor" opacity="0.85" />
      <rect x="8" y="19" width="16" height="5" rx="2.5" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
