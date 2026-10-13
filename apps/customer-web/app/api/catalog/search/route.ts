import { NextRequest, NextResponse } from 'next/server';

interface SearchProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  shortDescription?: string;
  longDescription?: string;
  image: string;
  eta: string;
  variants: Array<{
    id: string;
    label: string;
    mrp: number;
    salePrice: number;
    inStock: boolean;
  }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get('q') ?? '';
  const query = rawQuery.trim().replace(/\s+/g, ' ');

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/products`, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json({ message: 'Unable to fetch products for search.' }, { status: 502 });
    }

    const products = await response.json() as SearchProduct[];
    const normalizedQuery = query.toLowerCase();
    const matchingProducts = products.filter((product) => {
      const haystack = [
        product.name,
        product.brand,
        product.category,
        product.description,
        product.shortDescription,
        product.longDescription
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    return NextResponse.json(matchingProducts);
  } catch {
    return NextResponse.json({ message: 'Unable to fetch products for search.' }, { status: 502 });
  }
}
