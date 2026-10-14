import Link from 'next/link';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { Product, formatCurrency } from '@/lib/catalog';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const lowestVariant = product.variants[0];
  const stockLabel = lowestVariant?.inStock ? 'In stock' : 'Out of stock';

  if (compact) {
    return (
      <article className="card flex h-full min-w-0 flex-col overflow-hidden rounded-2xl">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative h-24 w-full bg-slate-100 sm:h-28 lg:h-32">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            {product.isNew ? <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white">New</span> : null}
          </div>
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5 sm:p-3">
          <div className="flex min-w-0 items-center justify-between gap-2 text-[10px] font-semibold text-muted sm:text-[11px]">
            <span className="truncate">{product.brand}</span>
            <span className="shrink-0 text-amber-600">★ {product.rating.toFixed(1)}</span>
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 break-words text-xs font-bold text-ink sm:text-sm">{product.name}</h3>
            <p className="mt-1 truncate text-[10px] text-muted sm:text-xs">{lowestVariant?.label ?? product.variants[0]?.label ?? product.eta}</p>
          </div>
          <div className="mt-auto flex flex-col gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-muted">Starts at</p>
              <p className="text-sm font-extrabold text-ink sm:text-base">{lowestVariant ? formatCurrency(lowestVariant.salePrice) : '—'}</p>
            </div>
            {lowestVariant ? <AddToCartButton variantId={lowestVariant.id} className="btn-primary min-h-[38px] w-full rounded-xl px-2.5 py-2 text-[11px] sm:min-h-[40px] sm:text-xs" /> : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="card flex h-full min-w-0 flex-col overflow-hidden">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative h-32 w-full bg-slate-100 min-[360px]:h-36 sm:h-48 xl:h-56">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
          {product.isNew ? <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:px-3 sm:text-xs">New</span> : null}
        </div>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col space-y-2 p-3 sm:space-y-3 sm:p-4">
        <div className="flex min-w-0 items-center justify-between gap-2 text-[11px] font-semibold text-muted sm:text-xs">
          <span className="truncate">{product.brand}</span>
          <span className="shrink-0">{product.eta}</span>
        </div>
        <div className="min-w-0">
          <h3 className="line-clamp-2 break-words text-sm font-bold text-ink sm:text-base">{product.name}</h3>
          <p className="mt-1 line-clamp-2 break-words text-xs text-muted sm:text-sm">{product.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.variants.slice(0, 2).map((variant) => (
            <span key={variant.id} className="chip px-2.5 py-1 text-[10px] leading-4 sm:px-3 sm:text-xs">
              {variant.label}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted sm:text-xs">Starts at</p>
            <p className="text-base font-extrabold text-ink sm:text-lg">{lowestVariant ? formatCurrency(lowestVariant.salePrice) : '—'}</p>
            <p className="text-[11px] text-muted line-through sm:text-xs">{lowestVariant ? formatCurrency(lowestVariant.mrp) : ''}</p>
            <p className={`mt-1 text-[11px] font-semibold sm:text-xs ${lowestVariant?.inStock ? 'text-emerald-600' : 'text-rose-600'}`}>{stockLabel}</p>
          </div>
          {lowestVariant ? <AddToCartButton variantId={lowestVariant.id} className="btn-primary min-h-[44px] w-full px-3 py-2 text-xs sm:px-4 sm:text-sm" /> : null}
        </div>
      </div>
    </article>
  );
}
