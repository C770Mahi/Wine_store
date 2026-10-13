export type Category = string;

export interface ProductVariant {
  id: string;
  volumeMl: number;
  label: string;
  mrp: number;
  salePrice: number;
  inStock: boolean;
}

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  category: Category;
  brand: string;
  rating: number;
  image: string;
  deliveryEta: string;
  description: string;
  variants: ProductVariant[];
}

export interface OfferBanner {
  id: string;
  title: string;
  subtitle: string;
  couponCode?: string;
  accent: 'green' | 'yellow' | 'blue';
}

export interface Address {
  id: string;
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}
