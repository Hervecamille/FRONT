import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../src/models/Product.js';
import Category from '../src/models/Category.js';

const MONGO = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';

const mockProducts = [
  { title: 'Guitare acoustique Fender FA-125', description: 'Guitare acoustique idéale pour débutants', price: 75000, stock: 15, category: 'cordes' },
  { title: 'Piano numérique Yamaha P-45', description: 'Piano numérique portable avec toucher Graded Hammer Standard', price: 300000, stock: 5, category: 'claviers' },
  { title: 'Microphone Shure SM58', description: 'Microphone dynamique professionnel pour chant et instruments', price: 15000, stock: 20, category: 'accessoires' },
  { title: 'Amplificateur Marshall MG15', description: 'Amplificateur guitare 15W avec effets intégrés', price: 25000, stock: 10, category: 'accessoires' },
  { title: 'Câble jack 6.35mm', description: 'Câble jack 6.35mm pour connexion aux instruments', price: 5000, stock: 50, category: 'accessoires' },
  { title: 'Médiateur pack x10', description: 'Pack de 10 médiators en plastique de différentes épaisseurs', price: 4500, stock: 30, category: 'accessoires' },
  { title: 'Capodastre', description: 'Capodastre pour guitare et batterie', price: 6500, stock: 12, category: 'accessoires' },
  { title: 'Sac pour guitare', description: 'Sac pour guitare en cuir confortable', price: 8000, stock: 8, category: 'accessoires' },
  { title: 'Flûte traversière', description: 'Flûte traversière en bois de chêne', price: 25000, stock: 6, category: 'vents' },
  { title: 'Batterie électronique', description: 'Batterie électronique avec 200 sons intégrés', price: 400000, stock: 3, category: 'percussions' },
  { title: 'Violon', description: 'Violon acoustique avec archet et étui', price: 65000, stock: 7, category: 'cordes' },
  { title: 'Dieme de musique', description: 'Dieme de musique pour les musiciens professionnels', price: 12000, stock: 2, category: 'accessoires' }
];

async function run() {
  await mongoose.connect(MONGO);
  console.log('✅ MongoDB connecté');

  const categoryNames = [...new Set(mockProducts.map(p => p.category))];
  const categoryMap = {};
  for (const name of categoryNames) {
    let cat = await Category.findOne({ name });
    if (!cat) cat = await Category.create({ name });
    categoryMap[name] = cat._id;
  }
  console.log('✅ Catégories prêtes:', categoryMap);

  for (const p of mockProducts) {
    const exists = await Product.findOne({ title: p.title });
    if (exists) {
      console.log('↪︎ Déjà présent:', exists.title, exists._id.toString());
      continue;
    }
    const created = await Product.create({
      title: p.title,
      description: p.description,
      price: p.price,
      stock: p.stock,
      categoryId: categoryMap[p.category], 
      imageUrl: '' 
    });
    console.log('🆕 Créé:', created.title, created._id.toString());
  }

  await mongoose.disconnect();
  console.log('🏁 Seed terminé');
}

run().catch(err => {
  console.error('❌ Seed erreur:', err);
  process.exit(1);
});
