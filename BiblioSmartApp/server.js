const express = require('express');
const connectDB = require('./config/db');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/auth');
const booksRouter = require('./routes/books');
const forumRoutes = require('./routes/forum');

const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs'); 
const path = require('path'); 


const app = express();

// Conecta a la base de datos
connectDB();

app.use(express.urlencoded({ extended: true }));

// Middleware para parsear JSON
app.use(express.json());

app.use(bodyParser.json());

// Configurar multer para guardar archivos en 'public/uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, 'public/uploads')); // Ruta donde se guardan los archivos
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`); // Nombre único para evitar conflictos
    },
  });
  
  const upload = multer({ storage });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bibliosmart1@gmail.com', 
        pass: 'tjmg ofto euxw lasn',  
    },
  });

// Ruta para procesar el formulario CONTACTO
app.post('/send-email', async (req, res) => {
  const { nombre, email, asunto, mensaje } = req.body;

  if (!nombre || !email || !asunto || !mensaje) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
  }

  // Configuración del transportador de correo
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'bibliosmart1@gmail.com', 
      pass: 'tjmg ofto euxw lasn', // Contraseña de la app de Gmail
    },
  });

  // Opciones del correo
  const mailOptions = {
    from: email,
    to: 'bibliosmart1@gmail.com',
    subject: asunto,
    text: `Mensaje de ${nombre} <${email}>:\n\n${mensaje}`,
  };

  try {
    // Enviar el correo
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Correo enviado con éxito.' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    res.status(500).json({ success: false, message: 'Hubo un error al enviar el correo.' });
  }
});


// Ruta para procesar el formulario de ayuda
app.post('/send-help', upload.single('archivo'), (req, res) => {
    const { nombre, email, asunto, pregunta } = req.body;
    const archivo = req.file; // Archivo subido
  
    // Configurar las opciones del correo
    const mailOptions = {
      from: email,
      to: 'bibliosmart1@gmail.com',
      subject: `Solicitud de Ayuda: ${asunto}`,
      text: `Nombre: ${nombre}\nCorreo: ${email}\nMensaje:\n${pregunta}`,
      attachments: archivo
        ? [
            {
              filename: archivo.originalname,
              path: archivo.path, // Ruta del archivo subido
            },
          ]
        : [],
    };
  
    // Enviar el correo
    transporter.sendMail(mailOptions, (error, info) => {
      // Elimina el archivo después de enviar el correo
      if (archivo) fs.unlinkSync(archivo.path);
  
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({ success: false, message: 'Hubo un error al enviar el correo.' });
      }
  
      res.json({ success: true, message: 'Correo enviado correctamente.' });
    });
  });


// Habilitamos el uso de la carpeta public
app.use(express.static('public'));

// Rutas
app.use('/api/auth', userRoutes);

// Ruta del foro
app.use('/api/forum', forumRoutes);

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/home', (req, res) => {
    // Verifica si el usuario está autenticado antes de redirigir
    // Si no está autenticado, redirige al login
    const isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
    if (isAuthenticated) {
        res.sendFile(__dirname + '/public/home.html');
    } else {
        res.redirect('/login'); // Redirige al login si no está autenticado
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      
      // Aquí iría la lógica para registrar el usuario
      // Si el correo ya está registrado, lanzas un error
      const existingUser = await findUserByEmail(email);  // Función ficticia para encontrar usuario por email
      if (existingUser) {
        return res.status(400).json({ message: 'Correo electrónico ya registrado.' });
      }
  
      // Si el correo no está registrado, se registra el usuario
      await registerUser({ firstName, lastName, email, password });  // Función ficticia para registrar usuario
      
      // Si todo es exitoso
      res.json({ message: 'Usuario registrado exitosamente.' });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Hubo un error al procesar tu solicitud.' });
    }
  });
  
  

// Ruta para el inicio de sesión
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Modificar la ruta raíz para que sirva inicio.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/inicio.html'); // Cambiado para servir inicio.html
});

// Servir archivos estáticos (portadas)
app.use('/uploads', express.static('uploads'));

// Usar las rutas de libros
app.use('/books', booksRouter);

const PORT = process.env.PORT || 2500;
app.listen(PORT, () => console.log(`Server running on port ${PORT}, http://localhost:${PORT}`));
