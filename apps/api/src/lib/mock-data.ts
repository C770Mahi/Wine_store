import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

export type Category = 'Beer' | 'Whisky' | 'Vodka' | 'Rum' | 'Wine' | 'Brandy' | 'Gin' | 'Tequila' | 'Mixers';

export interface ProductVariant {
  id: string;
  volumeMl: number;
  label: string;
  mrp: number;
  salePrice: number;
  inStock: boolean;
}

export interface ProductRecord {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  rating: number;
  description: string;
  image: string;
  eta: string;
  variants: ProductVariant[];
}

export interface AddressRecord {
  id: string;
  userId: string;
  label: string;
  recipientName: string;
  mobile: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CartItemRecord {
  id: string;
  variantId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface CartRecord {
  id: string;
  userId: string;
  items: CartItemRecord[];
  coupon?: {
    code: string;
    discountAmount: number;
  };
}

export interface OrderRecord {
  id: string;
  userId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  deliveryEta: string;
}

export interface RuntimeUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: 'customer' | 'admin' | 'partner';
  isMobileVerified: boolean;
  isEmailVerified: boolean;
}

export interface RefreshSessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface OtpChallengeRecord {
  id: string;
  userId: string | null;
  identifier: string;
  purpose: 'signup' | 'login' | 'reset_password' | 'verify_email';
  codeHash: string;
  expiresAt: Date;
  verifiedAt: Date | null;
}

export const seedCategories: Category[] = ['Beer', 'Whisky', 'Vodka', 'Rum', 'Wine', 'Brandy', 'Gin', 'Tequila', 'Mixers'];
export const seedBrands = ['Kingfisher', 'Blenders Pride', 'Old Monk', 'Smirnoff', 'Sula', 'Greater Than', 'Budweiser'];

export const seedProducts: ProductRecord[] = [
  {
    id: 'prod_1',
    slug: 'blenders-pride-whisky',
    name: 'Blenders Pride Rare Premium Whisky',
    brand: 'Blenders Pride',
    category: 'Whisky',
    rating: 4.7,
    description: 'Fast-moving premium whisky for urban Bangalore orders.',
    image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?auto=format&fit=crop&w=900&q=80',
    eta: '18 mins',
    variants: [
      { id: 'var_1', volumeMl: 180, label: '180 ml', mrp: 590, salePrice: 540, inStock: true },
      { id: 'var_2', volumeMl: 375, label: '375 ml', mrp: 1090, salePrice: 995, inStock: true },
      { id: 'var_3', volumeMl: 750, label: '750 ml', mrp: 1990, salePrice: 1840, inStock: true }
    ]
  },
  {
    id: 'prod_2',
    slug: 'kingfisher-premium-beer',
    name: 'Kingfisher Premium Lager',
    brand: 'Kingfisher',
    category: 'Beer',
    rating: 4.6,
    description: 'Popular beer with strong repeat order behavior in Bangalore.',
    image: 'https://images.unsplash.com/photo-1516458464372-ee7eae24b460?auto=format&fit=crop&w=900&q=80',
    eta: '14 mins',
    variants: [
      { id: 'var_4', volumeMl: 330, label: '330 ml', mrp: 110, salePrice: 99, inStock: true },
      { id: 'var_5', volumeMl: 650, label: '650 ml', mrp: 190, salePrice: 180, inStock: true }
    ]
  },
  {
    id: 'prod_3',
    slug: 'old-monk-rum',
    name: 'Old Monk XXX Rum',
    brand: 'Old Monk',
    category: 'Rum',
    rating: 4.8,
    description: 'Classic Bangalore rum pick in multiple bottle sizes.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=80',
    eta: '16 mins',
    variants: [
      { id: 'var_6', volumeMl: 180, label: '180 ml', mrp: 220, salePrice: 200, inStock: true },
      { id: 'var_7', volumeMl: 750, label: '750 ml', mrp: 820, salePrice: 760, inStock: true }
    ]
  },
  {
    id: 'prod_4',
    slug: 'smirnoff-red-vodka',
    name: 'Smirnoff Red Vodka',
    brand: 'Smirnoff',
    category: 'Vodka',
    rating: 4.5,
    description: 'Common mixer-friendly vodka for quick commerce orders.',
    image: 'https://images.unsplash.com/photo-1563223771-375783ee91ad?auto=format&fit=crop&w=900&q=80',
    eta: '20 mins',
    variants: [
      { id: 'var_8', volumeMl: 180, label: '180 ml', mrp: 420, salePrice: 380, inStock: true },
      { id: 'var_9', volumeMl: 750, label: '750 ml', mrp: 1490, salePrice: 1390, inStock: true }
    ]
  }
];

const demoUserId = 'user_1';

export const runtimeState = {
  users: [
    {
      id: demoUserId,
      name: 'Demo User',
      email: 'demo@indusreserve.in',
      mobile: '9876543210',
      passwordHash: bcrypt.hashSync('Pass@1234', 10),
      role: 'customer' as const,
      isMobileVerified: true,
      isEmailVerified: true
    }
  ] as RuntimeUser[],
  addresses: [
    {
      id: 'addr_1',
      userId: demoUserId,
      label: 'Home',
      recipientName: 'Demo User',
      mobile: '9876543210',
      addressLine1: '100 Feet Road, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038'
    },
    {
      id: 'addr_2',
      userId: demoUserId,
      label: 'Office',
      recipientName: 'Demo User',
      mobile: '9876543210',
      addressLine1: 'Outer Ring Road, HSR Layout',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560102'
    }
  ] as AddressRecord[],
  serviceablePincodes: ['560001', '560008', '560034', '560038', '560095', '560102', '560103'],
  carts: [
    {
      id: 'cart_1',
      userId: demoUserId,
      items: [
        { id: uuid(), variantId: 'var_3', productName: 'Blenders Pride Rare Premium Whisky', quantity: 1, unitPrice: 1840 },
        { id: uuid(), variantId: 'var_5', productName: 'Kingfisher Premium Lager', quantity: 2, unitPrice: 180 }
      ],
      coupon: { code: 'WELCOME150', discountAmount: 150 }
    }
  ] as CartRecord[],
  orders: [
    {
      id: 'ord_1',
      userId: demoUserId,
      orderNumber: 'IR10001',
      status: 'assigned',
      paymentStatus: 'paid',
      grandTotal: 2353,
      deliveryEta: '18 mins'
    }
  ] as OrderRecord[],
  refreshSessions: [] as RefreshSessionRecord[],
  otpChallenges: [] as OtpChallengeRecord[]
};

export function getDemoUserId() {
  return demoUserId;
}

export function getProductByVariantId(variantId: string) {
  return seedProducts.find((product) => product.variants.some((variant) => variant.id === variantId));
}

export function getVariantById(variantId: string) {
  for (const product of seedProducts) {
    const variant = product.variants.find((entry) => entry.id === variantId);
    if (variant) {
      return variant;
    }
  }
  return undefined;
}

export function getOrCreateRuntimeCart(userId: string) {
  const existing = runtimeState.carts.find((cart) => cart.userId === userId);
  if (existing) {
    return existing;
  }

  const cart: CartRecord = {
    id: uuid(),
    userId,
    items: []
  };
  runtimeState.carts.push(cart);
  return cart;
}

export function summarizeCart(cart: CartRecord) {
  const subtotal = cart.items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const discount = cart.coupon?.discountAmount ?? 0;
  const tax = Math.round(subtotal * 0.14);
  const delivery = subtotal > 699 ? 0 : 49;
  return {
    subtotal,
    discount,
    tax,
    delivery,
    payable: subtotal - discount + tax + delivery
  };
}
