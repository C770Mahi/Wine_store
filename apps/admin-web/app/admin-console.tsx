'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const orderStatuses = ['created', 'confirmed', 'packed', 'out_for_delivery', 'assigned', 'picked_up', 'delivered', 'cancelled'];

type AdminPageMode = 'overview' | 'customers' | 'orders' | 'products' | 'product-add' | 'categories';

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
  delivery_contact_name: string;
  delivery_mobile: string;
  delivery_address: string;
  delivery_latitude: number | string | null;
  delivery_longitude: number | string | null;
  google_map_link: string | null;
  transaction_id: string | null;
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
  shortDescription: string;
  longDescription: string;
  description: string;
  image: string;
  eta: string;
  createdAt: string;
  isNew: boolean;
  variants: Array<{
    id: string;
    inventoryId?: string;
    volumeMl: number;
    packType: 'g' | 'ml' | 'pcs';
    label: string;
    mrp: number;
    salePrice: number;
    stockQty: number;
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
  id?: string;
  inventoryId?: string;
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

const categoryBrandPreferences = [
  { pattern: /fruit/i, brandName: 'Farm Basket' },
  { pattern: /vegetable/i, brandName: 'Fresh Fields' },
  { pattern: /dairy|bakery/i, brandName: 'Daily Fresh' },
  { pattern: /clean/i, brandName: 'Vim' },
  { pattern: /home care/i, brandName: 'Vim' },
  { pattern: /grocery|kitchen|snacks|daily/i, brandName: 'Aashirvaad' }
];

function getDefaultBrandId(categoryId: string, options: ProductOptions) {
  const categoryName = options.categories.find((category) => category.id === categoryId)?.name ?? '';
  const preferredBrandName = categoryBrandPreferences.find((entry) => entry.pattern.test(categoryName))?.brandName;
  const preferredBrand = preferredBrandName
    ? options.brands.find((brand) => brand.name === preferredBrandName)
    : options.brands.find((brand) => brand.name === 'Fresh Fields');

  return preferredBrand?.id ?? options.brands[0]?.id ?? '';
}

function createEmptyProductForm(options?: ProductOptions): ProductFormState {
  const categoryId = options?.categories[0]?.id ?? '';
  return {
    name: '',
    categoryId,
    brandId: options ? getDefaultBrandId(categoryId, options) : '',
    shortDescription: '',
    longDescription: '',
    imageUrl: '',
    imageDataUrl: '',
    imageName: '',
    variants: [emptyVariant()]
  };
}

function createProductFormFromProduct(product: ProductRow, options: ProductOptions): ProductFormState {
  return {
    name: product.name,
    categoryId: options.categories.find((category) => category.name === product.category)?.id ?? options.categories[0]?.id ?? '',
    brandId: options.brands.find((brand) => brand.name === product.brand)?.id ?? options.brands[0]?.id ?? '',
    shortDescription: product.shortDescription,
    longDescription: product.longDescription,
    imageUrl: product.image,
    imageDataUrl: '',
    imageName: '',
    variants: product.variants.length
      ? product.variants.map((variant) => ({
          id: variant.id,
          inventoryId: variant.inventoryId,
          quantity: String(variant.volumeMl),
          packType: variant.packType,
          mrp: String(variant.mrp),
          salePrice: String(variant.salePrice),
          stockQty: String(variant.stockQty)
        }))
      : [emptyVariant()]
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

function getActionErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  if (/route not found/i.test(message)) {
    return 'The current API deployment is missing this admin category route. Redeploy the API and try again.';
  }
  return message;
}

async function apiFetch<T>(path: string, init?: RequestInit) {
  const method = init?.method ?? 'GET';

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {})
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ message: 'Request failed' })) as {
        message?: string;
        issues?: Array<{ path?: string; message?: string }>;
      };
      const issueMessage = payload.issues?.map((issue) => issue.path ? `${issue.path}: ${issue.message}` : issue.message).filter(Boolean).join('; ');
      const message = issueMessage || payload.message || `Request failed with ${response.status}`;

      console.error('Admin API request failed', {
        path,
        method,
        status: response.status,
        payload
      });

      throw new Error(message);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof TypeError) {
      console.error('Admin API network error', {
        path,
        method,
        error
      });
    }
    throw error;
  }
}

