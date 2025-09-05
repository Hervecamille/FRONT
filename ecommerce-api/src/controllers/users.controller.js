import bcrypt from 'bcryptjs';
import { ok, ApiError } from '../utils/apiResponse.js';
import { asyncWrapper } from '../utils/asyncWrapper.js';
import User from '../models/User.js';

export const me = asyncWrapper(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('_id email name role createdAt')
    .lean();
  return ok(res, { ...user, id: String(user._id) });
});

export const updateProfile = asyncWrapper(async (req, res) => {
  const { name } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { name } },
    { new: true, projection: '_id email name role' }
  ).lean();
  return ok(res, { ...user, id: String(user._id) }, 'Profil mis à jour');
});

export const changePassword = asyncWrapper(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('passwordHash');
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(400, 'Mot de passe actuel incorrect');
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ _id: req.user.id }, { $set: { passwordHash } });
  return ok(res, null, 'Mot de passe changé');
});
