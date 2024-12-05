const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Extrae el token del header Authorization

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Isilino123');
    req.user = decoded;  // Decodifica el token y lo agrega al objeto de solicitud (req)
    next();  // Pasa al siguiente middleware o ruta
  } catch (error) {
    console.error('Error al verificar el token:', error);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = verifyJWT;