import { CATEGORY_BY_ID } from "@/lib/licor/catalog";
import type { Product } from "@/lib/licor/types";

/**
 * Generated product artwork.
 *
 * Products ship without photography, so the storefront draws a premium bottle
 * (or case) from the product's own data instead of shipping placeholder JPEGs.
 * As soon as a product gets an `image` path in the catalog, ProductImage
 * renders that photo instead — see components/licor/ProductImage.tsx.
 */
export default function BottleArt({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const palette = CATEGORY_BY_ID[product.category].palette;
  const id = product.slug.replace(/[^a-z0-9]/gi, "");
  const isCase = Boolean(product.isCase);

  return (
    <svg
      viewBox="0 0 200 340"
      role="img"
      aria-label={`${product.brand} ${product.name} illustration`}
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`glass-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={palette.glass} stopOpacity="0.95" />
          <stop offset="38%" stopColor={palette.base} stopOpacity="0.75" />
          <stop offset="62%" stopColor={palette.glass} stopOpacity="0.95" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`liquid-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.liquid} stopOpacity="0.85" />
          <stop offset="100%" stopColor={palette.base} stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={`gold-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4DE9B" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#9C7A1E" />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={palette.liquid} stopOpacity="0.28" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`body-${id}`}>
          <path d="M84 26h32v44c0 9 23 23 23 46v188a16 16 0 0 1-16 16H77a16 16 0 0 1-16-16V116c0-23 23-37 23-46z" />
        </clipPath>
      </defs>

      <ellipse cx="100" cy="180" rx="92" ry="150" fill={`url(#glow-${id})`} />

      {isCase ? (
        <CasePack id={id} palette={palette} product={product} />
      ) : (
        <>
          {/* cap / foil */}
          <rect x="79" y="6" width="42" height="26" rx="5" fill={`url(#gold-${id})`} />
          <rect x="79" y="6" width="42" height="8" rx="4" fill="#ffffff" opacity="0.22" />

          {/* body */}
          <path
            d="M84 26h32v44c0 9 23 23 23 46v188a16 16 0 0 1-16 16H77a16 16 0 0 1-16-16V116c0-23 23-37 23-46z"
            fill={`url(#glass-${id})`}
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
          />
          <g clipPath={`url(#body-${id})`}>
            <rect x="55" y="150" width="90" height="190" fill={`url(#liquid-${id})`} />
            <rect x="70" y="26" width="10" height="314" fill="#ffffff" opacity="0.14" />
            <rect x="126" y="60" width="5" height="280" fill="#ffffff" opacity="0.07" />
          </g>

          {/* label */}
          <rect
            x="55"
            y="196"
            width="90"
            height="92"
            rx="5"
            fill="#0B0B0C"
            stroke={`url(#gold-${id})`}
            strokeWidth="1.5"
          />
          <rect x="61" y="202" width="78" height="1" fill={`url(#gold-${id})`} opacity="0.7" />
          <text
            x="100"
            y="232"
            textAnchor="middle"
            fill="#F5F0E6"
            fontSize="13"
            fontWeight="700"
            letterSpacing="1.2"
            fontFamily="system-ui, sans-serif"
          >
            {shorten(product.brand, 14).toUpperCase()}
          </text>
          <text
            x="100"
            y="252"
            textAnchor="middle"
            fill="#D4AF37"
            fontSize="9"
            letterSpacing="2.4"
            fontFamily="system-ui, sans-serif"
          >
            {product.category.toUpperCase()}
          </text>
          <rect x="61" y="262" width="78" height="1" fill={`url(#gold-${id})`} opacity="0.7" />
          <text
            x="100"
            y="278"
            textAnchor="middle"
            fill="#A9A29A"
            fontSize="9"
            letterSpacing="1.4"
            fontFamily="system-ui, sans-serif"
          >
            {shorten(product.size, 18)}
          </text>
        </>
      )}
    </svg>
  );
}

function CasePack({
  id,
  palette,
  product,
}: {
  id: string;
  palette: { base: string; glass: string; liquid: string };
  product: Product;
}) {
  return (
    <>
      {[38, 78, 118].map((x, index) => (
        <g key={x} opacity={index === 1 ? 1 : 0.82}>
          <rect x={x + 10} y={index === 1 ? 30 : 44} width="20" height="14" rx="3" fill={`url(#gold-${id})`} />
          <path
            d={`M${x + 12} ${index === 1 ? 42 : 56}h16v26c0 6 10 12 10 24v${index === 1 ? 96 : 82}H${x + 2}V${index === 1 ? 92 : 106}c0-12 10-18 10-24z`}
            fill={`url(#glass-${id})`}
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.2"
          />
          <rect
            x={x + 2}
            y={index === 1 ? 128 : 142}
            width="36"
            height="30"
            fill={palette.liquid}
            opacity="0.55"
          />
        </g>
      ))}
      {/* box */}
      <path
        d="M30 186h140v112a14 14 0 0 1-14 14H44a14 14 0 0 1-14-14z"
        fill="#0D0D0F"
        stroke={`url(#gold-${id})`}
        strokeWidth="1.6"
      />
      <path d="M30 186h140v18H30z" fill={palette.base} opacity="0.5" />
      <text
        x="100"
        y="242"
        textAnchor="middle"
        fill="#F5F0E6"
        fontSize="15"
        fontWeight="700"
        letterSpacing="1.6"
        fontFamily="system-ui, sans-serif"
      >
        {shorten(product.brand, 12).toUpperCase()}
      </text>
      <text
        x="100"
        y="266"
        textAnchor="middle"
        fill="#D4AF37"
        fontSize="11"
        letterSpacing="2.6"
        fontFamily="system-ui, sans-serif"
      >
        12 PACK
      </text>
      <text
        x="100"
        y="288"
        textAnchor="middle"
        fill="#A9A29A"
        fontSize="9"
        letterSpacing="1.2"
        fontFamily="system-ui, sans-serif"
      >
        {shorten(product.size, 20)}
      </text>
    </>
  );
}

function shorten(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
