import slugify from 'slugify';
import { ok, created } from '../utils/apiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import Category from '../models/Category.js';

export const listCategories = asyncWrapper(async (_req, res) => {
  const cats = await Category.find().sort({ name: 1 }).lean();
  return ok(res, cats);
});

export const createCategory = asyncWrapper(async (req, res) => {
  const { name } = req.body;
  const slug = slugify(name, { lower: true, strict: true });
  const cat = await Category.create({ name, slug });
  return created(res, cat, 'Catégorie créée');
});

export const updateCategory = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const data = {};
  if (name) {
    data.name = name;
    data.slug = slugify(name, { lower: true, strict: true });
  }
  const cat = await Category.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
  return ok(res, cat, 'Catégorie mise à jour');
});

export const deleteCategory = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  await Category.findByIdAndDelete(id);
  return ok(res, null, 'Catégorie supprimée');
});
