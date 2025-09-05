import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, unique: true },
}, { timestamps: true });

function slugify(s) {
  return String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')                     
    .replace(/^-+|-+$/g, '');                        
}

CategorySchema.pre('validate', function(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
  next();
});

export default mongoose.model('Category', CategorySchema);
