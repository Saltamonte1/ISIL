const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs'); // Importar fs
const Book = require('../models/Book');
const User = require('../models/User');


// Configuración de multer para cargar archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'pdf') {
      cb(null, 'uploads/pdfs/');  // Carpeta de destino para los PDFs
    } else {
      cb(null, 'uploads/');  // Carpeta de destino para otros archivos como la portada
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Ruta para agregar un libro
router.post('/add', upload.single('cover'), async (req, res) => {
  try {
    const { title, author, description, level, career } = req.body;
    console.log('Datos recibidos:', { title, author, description, level, career });

    const cover = req.file ? req.file.path : null; // Guardar la ruta de la portada si existe

    const newBook = new Book({
      title,
      author,
      description,
      level,
      career,
      cover
    });

    await newBook.save();
    res.redirect('/catalogo.html'); // Redirigir a la página de catálogo
  } catch (error) {
    console.error('Error al añadir el libro:', error);
    res.status(500).send('Hubo un error al añadir el libro.');
  }
});

// Ruta para actualizar un libro existente
router.post('/update/:id', upload.single('cover'), async (req, res) => {
  try {
    const { title, description, author, level, career } = req.body;
    console.log('Datos recibidos para actualizar:', { title, description, author, level, career });

    const updateData = { title, description, author, level, career };

    // Actualizar la portada si se sube una nueva
    if (req.file) {
      updateData.cover = req.file.path;
      console.log('Nueva portada:', req.file.path);
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedBook) {
      return res.status(404).send('Libro no encontrado');
    }

    res.redirect('/catalogo.html');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar el libro');
  }
});

// Ruta para cargar el archivo PDF
router.post('/upload/:id', upload.single('pdf'), async (req, res) => {
  try {
    const bookId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }

    // Buscar el libro
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    // Guardar la URL del archivo PDF en el libro
    book.pdfUrl = `/uploads/pdfs/${req.file.filename}`;
    await book.save();

    // Responder con la URL del PDF
    res.json({ pdfUrl: book.pdfUrl });
  } catch (error) {
    console.error('Error al cargar el archivo:', error);
    res.status(500).json({ message: 'Hubo un error al cargar el archivo' });
  }
});

// Ruta para eliminar el archivo PDF de un libro
router.delete('/delete-pdf/:id', async (req, res) => {
  try {
    const bookId = req.params.id;

    // Buscar el libro
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    // Verificar si existe un archivo PDF
    if (!book.pdfUrl) {
      return res.status(400).json({ message: 'Este libro no tiene un PDF asociado' });
    }

    // Eliminar el archivo del sistema
    const pdfPath = book.pdfUrl.replace('/uploads', './uploads');
    fs.unlinkSync(pdfPath); // Eliminar archivo del sistema

    // Eliminar la URL del PDF del libro
    book.pdfUrl = null;
    await book.save();

    res.status(200).json({ message: 'PDF eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el PDF:', error);
    res.status(500).json({ message: 'Hubo un error al eliminar el PDF' });
  }
});


// Ruta para añadir una reseña a un libro
router.post('/add-review/:id', async (req, res) => {
  const { userName, comment, rating } = req.body;
  const bookId = req.params.id;

  if (!userName || !comment || !rating) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  // Validar que la calificación esté entre 1 y 5
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'La calificación debe estar entre 1 y 5' });
  }

  try {
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    // Agregar la reseña al libro
    book.reviews.push({ userName, comment, rating });
    await book.save();

    // Calcular el promedio de las calificaciones
    const averageRating = book.reviews.reduce((acc, review) => acc + review.rating, 0) / book.reviews.length;

    // Actualizar el promedio de calificación en el libro
    book.averageRating = averageRating;
    await book.save();

    res.status(200).json({ message: 'Reseña agregada exitosamente', averageRating });
  } catch (error) {
    console.error('Error al agregar reseña:', error);
    res.status(500).json({ message: 'Hubo un error al agregar la reseña' });
  }
});