const pageMeta: Record<AdminPageMode, { eyebrow: string; title: string; description: string }> = {
  overview: {
    eyebrow: 'Admin home',
    title: 'Near Kart operations home',
    description: 'Open the exact admin workspace you need: monitor customers, handle orders, add products, or manage the live catalog.'
  },
  customers: {
    eyebrow: 'Customers',
    title: 'Customer monitor',
    description: 'Track customer activity, status, order count, and basket engagement from one dedicated page.'
  },
  orders: {
    eyebrow: 'Orders',
    title: 'Order monitor',
    description: 'Review order history and update delivery status without mixing it with the rest of the admin tools.'
  },
  products: {
    eyebrow: 'Manage products',
    title: 'Catalog manager',
    description: 'Search the live catalog, edit products, remove them from the storefront, and monitor stock in one place.'
  },
  'product-add': {
    eyebrow: 'Add products',
    title: 'Create a new product',
    description: 'Add a new product with image, pricing, pack variants, and stock, then let it appear first on the storefront.'
  },
  categories: {
    eyebrow: 'Manage categories',
    title: 'Category manager',
    description: 'Create, rename, and delete catalog categories from one dedicated workspace.'
  }
};

const quickLinks = [
  { href: '/', label: 'Home', description: 'Overview, KPIs, and quick actions' },
  { href: '/customers', label: 'Customers', description: 'Customer monitor page' },
  { href: '/orders', label: 'Orders', description: 'Order tracking and status updates' },
  { href: '/products/add', label: 'Add product', description: 'Create new catalog items' },
  { href: '/products', label: 'Manage products', description: 'Edit, remove, and search products' },
  { href: '/categories', label: 'Manage categories', description: 'Create, rename, and remove categories' }
];

