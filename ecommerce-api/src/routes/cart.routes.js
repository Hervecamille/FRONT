import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { addItemSchema, updateItemSchema } from '../validators/cart.validators.js';
import { getCart, addItem, updateItem, removeItem, clearCart } from '../controllers/cart.controller.js';

const router = Router();

router.get('/', auth, getCart);
router.post('/items', auth, validateBody(addItemSchema), addItem);
router.patch('/items/:productId', auth, validateBody(updateItemSchema), updateItem);
router.delete('/items/:productId', auth, removeItem);
router.delete('/', auth, clearCart);

export default router;
