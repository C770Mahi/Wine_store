'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const orderStatuses = ['created', 'confirmed', 'packed', 'assigned', 'picked_up', 'delivered', 'cancelled'];

type DashboardData = {
  ordersToday: number;
  revenueToday: number;
  activeCustomers: number;
  lowStockSkus: number;
  pendingKycRequests: number;
  conversionRate: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  grand_total: number;
  created_at: string;
  customer_name: string;
  customer_mobile: string;
};

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: string;
  kyc_status: string;
  age_verified_at: string | null;
  orders: number;
  active_cart_items: number;
};

type InventoryRow = {
  id: string;
  product_id: string;
  variant_id: string;
  product: string;
  volume_ml: number;
  pack_type: string;
  stock_qty: number;
  low_stock_threshold: number;
  is_in_stock: boolean;
  label: string;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  rating: number;
  description: string;
  image: string;
  eta: string;
  variants: Array<{
    id: string;
    label: string;
    mrp: number;
    salePrice: number;
    inStock: boolean;
  }>;
};

type ProductOption = {
  id: string;
  name: string;
};

type ProductOptions = {
  categories: ProductOption[];
  brands: ProductOption[];
};

type VariantForm = {
  quantity: string;
  packType: 'g' | 'ml' | 'pcs';
  mrp: string;
  salePrice: string;
  stockQty: string;
};

type ProductFormState = {
  name: string;
  categoryId: string;
  brandId: string;
  shortDescription: string;
  longDescription: string;
  imageUrl: string;
  imageDataUrl: string;
  imageName: string;
  variants: VariantForm[];
};

type InventoryDraft = {
  stockQty: string;
  isInStock: boolean;
};

const emptyVariant = (): VariantForm => ({
  quantity: '',
  packType: 'g',
  mrp: '',
  salePrice: '',
  stockQty: ''
});

