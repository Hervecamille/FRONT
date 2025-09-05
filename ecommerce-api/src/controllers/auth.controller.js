import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { created, ok, ApiError } from '../utils/apiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import User from '../models/User.js';
import Cart from '../models/Cart.js';

const signAccess = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn });

const signRefresh = (userId) =>
  jwt.sign({ sub: String(userId), type: 'refresh' }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });

function parseDuration(s) {
  const m = String(s).match(/^(\d+)([smhd])$/i);
  if (!m) return 0;
  const n = Number(m[1]);
  const map = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * map[m[2].toLowerCase()];
}

export const register = asyncWrapper(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email }).lean();
  if (exists) throw new ApiError(409, 'Email déjà utilisé');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });

  // panier vide
  await Cart.create({ userId: user._id, items: [] });

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user._id);
  const expiresAt = new Date(Date.now() + parseDuration(env.jwt.refreshExpiresIn));

  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: { token: refreshToken, expiresAt } } }
  );

  const safeUser = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  return created(res, { user: safeUser, accessToken, refreshToken }, 'Compte créé');
});

export const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, 'Identifiants invalides');

  const okPwd = await bcrypt.compare(password, user.passwordHash);
  if (!okPwd) throw new ApiError(401, 'Identifiants invalides');

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user._id);
  const expiresAt = new Date(Date.now() + parseDuration(env.jwt.refreshExpiresIn));

  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokens: { token: refreshToken, expiresAt } } }
  );

  const safeUser = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  return ok(res, { user: safeUser, accessToken, refreshToken }, 'Connecté');
});

export const refresh = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'Refresh token manquant');

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    throw new ApiError(401, 'Refresh token invalide');
  }

  const user = await User.findOne({
    _id: payload.sub,
    refreshTokens: { $elemMatch: { token: refreshToken, isRevoked: false, expiresAt: { $gt: new Date() } } }
  }).select('_id role name email');

  if (!user) throw new ApiError(401, 'Refresh token expiré/révoqué');

  const newAccess = signAccess(user);
  return ok(res, { accessToken: newAccess });
});

export const logout = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await User.updateOne(
      { 'refreshTokens.token': refreshToken },
      { $set: { 'refreshTokens.$.isRevoked': true } }
    ).catch(() => {});
  }
  return ok(res, null, 'Déconnecté');
});
