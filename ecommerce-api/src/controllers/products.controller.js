import slugify from 'slugify';
import { ok, created } from '../utils/apiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';

export const listProducts = asyncWrapper(async (req, res) => {
  const {
    search = '',
    categoryId,
    minPrice,
    maxPrice,
    page = 1,
    limit = 12,
    sort = 'createdAt_desc',
  } = req.query;

  const filter = {};
  if (search) {
    filter.$text = { $search: String(search) };
  }
  if (categoryId && mongoose.isValidObjectId(categoryId)) {
    filter.categoryId = categoryId;
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const [sortField, sortDir] = String(sort).split('_');
  const sortObj = { [sortField || 'createdAt']: (sortDir === 'asc' ? 1 : -1) };

  const take = Number(limit);
  const skip = (Number(page) - 1) * take;

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sortObj).skip(skip).limit(take).lean(),
    Product.countDocuments(filter)
  ]);

  if (items.length) {
    const catIds = [...new Set(items.map(p => String(p.categoryId)).filter(Boolean))];
    const cats = await Category.find({ _id: { $in: catIds } }).select('_id name slug').lean();
    const map = new Map(cats.map(c => [String(c._id), c]));
    items.forEach(p => p.category = p.categoryId ? map.get(String(p.categoryId)) || null : null);
  }

  return ok(res, {
    items,
    total,
    page: Number(page),
    pages: Math.ceil(total / take),
  });
});

export const getProduct = asyncWrapper(async (req, res) => {
  const { idOrSlug } = req.params;
  const isId = mongoose.isValidObjectId(idOrSlug);
  const product = await Product.findOne(isId ? { _id: idOrSlug } : { slug: idOrSlug }).lean();
  return ok(res, product);
});

export const createProduct = asyncWrapper(async (req, res) => {
  const { title, description, price, stock, categoryId, imageUrl } = req.body;
  const slug = slugify(title, { lower: true, strict: true });
  const product = await Product.create({
    title,
    description,
    price,
    stock,
    slug,
    imageUrl: imageUrl || req.file?.url || null,
    categoryId: categoryId || null,
  });
  return created(res, product, 'Produit créé');
});

export const updateProduct = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { title, description, price, stock, categoryId, imageUrl } = req.body;

  const data = {
    ...(title && { title, slug: slugify(title, { lower: true, strict: true }) }),
    ...(description !== undefined && { description }),
    ...(price !== undefined && { price: Number(price) }),
    ...(stock !== undefined && { stock: Number(stock) }),
    ...(categoryId !== undefined && { categoryId: categoryId || null }),
    ...(imageUrl !== undefined && { imageUrl }),
  };
  if (req.file?.url) data.imageUrl = req.file.url;

  const product = await Product.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  return ok(res, product, 'Produit mis à jour');
});

export const deleteProduct = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  await Product.findByIdAndDelete(id);
  return ok(res, null, 'Produit supprimé');
});
