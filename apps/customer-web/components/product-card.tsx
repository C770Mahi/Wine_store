import Image from 'next/image';
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
        <div className="relative h-56 w-full bg-slate-100">
          <Image src={product.image} alt={product.name} fill className="object-cover" />
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-muted">
          <span>{product.brand}</span>
          <span>{product.eta}</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-ink">{product.name}</h3>
          <p className="mt-1 text-sm text-muted line-clamp-2">{product.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.variants.slice(0, 3).map((variant) => (
            <span key={variant.id} className="chip px-3 py-1 text-xs">
              {variant.label}
            </span>
          ))}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted">Starts at</p>
            <p className="text-lg font-extrabold text-ink">{lowestVariant ? formatCurrency(lowestVariant.salePrice) : '—'}</p>
            <p className="text-xs text-muted line-through">{lowestVariant ? formatCurrency(lowestVariant.mrp) : ''}</p>
          </div>
          {lowestVariant ? <AddToCartButton variantId={lowestVariant.id} /> : null}
        </div>
      </div>
    </article>
  );
}
