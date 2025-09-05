import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validators.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.controller.js';

const router = Router();

router.get('/', listCategories);
router.post('/', auth, requireAdmin, validateBody(createCategorySchema), createCategory);
router.patch('/:id', auth, requireAdmin, validateBody(updateCategorySchema), updateCategory);
router.delete('/:id', auth, requireAdmin, deleteCategory);

export default router;
