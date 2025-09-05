import { ok, created, ApiError } from '../utils/apiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

export const checkout = asyncWrapper(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.id }).lean();
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Panier vide');
  }

  // 1) Charger les produits actuels et vérifier les stocks
  const ids = cart.items.map(i => i.productId);
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const map = new Map(products.map(p => [String(p._id), p]));

  for (const it of cart.items) {
    const p = map.get(String(it.productId));
    if (!p) throw new ApiError(400, 'Produit introuvable');
    if (p.stock < it.quantity) throw new ApiError(400, `Stock insuffisant pour ${p.title}`);
  }

  // 2) Total
  const total = cart.items.reduce((sum, it) => {
    const p = map.get(String(it.productId));
    return sum + Number(p.price) * it.quantity;
  }, 0);

  // 3) Payload ordre
  const orderPayload = {
    userId: req.user.id,
    total,
    status: 'PENDING',
    items: cart.items.map(it => {
      const p = map.get(String(it.productId));
      return {
        productId: p._id,
        productTitle: p.title,
        unitPrice: p.price,
        quantity: it.quantity,
      };
    }),
  };

  // 4) Tente en transaction (Replica Set / Atlas) sinon fallback standalone
  let session;
  try {
    session = await Order.startSession();
    session.startTransaction();

    const [orderDoc] = await Order.create([orderPayload], { session });

    // décrémenter stocks (contrainte concurrente via $gte)
    for (const it of cart.items) {
      const dec = await Product.updateOne(
        { _id: it.productId, stock: { $gte: it.quantity } },
        { $inc: { stock: -it.quantity } },
        { session }
      );
      if (dec.modifiedCount !== 1) {
        throw new ApiError(400, `Stock insuffisant pour ${map.get(String(it.productId)).title}`);
      }
    }

    await Cart.updateOne({ userId: req.user.id }, { $set: { items: [] } }, { session });

    await session.commitTransaction();
    session.endSession();

    return created(res, orderDoc, 'Commande créée (PENDING)');
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch {}
      try { session.endSession(); } catch {}
    }

    const msg = String(err?.message || '');
    const isNoTxnSupport =
      msg.includes('Transaction numbers are only allowed') ||
      msg.includes('is not supported') ||
      err?.code === 20;

    if (!isNoTxnSupport) {
      throw err;
    }

    const decremented = [];
    try {
      for (const it of cart.items) {
        const dec = await Product.updateOne(
          { _id: it.productId, stock: { $gte: it.quantity } },
          { $inc: { stock: -it.quantity } }
        );
        if (dec.modifiedCount !== 1) {
          throw new ApiError(400, `Stock insuffisant pour ${map.get(String(it.productId)).title}`);
        }
        decremented.push(it);
      }

      const orderDoc = await Order.create(orderPayload);

      await Cart.updateOne({ userId: req.user.id }, { $set: { items: [] } });

      return created(res, orderDoc, 'Commande créée (PENDING)');
    } catch (e2) {
      await Promise.all(
        decremented.map(it =>
          Product.updateOne({ _id: it.productId }, { $inc: { stock: it.quantity } })
        )
      );
      throw e2;
    }
  }
});

export const myOrders = asyncWrapper(async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  return ok(res, orders);
});

export const getOrder = asyncWrapper(async (req, res) => {
  const id = req.params.id;
  const order = await Order.findById(id).lean();
  if (!order || (String(order.userId) !== req.user.id && req.user.role !== 'ADMIN')) {
    throw new ApiError(404, 'Commande introuvable');
  }
  return ok(res, order);
});

export const setStatus = asyncWrapper(async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
  return ok(res, order, 'Statut mis à jour');
});
