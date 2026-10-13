import Link from 'next/link';
import { Category } from '@/lib/catalog';

interface CategoryRailProps {
  categories: Category[];
}

export function CategoryRail({ categories }: CategoryRailProps) {
  return (
    <section className="page-shell mt-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand">Categories</p>
          <h2 className="mt-2 text-2xl font-extrabold text-ink">Browse by collection</h2>
        </div>
        <Link href="/shop" className="text-sm font-semibold text-brand">View all</Link>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((category) => (
          <Link key={category} href={`/shop?category=${encodeURIComponent(category)}`} className="card p-5 transition hover:-translate-y-0.5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-dark">🛒</div>
            <p className="text-base font-bold text-ink">{category}</p>
            <p className="mt-1 text-sm text-muted">Quick delivery selection</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
