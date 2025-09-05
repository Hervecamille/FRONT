import Joi from 'joi';

export const createProductSchema = Joi.object({
  title: Joi.string().min(2).required(),
  description: Joi.string().allow('').optional(),
  price: Joi.number().precision(2).min(0).required(),
  stock: Joi.number().integer().min(0).required(),
  categoryId: Joi.string().allow(null).optional(),
  imageUrl: Joi.string().uri().allow(null, '').optional(),
});

export const updateProductSchema = createProductSchema.min(1);
