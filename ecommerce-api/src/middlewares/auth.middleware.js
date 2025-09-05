import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiResponse.js';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new ApiError(401, 'Token manquant'));

  try {
    const payload = jwt.verify(token, env.jwt.accessSecret);
    const user = await User.findById(payload.sub).select('_id email name role').lean();
    if (!user) return next(new ApiError(401, 'Utilisateur introuvable'));
    req.user = { id: String(user._id), email: user.email, name: user.name, role: user.role };
    next();
  } catch (e) {
    next(new ApiError(401, 'Token invalide ou expiré'));
  }
};
