'use client';

import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' }
] as const;

export function ShopSortControl({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (nextValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', nextValue);
    }
    const query = params.toString();
    router.push((query ? `${pathname}?${query}` : pathname) as Route);
  };

  return (
    <label className="flex w-full flex-col gap-2 text-sm font-semibold text-slate-600 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
      <span>Sort</span>
      <select
        className="min-h-[44px] w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
