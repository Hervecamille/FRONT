import { ApiError } from '../utils/apiResponse.js';
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') return next(new ApiError(403, 'Réservé aux admins'));
  next();
};
