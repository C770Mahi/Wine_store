import Link from 'next/link';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { Product, formatCurrency } from '@/lib/catalog';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const lowestVariant = product.variants[0];

  return (
    <article className="card overflow-hidden">
      <Link href={`/product/${product.slug}`}>
        <div className="relative h-40 w-full bg-slate-100 sm:h-56">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          {product.isNew ? <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:text-xs">New</span> : null}
        </div>
      </Link>
      <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-muted sm:text-xs">
          <span className="truncate">{product.brand}</span>
          <span className="shrink-0">{product.eta}</span>
        </div>
        <div>
          <h3 className="line-clamp-2 text-sm font-bold text-ink sm:text-base">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">{product.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.variants.slice(0, 2).map((variant) => (
            <span key={variant.id} className="chip px-2.5 py-1 text-[10px] sm:px-3 sm:text-xs">
              {variant.label}
            </span>
          ))}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted sm:text-xs">Starts at</p>
            <p className="text-base font-extrabold text-ink sm:text-lg">{lowestVariant ? formatCurrency(lowestVariant.salePrice) : '—'}</p>
            <p className="text-[11px] text-muted line-through sm:text-xs">{lowestVariant ? formatCurrency(lowestVariant.mrp) : ''}</p>
          </div>
          {lowestVariant ? <AddToCartButton variantId={lowestVariant.id} className="btn-primary px-3 py-2 text-xs sm:px-4 sm:text-sm" /> : null}
        </div>
      </div>
    </article>
  );
}
