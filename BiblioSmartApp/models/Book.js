const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 }, // Calificación entre 1 y 5
});

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  author: { type: String, required: true },
  level: { type: String, enum: ['Basico', 'Intermedio', 'Avanzado'], required: false },
  career: { type: String, required: false },
  cover: { type: String },
  pdfUrl: { type: String },  // URL del PDF
  reviews: [reviewSchema],    // Array de reseñas
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Book', bookSchema);