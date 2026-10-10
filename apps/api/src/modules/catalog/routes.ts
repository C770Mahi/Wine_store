import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler';
import { getProductBySlug, getRelatedProducts, listBrands, listCategories, listProducts } from './repository';

const router = Router();

router.get('/categories', asyncHandler(async (_request, response) => {
  response.json(await listCategories());
}));

router.get('/brands', asyncHandler(async (_request, response) => {
  response.json(await listBrands());
}));

router.get('/products', asyncHandler(async (request, response) => {
  response.json(await listProducts({
    category: request.query.category?.toString(),
    brand: request.query.brand?.toString(),
    search: request.query.search?.toString()
  }));
}));

router.get('/products/search/suggestions', asyncHandler(async (request, response) => {
  const query = request.query.q?.toString().toLowerCase() ?? '';
  const products = await listProducts({ search: query });
  response.json(products.map((product) => product.name).slice(0, 5));
}));

router.get('/products/:slug', asyncHandler(async (request, response) => {
  const product = await getProductBySlug(request.params.slug);
  if (!product) {
    response.status(404).json({ message: 'Product not found' });
    return;
  }

  response.json(product);
}));

router.get('/products/:slug/related', asyncHandler(async (request, response) => {
  response.json(await getRelatedProducts(request.params.slug));
}));

export default router;