function createEmptyProductForm(options?: ProductOptions): ProductFormState {
  return {
    name: '',
    categoryId: options?.categories[0]?.id ?? '',
    brandId: options?.brands[0]?.id ?? '',
    shortDescription: '',
    longDescription: '',
    imageUrl: '',
    imageDataUrl: '',
    imageName: '',
    variants: [emptyVariant()]
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function apiFetch<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(payload.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOptions>({ categories: [], brands: [] });
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, InventoryDraft>>({});
  const [productForm, setProductForm] = useState<ProductFormState>(createEmptyProductForm());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const lowStockItems = useMemo(
    () => inventory.filter((item) => item.stock_qty <= item.low_stock_threshold || !item.is_in_stock),
    [inventory]
  );

  const dashboardCards = useMemo(() => ([
    { label: 'Orders today', value: String(dashboard?.ordersToday ?? 0) },
    { label: 'Revenue today', value: formatCurrency(dashboard?.revenueToday ?? 0) },
    { label: 'Customers', value: String(dashboard?.activeCustomers ?? customers.length) },
    { label: 'Low stock items', value: String(dashboard?.lowStockSkus ?? lowStockItems.length) },
    { label: 'Catalog products', value: String(products.length) },
    { label: 'Categories live', value: String(productOptions.categories.length) }
  ]), [customers.length, dashboard, lowStockItems.length, productOptions.categories.length, products.length]);

  const syncInventoryDrafts = (rows: InventoryRow[]) => {
    setInventoryDrafts(Object.fromEntries(rows.map((item) => [item.id, {
      stockQty: String(item.stock_qty),
      isInStock: item.is_in_stock
    }])));
  };

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const [dashboardPayload, ordersPayload, customersPayload, inventoryPayload, productsPayload, optionsPayload] = await Promise.all([
        apiFetch<DashboardData>('/admin/dashboard'),
        apiFetch<OrderRow[]>('/admin/orders'),
        apiFetch<CustomerRow[]>('/admin/customers'),
        apiFetch<InventoryRow[]>('/admin/inventory'),
        apiFetch<ProductRow[]>('/admin/products'),
        apiFetch<ProductOptions>('/admin/product-options')
      ]);

      setDashboard(dashboardPayload);
      setOrders(ordersPayload);
      setCustomers(customersPayload);
      setInventory(inventoryPayload);
      setProducts(productsPayload);
      setProductOptions(optionsPayload);
      syncInventoryDrafts(inventoryPayload);
      setProductForm((current) => ({
        ...current,
        categoryId: current.categoryId || optionsPayload.categories[0]?.id || '',
        brandId: current.brandId || optionsPayload.brands[0]?.id || ''
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    setBusyKey(`order:${orderId}`);
    setError('');
    setNotice('');

    try {
      await apiFetch(`/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order));
      setNotice('Order status updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update order status.');
    } finally {
      setBusyKey('');
    }
  };

  const handleInventoryDraftChange = (inventoryId: string, patch: Partial<InventoryDraft>) => {
    setInventoryDrafts((current) => ({
      ...current,
      [inventoryId]: {
        stockQty: current[inventoryId]?.stockQty ?? '0',
        isInStock: current[inventoryId]?.isInStock ?? true,
        ...patch
      }
    }));
  };

  const handleInventorySave = async (inventoryId: string) => {
    const draft = inventoryDrafts[inventoryId];
    if (!draft) {
      return;
    }

    setBusyKey(`inventory:${inventoryId}`);
    setError('');
    setNotice('');

    try {
      await apiFetch(`/admin/inventory/${inventoryId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          stockQty: Number(draft.stockQty),
          isInStock: draft.isInStock
        })
      });
      setInventory((current) => current.map((item) => item.id === inventoryId ? {
        ...item,
        stock_qty: Number(draft.stockQty),
        is_in_stock: draft.isInStock
      } : item));
      setNotice('Inventory updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update inventory.');
    } finally {
      setBusyKey('');
    }
  };

  const handleVariantChange = (index: number, patch: Partial<VariantForm>) => {
    setProductForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, ...patch } : variant)
    }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProductForm((current) => ({
          ...current,
          imageDataUrl: reader.result as string,
          imageUrl: '',
          imageName: file.name
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusyKey('product-create');
    setError('');
    setNotice('');

    try {
      await apiFetch('/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: productForm.name,
          categoryId: productForm.categoryId,
          brandId: productForm.brandId,
          shortDescription: productForm.shortDescription,
          longDescription: productForm.longDescription,
          imageUrl: productForm.imageUrl || undefined,
          imageDataUrl: productForm.imageDataUrl || undefined,
          variants: productForm.variants.map((variant) => ({
            quantity: Number(variant.quantity),
            packType: variant.packType,
            mrp: Number(variant.mrp),
            salePrice: Number(variant.salePrice),
            stockQty: Number(variant.stockQty)
          }))
        })
      });
      setNotice('Product created successfully.');
      setProductForm(createEmptyProductForm(productOptions));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create product.');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">Near Kart admin</p>
          <h1 className="mt-2 text-4xl font-black">Operations control center</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300">Monitor customers, track order status, manage inventory, and add new grocery products with image upload directly from the UI.</p>
        </header>

        {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
        {notice ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboardCards.map((card) => (
            <article key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-3 text-3xl font-extrabold">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Order monitor</h2>
                <p className="mt-1 text-sm text-slate-300">Track order history and update delivery status from one table.</p>
              </div>
              <button type="button" className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold" onClick={() => void load()}>
                Refresh
              </button>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3 pr-4">Order</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Total</th>
                    <th className="pb-3 pr-4">Payment</th>
                    <th className="pb-3 pr-4">Placed</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-white/10 align-top">
                      <td className="py-3 pr-4 font-semibold text-white">{order.order_number}</td>
                      <td className="py-3 pr-4 text-slate-300">
                        <div>{order.customer_name}</div>
                        <div className="text-xs text-slate-500">{order.customer_mobile}</div>
                      </td>
                      <td className="py-3 pr-4 text-slate-300">{formatCurrency(Number(order.grand_total))}</td>
                      <td className="py-3 pr-4 text-slate-300">{order.payment_status}</td>
                      <td className="py-3 pr-4 text-slate-300">{formatDate(order.created_at)}</td>
                      <td className="py-3">
                        <select
                          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
                          value={order.status}
                          disabled={busyKey === `order:${order.id}`}
                          onChange={(event) => void handleOrderStatusChange(order.id, event.target.value)}
                        >
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!orders.length && !loading ? <p className="py-4 text-sm text-slate-400">No orders found.</p> : null}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Customer monitor</h2>
            <p className="mt-1 text-sm text-slate-300">See customer count, activity, and current account status.</p>
            <div className="mt-5 space-y-3">
              {customers.map((customer) => (
                <div key={customer.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{customer.name}</p>
                      <p className="text-sm text-slate-400">{customer.email}</p>
                      <p className="text-sm text-slate-400">{customer.mobile}</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">{customer.status}</span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                    <div>Orders: <strong>{customer.orders}</strong></div>
                    <div>Cart items: <strong>{customer.active_cart_items}</strong></div>
                    <div>KYC status: <strong>{customer.kyc_status}</strong></div>
                  </div>
                </div>
              ))}
              {!customers.length && !loading ? <p className="text-sm text-slate-400">No customers found.</p> : null}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Inventory watchlist</h2>
            <p className="mt-1 text-sm text-slate-300">Update stock directly for low-stock or unavailable items.</p>
            <div className="mt-5 space-y-3">
              {lowStockItems.map((item) => {
                const draft = inventoryDrafts[item.id] ?? { stockQty: String(item.stock_qty), isInStock: item.is_in_stock };
                return (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-white">{item.product}</p>
                        <p className="text-sm text-slate-400">{item.label} · Threshold {item.low_stock_threshold}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          value={draft.stockQty}
                          onChange={(event) => handleInventoryDraftChange(item.id, { stockQty: event.target.value })}
                          className="w-24 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input
                            type="checkbox"
                            checked={draft.isInStock}
                            onChange={(event) => handleInventoryDraftChange(item.id, { isInStock: event.target.checked })}
                          />
                          In stock
                        </label>
                        <button
                          type="button"
                          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          onClick={() => void handleInventorySave(item.id)}
                          disabled={busyKey === `inventory:${item.id}`}
                        >
                          {busyKey === `inventory:${item.id}` ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!lowStockItems.length && !loading ? <p className="text-sm text-slate-400">All inventory is healthy right now.</p> : null}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Catalog studio</h2>
            <p className="mt-1 text-sm text-slate-300">Add new products, write descriptions, upload a photo, and define pack sizes from the UI.</p>
            <form className="mt-5 space-y-4" onSubmit={handleCreateProduct}>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                  placeholder="Product name"
                  value={productForm.name}
                  onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                    value={productForm.categoryId}
                    onChange={(event) => setProductForm((current) => ({ ...current, categoryId: event.target.value }))}
                  >
                    {productOptions.categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <select
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                    value={productForm.brandId}
                    onChange={(event) => setProductForm((current) => ({ ...current, brandId: event.target.value }))}
                  >
                    {productOptions.brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                placeholder="Short description"
                value={productForm.shortDescription}
                onChange={(event) => setProductForm((current) => ({ ...current, shortDescription: event.target.value }))}
              />
              <textarea
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                placeholder="Long description"
                value={productForm.longDescription}
                onChange={(event) => setProductForm((current) => ({ ...current, longDescription: event.target.value }))}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                  placeholder="Image URL (optional if you upload a file)"
                  value={productForm.imageUrl}
                  onChange={(event) => setProductForm((current) => ({ ...current, imageUrl: event.target.value, imageDataUrl: '', imageName: '' }))}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                  onChange={handleImageUpload}
                />
              </div>

              {productForm.imageDataUrl || productForm.imageUrl ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="mb-3 text-sm text-slate-300">Image preview {productForm.imageName ? `· ${productForm.imageName}` : ''}</p>
                  <img src={productForm.imageDataUrl || productForm.imageUrl} alt="Preview" className="h-36 w-36 rounded-2xl object-cover" />
                </div>
              ) : null}

              <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Pack variants</p>
                  <button type="button" className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white" onClick={() => setProductForm((current) => ({ ...current, variants: [...current.variants, emptyVariant()] }))}>
                    Add pack
                  </button>
                </div>
                {productForm.variants.map((variant, index) => (
                  <div key={`${index}-${variant.packType}`} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
                    <input
                      type="number"
                      min="1"
                      className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                      placeholder="Quantity"
                      value={variant.quantity}
                      onChange={(event) => handleVariantChange(index, { quantity: event.target.value })}
                    />
                    <select
                      className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                      value={variant.packType}
                      onChange={(event) => handleVariantChange(index, { packType: event.target.value as VariantForm['packType'] })}
                    >
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="pcs">pcs</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                      placeholder="MRP"
                      value={variant.mrp}
                      onChange={(event) => handleVariantChange(index, { mrp: event.target.value })}
                    />
                    <input
                      type="number"
                      min="0"
                      className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                      placeholder="Sale price"
                      value={variant.salePrice}
                      onChange={(event) => handleVariantChange(index, { salePrice: event.target.value })}
                    />
                    <input
                      type="number"
                      min="0"
                      className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                      placeholder="Stock"
                      value={variant.stockQty}
                      onChange={(event) => handleVariantChange(index, { stockQty: event.target.value })}
                    />
                    <button
                      type="button"
                      className="rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-100 disabled:opacity-50"
                      disabled={productForm.variants.length === 1}
                      onClick={() => setProductForm((current) => ({ ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={busyKey === 'product-create'}>
                {busyKey === 'product-create' ? 'Creating product...' : 'Create product'}
              </button>
            </form>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Current catalog</h2>
              <p className="mt-1 text-sm text-slate-300">Review products currently live on Near Kart.</p>
            </div>
            <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">{products.length} products</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
                <img src={product.image} alt={product.name} className="h-40 w-full rounded-2xl object-cover" />
                <div className="mt-4 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>{product.category}</span>
                  <span>{product.brand}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">{product.name}</h3>
                <p className="mt-2 text-sm text-slate-300">{product.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <span key={variant.id} className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                      {variant.label} · {formatCurrency(variant.salePrice)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
