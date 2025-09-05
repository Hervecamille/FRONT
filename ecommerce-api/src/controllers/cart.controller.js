import { ok, ApiError } from '../utils/apiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import mongoose from 'mongoose';

export const getCart = asyncWrapper(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id }).lean();
  if (cart?.items?.length) {
    const ids = cart.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids } }).lean();
    const map = new Map(products.map(p => [String(p._id), p]));
    cart.items = cart.items.map(i => ({ ...i, product: map.get(String(i.productId)) || null }));
  }
  return ok(res, cart);
});

export const addItem = asyncWrapper(async (req, res) => {
  const { productId, quantity } = req.body;
  if (!mongoose.isValidObjectId(productId)) throw new ApiError(400, 'productId invalide');

  const product = await Product.findById(productId).lean();
  if (!product) throw new ApiError(404, 'Produit introuvable');
  if (product.stock < quantity) throw new ApiError(400, 'Stock insuffisant');

  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });

  const idx = cart.items.findIndex(i => String(i.productId) === String(productId));
  if (idx >= 0) {
    cart.items[idx].quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }
  await cart.save();

  return getCart(req, res);
});

export const updateItem = asyncWrapper(async (req, res) => {
  const productId = req.params.productId;
  const { quantity } = req.body;

  const product = await Product.findById(productId).lean();
  if (!product) throw new ApiError(404, 'Produit introuvable');
  if (product.stock < quantity) throw new ApiError(400, 'Stock insuffisant');

  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) throw new ApiError(404, 'Panier introuvable');

  const idx = cart.items.findIndex(i => String(i.productId) === String(productId));
  if (idx < 0) throw new ApiError(404, 'Article non présent');
  cart.items[idx].quantity = quantity;
  await cart.save();

  return getCart(req, res);
});

export const removeItem = asyncWrapper(async (req, res) => {
  const productId = req.params.productId;
  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) throw new ApiError(404, 'Panier introuvable');
  cart.items = cart.items.filter(i => String(i.productId) !== String(productId));
  await cart.save();
  return getCart(req, res);
});

export const clearCart = asyncWrapper(async (req, res) => {
  await Cart.updateOne({ userId: req.user.id }, { $set: { items: [] } });
  return ok(res, null, 'Panier vidé');
});
