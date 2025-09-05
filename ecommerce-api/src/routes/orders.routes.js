import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { checkoutSchema } from '../validators/order.validators.js';
import { checkout, myOrders, getOrder, setStatus } from '../controllers/orders.controller.js';

const router = Router();

router.post('/checkout', auth, validateBody(checkoutSchema), checkout);
router.get('/', auth, myOrders);
router.get('/:id', auth, getOrder);

router.patch('/:id/status', auth, requireAdmin, setStatus);

export default router;
