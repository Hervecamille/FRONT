import Joi from 'joi';

export const addItemSchema = Joi.object({
  productId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
});

export const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});