export function AdminConsole({ mode }: { mode: AdminPageMode }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOptions>({ categories: [], brands: [] });
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, InventoryDraft>>({});
  const [productForm, setProductForm] = useState<ProductFormState>(createEmptyProductForm());
  const [editingProductId, setEditingProductId] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [categoryDraftName, setCategoryDraftName] = useState('');
  const [categoryEditName, setCategoryEditName] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productBrandFilter, setProductBrandFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const lowStockItems = useMemo(
    () => inventory.filter((item) => item.stock_qty <= item.low_stock_threshold || !item.is_in_stock),
    [inventory]
  );

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || [product.name, product.brand, product.category, product.description].some((value) => value.toLowerCase().includes(query));
      const matchesCategory = productCategoryFilter === 'All' || product.category === productCategoryFilter;
      const matchesBrand = productBrandFilter === 'All' || product.brand === productBrandFilter;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [productBrandFilter, productCategoryFilter, productSearch, products]);

  const categoriesWithCounts = useMemo(
    () => productOptions.categories.map((category) => ({
      ...category,
      productCount: products.filter((product) => product.category === category.name).length
    })),
    [productOptions.categories, products]
  );

  const groupedFilteredProducts = useMemo(
    () => categoriesWithCounts
      .map((category) => ({
        ...category,
        products: filteredProducts.filter((product) => product.category === category.name)
      }))
      .filter((category) => category.products.length > 0),
    [categoriesWithCounts, filteredProducts]
  );

  const isEditingProduct = Boolean(editingProductId);
  const meta = pageMeta[mode];

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

  const applyCatalogState = (inventoryPayload: InventoryRow[], productsPayload: ProductRow[], optionsPayload: ProductOptions) => {
    setInventory(inventoryPayload);
    setProducts(productsPayload);
    setProductOptions(optionsPayload);
    syncInventoryDrafts(inventoryPayload);
    setProductForm((current) => {
      const hasCategory = optionsPayload.categories.some((category) => category.id === current.categoryId);
      const categoryId = hasCategory ? current.categoryId : optionsPayload.categories[0]?.id || '';
      const hasBrand = optionsPayload.brands.some((brand) => brand.id === current.brandId);
      const brandId = hasBrand ? current.brandId : getDefaultBrandId(categoryId, optionsPayload);
      return {
        ...current,
        categoryId,
        brandId
      };
    });
    setProductCategoryFilter((current) => current === 'All' || optionsPayload.categories.some((category) => category.name === current) ? current : 'All');
    setProductBrandFilter((current) => current === 'All' || optionsPayload.brands.some((brand) => brand.name === current) ? current : 'All');
  };

  const loadCatalogState = async () => {
    const [inventoryPayload, productsPayload, optionsPayload] = await Promise.all([
      apiFetch<InventoryRow[]>('/admin/inventory'),
      apiFetch<ProductRow[]>('/admin/products'),
      apiFetch<ProductOptions>('/admin/product-options')
    ]);
    applyCatalogState(inventoryPayload, productsPayload, optionsPayload);
  };

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      await loadCatalogState();

      if (mode === 'overview') {
        const [dashboardPayload, ordersPayload, customersPayload] = await Promise.all([
          apiFetch<DashboardData>('/admin/dashboard'),
          apiFetch<OrderRow[]>('/admin/orders'),
          apiFetch<CustomerRow[]>('/admin/customers')
        ]);
        setDashboard(dashboardPayload);
        setOrders(ordersPayload);
        setCustomers(customersPayload);
      }

      if (mode === 'orders') {
        setOrders(await apiFetch<OrderRow[]>('/admin/orders'));
      }

      if (mode === 'customers') {
        setCustomers(await apiFetch<CustomerRow[]>('/admin/customers'));
      }
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

  const resetProductForm = () => {
    setEditingProductId('');
    setProductForm(createEmptyProductForm(productOptions));
  };

  const startEditProduct = (product: ProductRow) => {
    setEditingProductId(product.id);
    setProductForm(createProductFormFromProduct(product, productOptions));
    setNotice('Editing product details. Save to publish changes.');
    setError('');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const imageDataUrl = reader.result;
        setProductForm((current) => ({
          ...current,
          imageDataUrl,
          imageUrl: '',
          imageName: file.name
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = productForm.name.trim();
    const categoryId = productForm.categoryId.trim();
    const shortDescription = productForm.shortDescription.trim() || `${trimmedName} available on Near Kart.`;
    const longDescription = productForm.longDescription.trim() || `${trimmedName} is available on Near Kart with quick delivery and category-wise inventory tracking.`;
    const brandId = productForm.brandId || getDefaultBrandId(categoryId, productOptions);
    const variants = productForm.variants.map((variant) => ({
      id: variant.id,
      inventoryId: variant.inventoryId,
      quantity: Number(variant.quantity),
      packType: variant.packType,
      mrp: Number(variant.mrp),
      salePrice: Number(variant.salePrice),
      stockQty: Number(variant.stockQty)
    }));

    if (!trimmedName) {
      setError('Enter a product name before saving.');
      setNotice('');
      return;
    }

    if (!categoryId) {
      setError('Select a category before saving the product.');
      setNotice('');
      return;
    }

    if (!variants.length || variants.some((variant) => !variant.quantity || variant.quantity <= 0 || Number.isNaN(variant.quantity) || variant.mrp < 0 || Number.isNaN(variant.mrp) || variant.salePrice < 0 || Number.isNaN(variant.salePrice) || variant.stockQty < 0 || Number.isNaN(variant.stockQty))) {
      setError('Add at least one valid pack with quantity, prices, and stock.');
      setNotice('');
      return;
    }

    setBusyKey('product-submit');
    setError('');
    setNotice('');

    try {
      const payload = {
        name: trimmedName,
        categoryId,
        brandId,
        shortDescription,
        longDescription,
        imageUrl: productForm.imageUrl || undefined,
        imageDataUrl: productForm.imageDataUrl || undefined,
        variants
      };

      if (editingProductId) {
        await apiFetch(`/admin/products/${editingProductId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...payload,
            isActive: true
          })
        });
        setNotice('Product updated successfully.');
      } else {
        await apiFetch('/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setNotice('Product created successfully.');
      }

      resetProductForm();
      await loadCatalogState();
    } catch (err) {
      setError(getActionErrorMessage(err, editingProductId ? 'Unable to update product.' : 'Unable to create product.'));
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setBusyKey(`product-delete:${productId}`);
    setError('');
    setNotice('');

    try {
      await apiFetch(`/admin/products/${productId}`, {
        method: 'DELETE'
      });
      if (editingProductId === productId) {
        resetProductForm();
      }
      await loadCatalogState();
      setNotice('Product removed from the live catalog.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove product.');
    } finally {
      setBusyKey('');
    }
  };

  const handleCategoryCreate = async () => {
    const name = categoryDraftName.trim();
    if (!name) {
      setError('Enter a category name before adding it.');
      setNotice('');
      return;
    }

    setBusyKey('category-create');
    setError('');
    setNotice('');

    try {
      await apiFetch('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name })
      });
      setCategoryDraftName('');
      await loadCatalogState();
      setNotice('Category created successfully.');
    } catch (err) {
      setError(getActionErrorMessage(err, 'Unable to create category.'));
    } finally {
      setBusyKey('');
    }
  };

  const startEditCategory = (category: ProductOption) => {
    setEditingCategoryId(category.id);
    setCategoryEditName(category.name);
    setError('');
    setNotice('Editing category name. Save to update the dashboard and storefront.');
  };

  const handleCategoryUpdate = async () => {
    const name = categoryEditName.trim();
    if (!editingCategoryId) {
      return;
    }

    if (!name) {
      setError('Enter the updated category name before saving.');
      setNotice('');
      return;
    }

    setBusyKey(`category-save:${editingCategoryId}`);
    setError('');
    setNotice('');

    try {
      await apiFetch(`/admin/categories/${editingCategoryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name })
      });
      setEditingCategoryId('');
      setCategoryEditName('');
      await loadCatalogState();
      setNotice('Category updated successfully.');
    } catch (err) {
      setError(getActionErrorMessage(err, 'Unable to update category.'));
    } finally {
      setBusyKey('');
    }
  };

  const handleDeleteCategory = async (category: ProductOption & { productCount: number }) => {
    const hasSingleProduct = category.productCount === 1;
    const productLabel = `${category.productCount} ${hasSingleProduct ? 'product' : 'products'}`;
    const confirmationMessage = category.productCount > 0
      ? `Are you sure you want to delete this category?\n\n${category.name} currently contains ${productLabel}. Deleting this category will also remove ${hasSingleProduct ? 'that product' : 'those products'} from the live catalog.`
      : 'Are you sure you want to delete this category?';

    if (typeof window !== 'undefined' && !window.confirm(confirmationMessage)) {
      return;
    }

    setBusyKey(`category-delete:${category.id}`);
    setError('');
    setNotice('');

    try {
      await apiFetch(`/admin/categories/${category.id}`, {
        method: 'DELETE',
        body: JSON.stringify({
          deleteProducts: category.productCount > 0
        })
      });

      if (editingCategoryId === category.id) {
        setEditingCategoryId('');
        setCategoryEditName('');
      }
      if (productForm.categoryId === category.id) {
        resetProductForm();
      }
      await loadCatalogState();
      setNotice(category.productCount > 0
        ? `Category deleted. ${productLabel.charAt(0).toUpperCase()}${productLabel.slice(1)} ${hasSingleProduct ? 'was' : 'were'} also removed from the live catalog.`
        : 'Category deleted successfully.');
    } catch (err) {
      setError(getActionErrorMessage(err, 'Unable to delete category.'));
    } finally {
      setBusyKey('');
    }
  };

  const renderProductForm = (createOnly: boolean) => (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{createOnly ? 'Add product' : isEditingProduct ? 'Edit product' : 'Product editor'}</h2>
          <p className="mt-1 text-sm text-slate-300">
            {createOnly
              ? 'Create a new product with image, pack sizes, pricing, and stock.'
              : isEditingProduct
                ? 'Update selected product details and publish changes to the storefront.'
                : 'Choose a product from the catalog below to edit it here.'}
          </p>
        </div>
        {isEditingProduct ? (
          <button type="button" className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white" onClick={resetProductForm}>
            Cancel edit
          </button>
        ) : null}
      </div>

      {!createOnly && !isEditingProduct ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-6 text-sm text-slate-300">
          Select <strong>Edit</strong> on any product card below to load it into this editor.
        </div>
      ) : (
        <form className="mt-5 space-y-4" onSubmit={handleProductSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <input
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                placeholder="Product name"
                value={productForm.name}
                onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
              />
              {createOnly ? <p className="text-xs text-slate-400">Enter the exact product name you want to add, such as Apple, Banana, or Mango.</p> : null}
            </div>
            <div className="space-y-2">
              <select
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                value={productForm.categoryId}
                onChange={(event) => {
                  const nextCategoryId = event.target.value;
                  setProductForm((current) => ({
                    ...current,
                    categoryId: nextCategoryId,
                    brandId: getDefaultBrandId(nextCategoryId, productOptions)
                  }));
                }}
              >
                {productOptions.categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400">Every product must belong to a category. Brand is assigned automatically.</p>
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
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                onChange={handleImageUpload}
              />
              {createOnly ? <p className="text-xs text-slate-400">Upload a product image here, or paste a direct image URL in the field beside it.</p> : null}
            </div>
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
              <div key={`${variant.id ?? 'new'}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]">
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

          <button className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white disabled:opacity-60" disabled={busyKey === 'product-submit'}>
            {busyKey === 'product-submit' ? (isEditingProduct ? 'Saving changes...' : 'Creating product...') : (isEditingProduct ? 'Save changes' : 'Create product')}
          </button>
        </form>
      )}
    </article>
  );

  const renderOrderMonitor = () => (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Order monitor</h2>
          <p className="mt-1 text-sm text-slate-300">Track orders, payment status, transaction IDs, customer details, and delivery addresses from one table.</p>
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
              <th className="pb-3 pr-4">Delivery address</th>
              <th className="pb-3 pr-4">Total</th>
              <th className="pb-3 pr-4">Payment</th>
              <th className="pb-3 pr-4">Placed</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-white/10 align-top">
                <td className="py-3 pr-4 text-slate-300">
                  <div className="font-semibold text-white">{order.order_number}</div>
                  <div className="mt-1 text-xs text-slate-500">Transaction ID: {order.transaction_id ?? 'Pending'}</div>
                </td>
                <td className="py-3 pr-4 text-slate-300">
                  <div className="font-semibold text-white">{order.customer_name}</div>
                  <div className="text-xs text-slate-500">{order.customer_mobile}</div>
                </td>
                <td className="py-3 pr-4 text-slate-300">
                  <div className="font-semibold text-white">{order.delivery_contact_name}</div>
                  <div className="text-xs text-slate-500">{order.delivery_mobile}</div>
                  <div className="mt-2 text-xs text-slate-400">{order.delivery_address}</div>
                  {order.delivery_latitude != null && order.delivery_longitude != null ? (
                    <div className="mt-2 text-xs text-slate-500">{Number(order.delivery_latitude).toFixed(6)}, {Number(order.delivery_longitude).toFixed(6)}</div>
                  ) : null}
                  {order.google_map_link ? (
                    <a href={order.google_map_link} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-xl border border-emerald-400/30 px-3 py-2 text-xs font-semibold text-emerald-100">
                      View on Map
                    </a>
                  ) : null}
                </td>
                <td className="py-3 pr-4 text-slate-300">{formatCurrency(Number(order.grand_total))}</td>
                <td className="py-3 pr-4 text-slate-300">
                  <div className="font-semibold text-white">{order.payment_status}</div>
                  <div className="mt-1 text-xs text-slate-500">Transaction ID: {order.transaction_id ?? 'Pending'}</div>
                </td>
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
  );

  const renderCustomerMonitor = () => (
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
  );

  const renderInventoryWatchlist = () => (
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
  );

  const renderCategoryManager = () => (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage categories</h2>
          <p className="mt-1 text-sm text-slate-300">Create, rename, and delete categories while keeping products organised under each section.</p>
        </div>
        <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">{categoriesWithCounts.length} categories</span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <input
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
          placeholder="Category name"
          value={categoryDraftName}
          onChange={(event) => setCategoryDraftName(event.target.value)}
        />
        <button
          type="button"
          className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          onClick={() => void handleCategoryCreate()}
          disabled={busyKey === 'category-create'}
        >
          {busyKey === 'category-create' ? 'Adding...' : 'Add category'}
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {categoriesWithCounts.map((category) => {
          const productLabel = `${category.productCount} ${category.productCount === 1 ? 'Product' : 'Products'}`;
          return (
            <article key={category.id} className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {editingCategoryId === category.id ? (
                  <div className="grid flex-1 gap-3 md:grid-cols-[1fr_auto_auto]">
                    <input
                      className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                      value={categoryEditName}
                      onChange={(event) => setCategoryEditName(event.target.value)}
                    />
                    <button
                      type="button"
                      className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      onClick={() => void handleCategoryUpdate()}
                      disabled={busyKey === `category-save:${category.id}`}
                    >
                      {busyKey === `category-save:${category.id}` ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white"
                      onClick={() => {
                        setEditingCategoryId('');
                        setCategoryEditName('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-white">{category.name} <span className="text-sm font-medium text-slate-400">({productLabel})</span></h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button type="button" className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white" onClick={() => startEditCategory(category)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-60"
                        onClick={() => void handleDeleteCategory(category)}
                        disabled={busyKey === `category-delete:${category.id}`}
                      >
                        {busyKey === `category-delete:${category.id}` ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </article>
          );
        })}
        {!categoriesWithCounts.length && !loading ? <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-6 text-sm text-slate-400">No categories found yet.</div> : null}
      </div>
    </section>
  );

  const renderCatalogList = () => (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Current catalog</h2>
          <p className="mt-1 text-sm text-slate-300">Review, search, filter, and manage products grouped under their categories.</p>
        </div>
        <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">{filteredProducts.length} / {products.length} products</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <input
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
          placeholder="Search products, categories, brands"
          value={productSearch}
          onChange={(event) => setProductSearch(event.target.value)}
        />
        <select
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
          value={productCategoryFilter}
          onChange={(event) => setProductCategoryFilter(event.target.value)}
        >
          <option value="All">All categories</option>
          {productOptions.categories.map((category) => (
            <option key={category.id} value={category.name}>{category.name}</option>
          ))}
        </select>
        <select
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
          value={productBrandFilter}
          onChange={(event) => setProductBrandFilter(event.target.value)}
        >
          <option value="All">All brands</option>
          {productOptions.brands.map((brand) => (
            <option key={brand.id} value={brand.name}>{brand.name}</option>
          ))}
        </select>
      </div>
      <div className="mt-6 space-y-6">
        {groupedFilteredProducts.map((group) => (
          <div key={group.id} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3">
              <div>
                <h3 className="text-lg font-bold text-white">{group.name}</h3>
                <p className="text-sm text-slate-400">{group.products.length} product(s) in this category</p>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setProductForm((current) => ({
                  ...current,
                  categoryId: group.id,
                  brandId: getDefaultBrandId(group.id, productOptions)
                }))}
              >
                Add product here
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.products.map((product) => (
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
                  <div className="mt-5 flex gap-3">
                    <button type="button" className="rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white" onClick={() => startEditProduct(product)}>
                      Edit
                    </button>
                    <button type="button" className="rounded-2xl border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-60" onClick={() => void handleDeleteProduct(product.id)} disabled={busyKey === `product-delete:${product.id}`}>
                      {busyKey === `product-delete:${product.id}` ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
        {!groupedFilteredProducts.length ? <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-6 text-sm text-slate-400">No products match the current search/filter.</div> : null}
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">{meta.eyebrow}</p>
            <h1 className="mt-2 text-4xl font-black">{meta.title}</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300">{meta.description}</p>
          </div>
          {mode === 'products' ? (
            <Link href="/products/add" className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white">
              Add new product
            </Link>
          ) : null}
          {mode === 'product-add' ? (
            <Link href="/products" className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white">
              Manage products
            </Link>
          ) : null}
          {mode === 'categories' ? (
            <Link href="/products" className="rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold text-white">
              Manage products
            </Link>
          ) : null}
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
      {notice ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{notice}</div> : null}

      {mode === 'overview' ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboardCards.map((card) => (
              <article key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-3 text-3xl font-extrabold">{card.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {quickLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-emerald-400/40 hover:bg-slate-900">
                <p className="text-lg font-bold text-white">{item.label}</p>
                <p className="mt-2 text-sm text-slate-400">{item.description}</p>
              </Link>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            {renderInventoryWatchlist()}
            {renderOrderMonitor()}
          </section>
        </>
      ) : null}

      {mode === 'customers' ? renderCustomerMonitor() : null}
      {mode === 'orders' ? renderOrderMonitor() : null}
      {mode === 'product-add' ? renderProductForm(true) : null}
      {mode === 'categories' ? renderCategoryManager() : null}

      {mode === 'products' ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            {renderInventoryWatchlist()}
            {renderProductForm(false)}
          </section>
          {renderCatalogList()}
        </>
      ) : null}
    </div>
  );
}
