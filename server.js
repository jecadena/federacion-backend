const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Para generar el token JWT

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Conexión a la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        // Cambia esto por tu usuario de MySQL si es diferente
  password: '',        // Cambia esto si tu base de datos tiene una contraseña
  database: 'federacion',  // Nombre de la base de datos
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos MySQL.');
  }
});

// Método para insertar federación
app.post('/api/federacion', async (req, res) => {
  const { n_federacion, n_country, c_person, p_number, email_address, mobile_number, clave } = req.body;

  // Validación de los campos
  if (!n_federacion || !n_country || !c_person || !p_number || !email_address || !mobile_number || !clave) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  // Verificar si la clave está vacía
  if (!clave) {
    return res.status(400).send('La clave es obligatoria');
  }

  try {
    // Encriptar la clave antes de guardarla
    const hashedClave = await bcrypt.hash(clave, 10);

    console.log('Clave encriptada:', hashedClave); // Esto es solo para depurar, puedes eliminarlo más tarde

    // Consulta SQL para insertar los datos en la base de datos
    const query = `
      INSERT INTO federacion (n_federacion, n_country, c_person, p_number, email_address, mobile_number, clave)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [n_federacion, n_country, c_person, p_number, email_address, mobile_number, hashedClave],
      (err, result) => {
        if (err) {
          console.error('Error al insertar datos:', err);
          return res.status(500).send('Error al guardar la federación');
        } else {
          res.status(201).send({ message: 'Federación guardada con éxito', id: result.insertId });
        }
      }
    );
  } catch (err) {
    console.error('Error al encriptar la clave:', err);
    return res.status(500).send('Error al encriptar la clave');
  }
});

// Endpoint para el login
app.post('/api/login', (req, res) => {
  const { email_address, clave } = req.body;

  // Verificar que se envíen ambos campos
  if (!email_address || !clave) {
    return res.status(400).send('El correo y la clave son obligatorios');
  }

  // Consultar el usuario en la base de datos
  const query = 'SELECT * FROM federacion WHERE email_address = ?';
  db.query(query, [email_address], async (err, results) => {
    if (err) {
      console.error('Error al consultar el usuario:', err);
      return res.status(500).send('Error al autenticar el usuario');
    }

    if (results.length === 0) {
      return res.status(404).send('Usuario no encontrado');
    }

    const user = results[0];

    // Comparar la contraseña ingresada con la almacenada
    const match = await bcrypt.compare(clave, user.clave);

    if (!match) {
      return res.status(401).send('Contraseña incorrecta');
    }

    // Crear un token JWT
    const token = jwt.sign(
      { id: user.id, email_address: user.email_address },
      'secreta', // Esta es la clave secreta, cambia por algo más seguro
      { expiresIn: '1h' } // El token expira en 1 hora
    );

    res.status(200).send({
      message: 'Login exitoso',
      token: token
    });
  });
});

// Ruta para obtener los datos de la federación
app.get('/api/getFederationData', (req, res) => {
  // Consulta SQL para obtener los datos de la federación
  const query = 'SELECT * FROM federacion';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener los datos de la federación:', err);
      return res.status(500).send('Error al obtener los datos de la federación');
    }

    // Enviar los resultados como respuesta
    res.status(200).send(results);
  });
});

// Middleware para verificar el token JWT
function verifyToken(req, res, next) {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(403).send('Acceso denegado. No se proporcionó un token.');
  }

  try {
    const decoded = jwt.verify(token, 'secreta'); // Verifica el token con la misma clave secreta
    req.user = decoded; // Almacena los datos del usuario en la solicitud
    next(); // Continúa con la siguiente función
  } catch (err) {
    return res.status(401).send('Token no válido o expirado');
  }
}

// Endpoint de logout
app.post('/api/logout', (req, res) => {
  // Aquí no necesitamos hacer nada en el servidor si solo invalidamos el token
  // El cliente debe eliminar el token almacenado (por ejemplo, en localStorage o sessionStorage)

  // Enviar una respuesta de éxito
  res.status(200).send({ message: 'Logout exitoso' });
});

// Ejemplo de una ruta protegida por JWT
app.get('/api/protected', verifyToken, (req, res) => {
  res.status(200).send(`Hola ${req.user.email_address}, tienes acceso a esta ruta protegida.`);
});

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
