import { apiFetch } from './api';

export const CART_UPDATED_EVENT = 'indus-reserve:cart-updated';

export type Category = string;

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
  createdAt: string;
  isNew: boolean;
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
  addressType: string;
  recipientName?: string;
  fullName?: string;
  mobile?: string;
  mobileNumber?: string;
  houseNo: string;
  apartmentName?: string;
  streetArea: string;
  landmark?: string;
  addressLine1: string;
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  googleMapsLink: string;
  isDefault: boolean;
}

export interface OfferBanner {
  id: string;
  title: string;
  subtitle: string;
  couponCode?: string;
}

export interface CustomerOrder {
  id: string;
  userId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  deliveryEta: string;
  createdAt: string | null;
  paymentMethod: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  deliveryAddress?: string;
  googleMapsLink?: string;
}

export interface AddressPayload {
  addressType: string;
  fullName: string;
  mobileNumber: string;
  houseNo: string;
  apartmentName?: string;
  streetArea: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  isDefault?: boolean;
}

export interface OrderDeliveryAddress {
  recipientName: string;
  mobile: string;
  addressLine1: string;
  addressLine2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface CustomerOrderDetail extends Omit<CustomerOrder, 'deliveryAddress'> {
  deliveryAddress: OrderDeliveryAddress;
}

export interface OrderTrackingData {
  orderId: string;
  status: string;
  timeline: string[];
  driverLocation: { latitude: number; longitude: number } | null;
  etaMinutes: number;
}

export interface RazorpayCheckoutSession {
  checkoutSessionId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  customer: {
    name: string;
    email?: string;
    contact?: string;
  };
  description: string;
  supportedMethods: string[];
}

export interface PaymentVerificationResult {
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}

export const offerBanners: OfferBanner[] = [
  { id: 'offer-1', title: 'Flat ₹100 off', subtitle: 'Use WELCOME100 on orders above ₹499', couponCode: 'WELCOME100' },
  { id: 'offer-2', title: 'Fresh basket savings', subtitle: 'Save 20% on selected fruits, vegetables, and daily essentials', couponCode: 'FRESH20' },
  { id: 'offer-3', title: 'Free delivery', subtitle: 'On neighbourhood orders above ₹299', couponCode: 'FREEDEL' }
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
    priceBands: ['Under ₹100', '₹100 - ₹299', '₹300 - ₹699', '₹700+']
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

export async function addAddressRequest(payload: AddressPayload) {
  return apiFetch<Address>('/location/addresses', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateAddressRequest(addressId: string, payload: AddressPayload) {
  return apiFetch<Address>(`/location/addresses/${addressId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export async function deleteAddressRequest(addressId: string) {
  return apiFetch<{ id: string }>(`/location/addresses/${addressId}`, {
    method: 'DELETE'
  });
}

export async function setDefaultAddressRequest(addressId: string) {
  return apiFetch<Address>(`/location/addresses/${addressId}/default`, {
    method: 'POST'
  });
}

export async function getOrders() {
  return safeFetch(() => apiFetch<CustomerOrder[]>('/orders'), []);
}

export async function getOrderById(orderId: string) {
  return safeFetch(() => apiFetch<CustomerOrderDetail>(`/orders/${orderId}`), null);
}

export async function getOrderTracking(orderId: string) {
  return safeFetch(() => apiFetch<OrderTrackingData>(`/orders/${orderId}/tracking`), null);
}

export async function createCheckoutSessionRequest(payload: { addressId: string; slot?: string; ageConfirmed: boolean }) {
  return apiFetch<RazorpayCheckoutSession>('/payments/razorpay/checkout-session', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function verifyRazorpayPaymentRequest(payload: {
  checkoutSessionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const response = await apiFetch<PaymentVerificationResult>('/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  notifyCartUpdated();
  return response;
}

export async function recordRazorpayFailureRequest(payload: {
  checkoutSessionId: string;
  razorpayOrderId?: string;
  code?: string;
  description?: string;
  source?: string;
  step?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  return apiFetch<{ message: string }>('/payments/razorpay/failure', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
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
