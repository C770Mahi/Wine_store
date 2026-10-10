import { apiFetch } from './api';

export const CART_UPDATED_EVENT = 'indus-reserve:cart-updated';

export type Category = 'Beer' | 'Whisky' | 'Vodka' | 'Rum' | 'Wine' | 'Brandy' | 'Gin' | 'Tequila' | 'Mixers';

export interface Variant {
  id: string;
  label: string;
  volumeMl: number;
  mrp: number;
  salePrice: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  rating: number;
  image: string;
  eta: string;
  description: string;
  variants: Variant[];
}

export interface CartItem {
  id: string;
  variantId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  tax: number;
  delivery: number;
  payable: number;
}

export interface CartData {
  id: string;
  userId: string;
  items: CartItem[];
  coupon?: {
    code: string;
    discountAmount: number;
  };
  summary: CartSummary;
}

export interface Address {
  id: string;
  label: string;
  recipientName?: string;
  mobile?: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OfferBanner {
  id: string;
  title: string;
  subtitle: string;
  couponCode?: string;
}

export const offerBanners: OfferBanner[] = [
  { id: 'offer-1', title: 'Flat ₹150 off', subtitle: 'Use WELCOME150 on orders above ₹999', couponCode: 'WELCOME150' },
  { id: 'offer-2', title: 'Party cart deals', subtitle: 'Save more on whisky + beer combinations', couponCode: 'PARTYNIGHT' },
  { id: 'offer-3', title: 'Free delivery', subtitle: 'On Bangalore orders above ₹699', couponCode: 'FREEDEL' }
];

const emptyCart: CartData = {
  id: 'cart-empty',
  userId: 'guest',
  items: [],
  summary: {
    subtotal: 0,
    discount: 0,
    tax: 0,
    delivery: 0,
    payable: 0
  }
};

function notifyCartUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT));
  }
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

export function buildFilterGroups(products: Product[], brands: string[]) {
  const volumes = Array.from(
    new Set(products.flatMap((product) => product.variants.map((variant) => variant.label)))
  ).sort((left, right) => Number.parseInt(left, 10) - Number.parseInt(right, 10));

  return {
    brands,
    volumes,
    priceBands: ['Under ₹300', '₹300 - ₹999', '₹1000 - ₹1999', '₹2000+']
  };
}

async function safeFetch<T>(factory: () => Promise<T>, fallback: T) {
  try {
    return await factory();
  } catch {
    return fallback;
  }
}

export async function getCategories() {
  return safeFetch(() => apiFetch<Category[]>('/categories'), []);
}

export async function getBrands() {
  return safeFetch(() => apiFetch<string[]>('/brands'), []);
}

export async function getProducts(filters?: { category?: string; search?: string; brand?: string }) {
  const query = new URLSearchParams();
  if (filters?.category) query.set('category', filters.category);
  if (filters?.search) query.set('search', filters.search);
  if (filters?.brand) query.set('brand', filters.brand);
  const suffix = query.size ? `?${query.toString()}` : '';
  return safeFetch(() => apiFetch<Product[]>(`/products${suffix}`), []);
}

export async function getProductBySlug(slug: string) {
  return safeFetch(() => apiFetch<Product>(`/products/${slug}`), null);
}

export async function getRelatedProducts(slug: string) {
  return safeFetch(() => apiFetch<Product[]>(`/products/${slug}/related`), []);
}

export async function getCart() {
  return safeFetch(() => apiFetch<CartData>('/cart'), emptyCart);
}

export async function getAddresses() {
  return safeFetch(() => apiFetch<Address[]>('/location/addresses'), []);
}

export async function addCartItemRequest(payload: { variantId: string; quantity?: number }) {
  const response = await apiFetch<{ message: string; cart: CartData }>('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ variantId: payload.variantId, quantity: payload.quantity ?? 1 })
  });
  notifyCartUpdated();
  return response.cart;
}

export async function updateCartItemRequest(itemId: string, quantity: number) {
  const response = await apiFetch<{ message: string; cart: CartData }>(`/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity })
  });
  notifyCartUpdated();
  return response.cart;
}

export async function removeCartItemRequest(itemId: string) {
  const response = await apiFetch<{ message: string; cart: CartData }>(`/cart/items/${itemId}`, {
    method: 'DELETE'
  });
  notifyCartUpdated();
  return response.cart;
}

export async function applyCouponRequest(code: string) {
  const response = await apiFetch<{ message: string; cart: CartData }>('/cart/apply-coupon', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
  notifyCartUpdated();
  return response.cart;
}

export async function removeCouponRequest() {
  const response = await apiFetch<{ message: string; cart: CartData }>('/cart/remove-coupon', {
    method: 'DELETE'
  });
  notifyCartUpdated();
  return response.cart;
}