// Ruta para obtener las reseñas de un libro
router.get('/reviews/:id', async (req, res) => {
  const bookId = req.params.id;

  try {
    const book = await Book.findById(bookId).select('reviews averageRating');
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    res.status(200).json(book.reviews);
  } catch (error) {
    console.error('Error al obtener las reseñas:', error);
    res.status(500).json({ message: 'Hubo un error al obtener las reseñas' });
  }
});

// Ruta para obtener los libros con filtros
router.get('/all', async (req, res) => {
  try {
    const { title, author, level, career } = req.query;

    const filter = {};

    if (title) {
      filter.title = { $regex: title, $options: 'i' }; // Busca por título
    }

    if (author) {
      filter.author = { $regex: author, $options: 'i' }; // Busca por autor
    }

    if (level) {
      filter.level = level; // Filtro por nivel
    }

    if (career) {
      filter.career = career; // Filtro por carrera
    }

    // Buscar libros en la base de datos con los filtros
    const books = await Book.find(filter);

    // Enviar respuesta con los libros encontrados
    res.json(books);
  } catch (err) {
    console.error('Error al obtener los libros:', err);
    res.status(500).send('Error al obtener los libros');
  }
});

// Ruta para obtener un libro por su ID
router.get('/edit/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).send('Libro no encontrado');
    }
    res.json(book);  // Enviar los datos del libro al frontend
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener el libro');
  }
});

// Ruta para eliminar un libro
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(404).send('Libro no encontrado');
    }
    res.send('Libro eliminado exitosamente');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar el libro');
  }
});

// Obtener los primeros 3 libros guardados del usuario
router.get('/mis-libros/:userId', async (req, res) => {
  const { userId } = req.params;
  console.log('Recibiendo solicitud para el userId:', userId); // Verifica que el userId sea correcto

  try {
    const user = await User.findById(userId).populate('savedBooks');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log('Libros encontrados:', user.savedBooks);  // Verifica que los libros se estén obteniendo correctamente
    res.json(user.savedBooks);  // Devuelve los libros guardados en formato JSON
  } catch (error) {
    console.error('Error al obtener los libros:', error);
    res.status(500).json({ message: 'Hubo un error al obtener los libros' });
  }
});

// Obtener los 3 libros más populares
router.get('/popular', async (req, res) => {
  try {
    const popularBooks = await Book.find().sort({ views: -1 }).limit(3);
    res.json(popularBooks);  // Devuelve los libros más populares en formato JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los libros populares' });
  }
});

// Obtener los 3 libros más recientes
router.get('/recent', async (req, res) => {
  try {
    const recentBooks = await Book.find().sort({ createdAt: -1 }).limit(3);
    res.json(recentBooks);  // Devuelve los libros más recientes
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los libros recientes' });
  }
});

// Guardar un libro en los "Mis Libros" del usuario
router.post('/save', async (req, res) => {
  const { userId, bookId } = req.body; // El ID del libro y del usuario

  console.log('userId:', userId);  // Depuración para verificar el userId
  console.log('bookId:', bookId);  // Depuración para verificar el bookId

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    if (user.savedBooks.includes(bookId)) {
      return res.status(400).json({ message: 'Este libro ya está en tus libros guardados' });
    }

    user.savedBooks.push(bookId);
    await user.save();

    res.status(200).json({ message: 'Libro guardado en Mis Libros' });
  } catch (error) {
    console.error('Error al guardar el libro en Mis Libros:', error);
    res.status(500).json({ message: 'Hubo un error al guardar el libro' });
  }
});


// Mostrar solo los libros guardados por el usuario
router.get('/my-books', async (req, res) => {
  const userId = req.user.id;  // Suponiendo que tienes autenticación
  try {
    const user = await User.findById(userId).populate('savedBooks');
    res.json(user.savedBooks);  // Devuelve los libros guardados
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tus libros guardados' });
  }
});

module.exports = router;  // Exportas el router para que se use en server.js
