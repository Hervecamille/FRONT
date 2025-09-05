// src/routes/index.js
import { Router } from 'express';

import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import categoriesRoutes from './categories.routes.js';
import productsRoutes from './products.routes.js'; // ✅ assure-toi que cette ligne est présente
import cartRoutes from './cart.routes.js';
import ordersRoutes from './orders.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes); 
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);

export default router;
