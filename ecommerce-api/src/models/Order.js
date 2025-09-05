import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productTitle: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ['PENDING','PAID','SHIPPED','DELIVERED','CANCELED'], default: 'PENDING' },
  items: { type: [OrderItemSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);
