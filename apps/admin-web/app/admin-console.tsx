'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';
const CUSTOM_PRESETS_STORAGE_KEY = 'near-kart-custom-presets';
const orderStatuses = ['created', 'confirmed', 'packed', 'assigned', 'picked_up', 'delivered', 'cancelled'];

type AdminPageMode = 'overview' | 'customers' | 'orders' | 'products' | 'product-add';

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

type ProductPreset = {
  key: string;
  category: string;
  name: string;
  brandName: string;
  imageUrl: string;
  shortDescription: string;
  longDescription: string;
  variants: Array<{
    quantity: string;
    packType: 'g' | 'ml' | 'pcs';
    mrp: string;
    salePrice: string;
    stockQty: string;
  }>;
};

type CustomPresetDraft = {
  name: string;
  imageUrl: string;
  imageDataUrl: string;
  imageName: string;
};

const emptyVariant = (): VariantForm => ({
  quantity: '',
  packType: 'g',
  mrp: '',
  salePrice: '',
  stockQty: ''
});

function createEmptyCustomPresetDraft(): CustomPresetDraft {
  return {
    name: '',
    imageUrl: '',
    imageDataUrl: '',
    imageName: ''
  };
}

function createPresetKey(category: string, name: string) {
  return `${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function createPresetVariant() {
  return {
    quantity: '',
    packType: 'g' as const,
    mrp: '',
    salePrice: '',
    stockQty: ''
  };
}

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
  }
};

const quickLinks = [
  { href: '/', label: 'Home', description: 'Overview, KPIs, and quick actions' },
  { href: '/customers', label: 'Customers', description: 'Customer monitor page' },
  { href: '/orders', label: 'Orders', description: 'Order tracking and status updates' },
  { href: '/products/add', label: 'Add product', description: 'Create new catalog items' },
  { href: '/products', label: 'Manage products', description: 'Edit, remove, and search products' }
];

const productPresets: ProductPreset[] = [
  {
    key: 'carrot',
    category: 'Vegetables',
    name: 'Carrot',
    brandName: 'Fresh Fields',
    imageUrl: '/catalog/carrot.jpg',
    shortDescription: 'Fresh crunchy carrots for salads, curries, and everyday cooking.',
    longDescription: 'Bright and fresh carrots selected for daily kitchen use, suitable for curries, stir-fries, soups, and salads.',
    variants: [{ quantity: '500', packType: 'g', mrp: '32', salePrice: '28', stockQty: '20' }]
  },
  {
    key: 'country-tomato',
    category: 'Vegetables',
    name: 'Country Tomato',
    brandName: 'Fresh Fields',
    imageUrl: '/catalog/country-tomato.jpg',
    shortDescription: 'Fresh red tomatoes ideal for curries, salads, and daily cooking.',
    longDescription: 'Farm-picked tomatoes with a juicy texture and bright colour for regular household cooking.',
    variants: [{ quantity: '500', packType: 'g', mrp: '38', salePrice: '32', stockQty: '20' }]
  },
  {
    key: 'potato',
    category: 'Vegetables',
    name: 'Potato',
    brandName: 'Fresh Fields',
    imageUrl: '/catalog/potato.jpg',
    shortDescription: 'Daily-use potatoes for curries, fries, and home cooking.',
    longDescription: 'Versatile potatoes selected for regular kitchen use, great for sabzi, fries, snacks, and family meals.',
    variants: [{ quantity: '1000', packType: 'g', mrp: '42', salePrice: '36', stockQty: '24' }]
  },
  {
    key: 'onion',
    category: 'Vegetables',
    name: 'Onion',
    brandName: 'Fresh Fields',
    imageUrl: '/catalog/onion.jpg',
    shortDescription: 'Fresh onions for gravies, salads, and everyday cooking.',
    longDescription: 'Kitchen-staple onions with balanced flavour, suited for curry bases, salads, and regular family cooking.',
    variants: [{ quantity: '1000', packType: 'g', mrp: '48', salePrice: '41', stockQty: '24' }]
  },
  {
    key: 'cucumber',
    category: 'Vegetables',
    name: 'Cucumber',
    brandName: 'Fresh Fields',
    imageUrl: '/catalog/cucumber.jpg',
    shortDescription: 'Cool and fresh cucumbers for salads and light meals.',
    longDescription: 'Fresh cucumbers chosen for salads, sandwiches, and simple healthy snack plates at home.',
    variants: [{ quantity: '500', packType: 'g', mrp: '34', salePrice: '29', stockQty: '18' }]
  },
  {
    key: 'spinach',
    category: 'Vegetables',
    name: 'Spinach',
    brandName: 'Fresh Fields',
    imageUrl: '/catalog/spinach.jpg',
    shortDescription: 'Leafy spinach bundles for dal, curries, and healthy meals.',
    longDescription: 'Fresh spinach leaves packed for quick home cooking, ideal for saag, dal, stir-fries, and smoothies.',
    variants: [{ quantity: '250', packType: 'g', mrp: '30', salePrice: '25', stockQty: '16' }]
  },
  {
    key: 'capsicum',
    category: 'Vegetables',
    name: 'Capsicum',
    brandName: 'Fresh Fields',
    imageUrl: '/catalog/capsicum.jpg',
    shortDescription: 'Fresh capsicum for stir-fries, pizza toppings, and curries.',
    longDescription: 'Crisp capsicum selected for fast cooking, stir-fries, stuffing recipes, and colourful everyday meals.',
    variants: [{ quantity: '500', packType: 'g', mrp: '72', salePrice: '64', stockQty: '14' }]
  },
  {
    key: 'okra',
    category: 'Vegetables',
    name: 'Okra',
    brandName: 'Fresh Fields',
    imageUrl: '/catalog/okra.jpg',
    shortDescription: 'Tender okra for fry recipes and homestyle vegetable dishes.',
    longDescription: 'Fresh okra chosen for bhindi fry, masala recipes, and regular household vegetable cooking.',
    variants: [{ quantity: '500', packType: 'g', mrp: '54', salePrice: '46', stockQty: '14' }]
  },
  {
    key: 'banana-robusta',
    category: 'Fruits',
    name: 'Banana Robusta',
    brandName: 'Farm Basket',
    imageUrl: '/catalog/banana-robusta.jpg',
    shortDescription: 'Naturally sweet bananas packed for everyday snacking.',
    longDescription: 'Popular table bananas selected for smoothies, breakfast baskets, and lunchbox fruit portions.',
    variants: [{ quantity: '6', packType: 'pcs', mrp: '48', salePrice: '42', stockQty: '20' }]
  },
  {
    key: 'daily-fresh-toned-milk',
    category: 'Dairy & Bakery',
    name: 'Daily Fresh Toned Milk',
    brandName: 'Daily Fresh',
    imageUrl: '/catalog/daily-fresh-toned-milk.jpg',
    shortDescription: 'Chilled milk packs for tea, coffee, and breakfast routines.',
    longDescription: 'Daily-delivery milk packs designed for fridge essentials and breakfast staples.',
    variants: [{ quantity: '1000', packType: 'ml', mrp: '74', salePrice: '68', stockQty: '20' }]
  },
  {
    key: 'fortune-sunlite-sunflower-oil',
    category: 'Kitchen Items',
    name: 'Fortune Sunlite Sunflower Oil',
    brandName: 'Fortune',
    imageUrl: '/catalog/fortune-sunlite-sunflower-oil.jpg',
    shortDescription: 'Light cooking oil for everyday frying and sauteing.',
    longDescription: 'A versatile edible oil for frequent meal prep and daily kitchen use.',
    variants: [{ quantity: '1000', packType: 'ml', mrp: '189', salePrice: '165', stockQty: '12' }]
  },
  {
    key: 'aashirvaad-whole-wheat-atta',
    category: 'Home Groceries',
    name: 'Aashirvaad Whole Wheat Atta',
    brandName: 'Aashirvaad',
    imageUrl: '/catalog/aashirvaad-whole-wheat-atta.jpg',
    shortDescription: 'Trusted atta for soft rotis and daily family cooking.',
    longDescription: 'A pantry staple with consistent quality, suited for chapatis, parathas, and regular grocery baskets.',
    variants: [{ quantity: '5000', packType: 'g', mrp: '329', salePrice: '289', stockQty: '12' }]
  },
  {
    key: 'vim-dishwash-liquid',
    category: 'Cleaning Supplies',
    name: 'Vim Dishwash Liquid',
    brandName: 'Vim',
    imageUrl: '/catalog/vim-dishwash-liquid.jpg',
    shortDescription: 'Grease-cutting dishwash liquid for everyday kitchen cleanup.',
    longDescription: 'A reliable dishwashing essential for utensils and fast post-meal cleanup in busy homes.',
    variants: [{ quantity: '500', packType: 'ml', mrp: '125', salePrice: '109', stockQty: '10' }]
  }
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
  const [selectedPresetKey, setSelectedPresetKey] = useState('');
  const [customPresets, setCustomPresets] = useState<ProductPreset[]>([]);
  const [customPresetsLoaded, setCustomPresetsLoaded] = useState(false);
  const [customPresetDraft, setCustomPresetDraft] = useState<CustomPresetDraft>(createEmptyCustomPresetDraft());
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

  const selectedCategoryName = useMemo(
    () => productOptions.categories.find((category) => category.id === productForm.categoryId)?.name ?? '',
    [productForm.categoryId, productOptions.categories]
  );

  const allProductPresets = useMemo(
    () => [...productPresets, ...customPresets],
    [customPresets]
  );

  const availableProductPresets = useMemo(
    () => allProductPresets.filter((preset) => preset.category === selectedCategoryName),
    [allProductPresets, selectedCategoryName]
  );

  const selectedPreset = useMemo(
    () => allProductPresets.find((preset) => preset.key === selectedPresetKey) ?? null,
    [allProductPresets, selectedPresetKey]
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
      if (raw) {
        setCustomPresets(JSON.parse(raw) as ProductPreset[]);
      }
    } catch {
      setCustomPresets([]);
    } finally {
      setCustomPresetsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !customPresetsLoaded) {
      return;
    }

    window.localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
  }, [customPresets, customPresetsLoaded]);

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
    setSelectedPresetKey('');
    setCustomPresetDraft(createEmptyCustomPresetDraft());
    setProductForm(createEmptyProductForm(productOptions));
  };

  const startEditProduct = (product: ProductRow) => {
    setEditingProductId(product.id);
    setSelectedPresetKey('');
    setCustomPresetDraft(createEmptyCustomPresetDraft());
    setProductForm(createProductFormFromProduct(product, productOptions));
    setNotice('Editing product details. Save to publish changes.');
    setError('');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const applyProductPreset = (presetKey: string) => {
    const preset = allProductPresets.find((item) => item.key === presetKey);
    if (!preset) {
      setSelectedPresetKey('');
      return;
    }

    const matchedBrandId = productOptions.brands.find((brand) => brand.name === preset.brandName)?.id ?? productForm.brandId;
    const imageName = preset.imageUrl.split('/').pop() ?? '';

    setSelectedPresetKey(preset.key);
    setProductForm((current) => ({
      ...current,
      name: preset.name,
      brandId: matchedBrandId,
      shortDescription: preset.shortDescription,
      longDescription: preset.longDescription,
      imageUrl: preset.imageUrl.startsWith('data:') ? '' : preset.imageUrl,
      imageDataUrl: preset.imageUrl.startsWith('data:') ? preset.imageUrl : '',
      imageName,
      variants: preset.variants.map((variant) => ({ ...variant }))
    }));
    setNotice(`${preset.name} loaded from the ${preset.category} saved list.`);
    setError('');
  };

  const startCustomProduct = () => {
    setSelectedPresetKey('');
    setCustomPresetDraft(createEmptyCustomPresetDraft());
    setProductForm((current) => ({
      ...current,
      name: '',
      shortDescription: '',
      longDescription: '',
      imageUrl: '',
      imageDataUrl: '',
      imageName: '',
      variants: [emptyVariant()]
    }));
    setNotice(`Saved list is optional. Enter a new ${selectedCategoryName || 'product'} name, then upload or paste the image and save it.`);
    setError('');
  };

  const handleCustomPresetImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const imageDataUrl = reader.result;
        setCustomPresetDraft((current) => ({
          ...current,
          imageDataUrl,
          imageUrl: '',
          imageName: file.name
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomPreset = () => {
    const trimmedName = customPresetDraft.name.trim();
    const imageSource = customPresetDraft.imageDataUrl || customPresetDraft.imageUrl;

    if (!selectedCategoryName) {
      setError('Select a category before adding a new saved item.');
      setNotice('');
      return;
    }

    if (!trimmedName) {
      setError('Enter the missing item name, such as Apple.');
      setNotice('');
      return;
    }

    if (!imageSource) {
      setError('Upload or paste an image for the missing item before adding it to the list.');
      setNotice('');
      return;
    }

    const brandName = productOptions.brands.find((brand) => brand.id === productForm.brandId)?.name ?? 'Fresh Fields';
    const preset: ProductPreset = {
      key: `custom-${createPresetKey(selectedCategoryName, trimmedName)}`,
      category: selectedCategoryName,
      name: trimmedName,
      brandName,
      imageUrl: imageSource,
      shortDescription: `${trimmedName} added manually to the ${selectedCategoryName.toLowerCase()} list.`,
      longDescription: `${trimmedName} was added manually to the ${selectedCategoryName.toLowerCase()} saved list so it can be reused while creating products.`,
      variants: [createPresetVariant()]
    };

    const matchedBrandId = productOptions.brands.find((brand) => brand.name === preset.brandName)?.id ?? productForm.brandId;
    const imageName = customPresetDraft.imageName || `${trimmedName}.jpg`;

    setCustomPresets((current) => {
      const remaining = current.filter((item) => item.key !== preset.key);
      return [...remaining, preset];
    });
    setCustomPresetDraft(createEmptyCustomPresetDraft());
    setSelectedPresetKey(preset.key);
    setProductForm((current) => ({
      ...current,
      name: preset.name,
      brandId: matchedBrandId,
      shortDescription: preset.shortDescription,
      longDescription: preset.longDescription,
      imageUrl: preset.imageUrl.startsWith('data:') ? '' : preset.imageUrl,
      imageDataUrl: preset.imageUrl.startsWith('data:') ? preset.imageUrl : '',
      imageName,
      variants: [createPresetVariant()]
    }));
    setNotice(`${preset.name} added to the ${selectedCategoryName} dropdown list.`);
    setError('');
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
    setBusyKey('product-submit');
    setError('');
    setNotice('');

    try {
      if (editingProductId) {
        await apiFetch(`/admin/products/${editingProductId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: productForm.name,
            categoryId: productForm.categoryId,
            brandId: productForm.brandId,
            shortDescription: productForm.shortDescription,
            longDescription: productForm.longDescription,
            imageUrl: productForm.imageUrl || undefined,
            imageDataUrl: productForm.imageDataUrl || undefined,
            isActive: true,
            variants: productForm.variants.map((variant) => ({
              id: variant.id,
              inventoryId: variant.inventoryId,
              quantity: Number(variant.quantity),
              packType: variant.packType,
              mrp: Number(variant.mrp),
              salePrice: Number(variant.salePrice),
              stockQty: Number(variant.stockQty)
            }))
          })
        });
        setNotice('Product updated successfully.');
      } else {
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
      }

      resetProductForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : editingProductId ? 'Unable to update product.' : 'Unable to create product.');
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
      setProducts((current) => current.filter((product) => product.id !== productId));
      setNotice('Product removed from the live catalog.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove product.');
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
              {createOnly ? <p className="text-xs text-slate-400">If the item is not in the saved list, type a new name here like Apple, Mango, or Grapes.</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <select
                className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                value={productForm.categoryId}
                onChange={(event) => {
                  setSelectedPresetKey('');
                  setCustomPresetDraft(createEmptyCustomPresetDraft());
                  setProductForm((current) => ({ ...current, categoryId: event.target.value }));
                }}
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

          {createOnly ? (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold text-white">Choose from saved catalog images</p>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                  value={selectedPresetKey}
                  onChange={(event) => setSelectedPresetKey(event.target.value)}
                >
                  <option value="">{selectedCategoryName ? `Select ${selectedCategoryName} item` : 'Select category first'}</option>
                  {availableProductPresets.map((preset) => (
                    <option key={preset.key} value={preset.key}>{preset.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={!selectedPresetKey}
                  onClick={() => applyProductPreset(selectedPresetKey)}
                >
                  Add
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white"
                  onClick={startCustomProduct}
                >
                  New custom product
                </button>
              </div>
              {selectedPreset ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center gap-4">
                    <img src={selectedPreset.imageUrl} alt={selectedPreset.name} className="h-20 w-20 rounded-2xl object-cover" />
                    <div>
                      <p className="font-semibold text-white">{selectedPreset.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{selectedPreset.shortDescription}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl border border-dashed border-emerald-400/25 bg-emerald-500/5 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-white">Item not in list? Add it to this dropdown</p>
                  <p className="mt-1 text-xs text-slate-400">Example: choose Fruits, type Apple, upload the Apple photo, then save it to the Fruits list.</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                    placeholder={selectedCategoryName ? `New ${selectedCategoryName} item name` : 'Select category first'}
                    value={customPresetDraft.name}
                    onChange={(event) => setCustomPresetDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                  <input
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                    placeholder="Image URL (optional if you upload a file)"
                    value={customPresetDraft.imageUrl}
                    onChange={(event) => setCustomPresetDraft((current) => ({ ...current, imageUrl: event.target.value, imageDataUrl: '', imageName: '' }))}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <input
                    type="file"
                    accept="image/*"
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
                    onChange={handleCustomPresetImageUpload}
                  />
                  <button
                    type="button"
                    className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950"
                    onClick={handleAddCustomPreset}
                  >
                    Save to list
                  </button>
                </div>
                {customPresetDraft.imageDataUrl || customPresetDraft.imageUrl ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center gap-4">
                      <img src={customPresetDraft.imageDataUrl || customPresetDraft.imageUrl} alt={customPresetDraft.name || 'Custom preset preview'} className="h-20 w-20 rounded-2xl object-cover" />
                      <div>
                        <p className="font-semibold text-white">{customPresetDraft.name || 'New item preview'}</p>
                        <p className="mt-1 text-sm text-slate-400">This will be added to the {selectedCategoryName || 'selected'} dropdown list.</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-slate-400">Choose an item from the saved catalog folder and click Add, or save a missing item like Apple into this category dropdown first.</p>
            </div>
          ) : null}

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
              {createOnly ? <p className="text-xs text-slate-400">For a new item like Apple, upload a new image here if it is not available in the saved list.</p> : null}
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

  const renderCatalogList = () => (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Current catalog</h2>
          <p className="mt-1 text-sm text-slate-300">Review, search, and filter products currently live on Near Kart.</p>
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
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProducts.map((product) => (
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
        {!filteredProducts.length ? <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-6 text-sm text-slate-400">No products match the current search/filter.</div> : null}
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
