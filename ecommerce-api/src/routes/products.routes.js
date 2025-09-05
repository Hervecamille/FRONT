import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';
import { auth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema } from '../validators/product.validators.js';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/products.controller.js';

const uploadsPath = env.uploadsDir;
fs.mkdirSync(uploadsPath, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(uploadsPath)),
  filename: (_req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')),
});
const upload = multer({ storage });

const router = Router();

router.get('/', listProducts);
router.get('/:idOrSlug', getProduct);
router.post('/', auth, requireAdmin, upload.single('image'),
  (req, _res, next) => { if (req.file) req.file.url = `${env.publicBaseUrl}/uploads/${req.file.filename}`; next(); },
  validateBody(createProductSchema), createProduct);
router.patch('/:id', auth, requireAdmin, upload.single('image'),
  (req, _res, next) => { if (req.file) req.file.url = `${env.publicBaseUrl}/uploads/${req.file.filename}`; next(); },
  validateBody(updateProductSchema), updateProduct);
router.delete('/:id', auth, requireAdmin, deleteProduct);

export default router;
