require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// Ruta para registrar un nuevo usuario
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Verifica si el usuario ya existe
    let user = await User.findOne({ email });
    if (user) {
      // Si el correo ya está registrado, redirigir con un mensaje de error
      return res.status(400).json({ message: 'Correo electrónico ya registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crea el nuevo usuario
    user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      savedBooks: []  // Inicializa el campo savedBooks como un array vacío
    });

    await user.save();
    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Ruta para validar el inicio de sesión de un usuario
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Busca el usuario por el correo electrónico
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Correo electrónico no encontrado' });

    // Compara la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Contraseña incorrecta' });

    // Enviar el userId en lugar del token
    res.json({ message: 'Inicio de sesión exitoso', userId: user._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

module.exports = router;
