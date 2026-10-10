interface FilterSidebarProps {
  brands: string[];
  volumes: string[];
  priceBands: string[];
}

export function FilterSidebar({ brands, volumes, priceBands }: FilterSidebarProps) {
  return (
    <aside className="card h-fit space-y-6 p-5">
      <div>
        <h3 className="text-lg font-bold text-ink">Filters</h3>
        <p className="text-sm text-muted">Brand, price, volume and rating filters for quick ordering.</p>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-ink">Brands</p>
        <div className="space-y-2 text-sm text-muted">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>{brand}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-ink">Volume</p>
        <div className="flex flex-wrap gap-2">
          {volumes.map((volume) => (
            <span key={volume} className="chip px-3 py-1 text-xs">{volume}</span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-ink">Price range</p>
        <div className="space-y-2 text-sm text-muted">
          {priceBands.map((priceBand) => (
            <label key={priceBand} className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>{priceBand}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
