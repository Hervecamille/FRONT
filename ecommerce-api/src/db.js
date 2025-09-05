import mongoose from 'mongoose';
import { env } from './config/env.js';

export async function connectDB() {
  if (!env.dbUrl || typeof env.dbUrl !== 'string') {
    throw new Error('DATABASE_URL manquant. Vérifie ton fichier .env à la racine du projet.');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.dbUrl, { autoIndex: env.nodeEnv !== 'production' });
  console.log('🗄️  MongoDB connecté sur', env.dbUrl);
}
