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

// Endpoint para actualizar los datos de la federación
app.post('/api/updateFederationData', (req, res) => {
  const { id, n_federacion, n_country, c_person, p_number, email_address, mobile_number } = req.body;

  // Validación de los campos requeridos
  if (!id || !n_federacion || !n_country || !c_person || !p_number || !email_address || !mobile_number) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  // Consulta SQL para actualizar los datos de la federación
  const query = `
    UPDATE federacion
    SET 
      n_federacion = ?, 
      n_country = ?, 
      c_person = ?, 
      p_number = ?, 
      email_address = ?, 
      mobile_number = ?
    WHERE id = ?
  `;

  db.query(
    query,
    [n_federacion, n_country, c_person, p_number, email_address, mobile_number, id],
    (err, result) => {
      if (err) {
        console.error('Error al actualizar los datos de la federación:', err);
        return res.status(500).send('Error al actualizar los datos');
      }

      if (result.affectedRows === 0) {
        return res.status(404).send('Federación no encontrada');
      }

      res.status(200).send({ message: 'Federación actualizada con éxito' });
    }
  );
});

// Endpoint para registrar un hotel
app.post('/api/registerHotel', (req, res) => {
  const { nombre_hotel, federacion_id } = req.body;

  // Validar los campos obligatorios
  if (!nombre_hotel || !federacion_id) {
    return res.status(400).send('Todos los campos son obligatorios');
  }

  // Generar la fecha y hora actual en formato DATETIME
  const f_registro = new Date()
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  // Generar el código único del hotel (incremental)
  const codigoQuery = `
    SELECT MAX(CAST(SUBSTRING(codigo_hotel, 2) AS UNSIGNED)) AS maxCodigo
    FROM hoteles;
  `;

  db.query(codigoQuery, (err, result) => {
    if (err) {
      console.error('Error al obtener el código máximo:', err);
      return res.status(500).send('Error al generar el código del hotel');
    }

    const maxCodigo = result[0].maxCodigo || 0;
    const nuevoCodigo = `H${String(maxCodigo + 1).padStart(4, '0')}`;

    // Insertar el nuevo hotel
    const insertQuery = `
      INSERT INTO hoteles (nombre_hotel, codigo_hotel, federacion_id, f_registro)
      VALUES (?, ?, ?, ?);
    `;

    db.query(
      insertQuery,
      [nombre_hotel, nuevoCodigo, federacion_id, f_registro],
      (err, result) => {
        if (err) {
          console.error('Error al insertar el hotel:', err);
          return res.status(500).send('Error al guardar el hotel');
        }

        res.status(201).send({
          message: 'Hotel registrado con éxito',
          id: result.insertId,
          codigo: nuevoCodigo,
        });
      }
    );
  });
});

// Endpoint para verificar si un hotel existe
app.post('/api/checkAndUpdateHotel', (req, res) => {
  const { nombre_hotel, federacion_id, f_registro } = req.body;

  // Validar que los campos requeridos estén presentes
  if (!nombre_hotel || !federacion_id) {
    return res.status(400).send({ message: 'El nombre del hotel y el ID de federación son obligatorios.' });
  }

  // Consulta para verificar si el hotel ya existe
  const checkQuery = `SELECT * FROM hoteles WHERE nombre_hotel = ? AND federacion_id = ?`;
  db.query(checkQuery, [nombre_hotel, federacion_id], (err, results) => {
    if (err) {
      console.error('Error al verificar el hotel:', err);
      return res.status(500).send({ message: 'Error al verificar el hotel.' });
    }

    if (results.length > 0) {
      // Si el hotel ya existe, devolver respuesta indicando que ya existe
      return res.status(200).send({ exists: true, message: 'El hotel ya existe. ¿Desea sobreescribirlo?' });
    } else {
      // Si el hotel no existe, devolver respuesta indicando que no existe
      return res.status(200).send({ exists: false, message: 'El hotel no existe. No se realizará ninguna acción.' });
    }
  });
});


// Endpoint para actualizar el registro de un hotel
app.put('/api/updateHotel', (req, res) => {
  const { nombre_hotel, federacion_id, f_registro } = req.body;

  // Validar que los campos requeridos estén presentes
  if (!nombre_hotel || !federacion_id || !f_registro) {
    return res.status(400).send({ message: 'Todos los campos son obligatorios.' });
  }

  // Actualizar el registro con la nueva fecha
  const updateQuery = `UPDATE hoteles SET f_registro = ? WHERE nombre_hotel = ? AND federacion_id = ?`;
  db.query(updateQuery, [f_registro, nombre_hotel, federacion_id], (err, result) => {
    if (err) {
      console.error('Error al actualizar el hotel:', err);
      return res.status(500).send({ message: 'Error al actualizar el hotel.' });
    }
    res.status(200).send({ message: 'Hotel actualizado correctamente.' });
  });
});

app.get('/api/hotels', (req, res) => {
  const federationId = req.query.federation_id;

  if (!federationId) {
    return res.status(400).json({ error: 'Se requiere un federation_id' });
  }

  // Consulta SQL para obtener los hoteles por federation_id
  const query = 'SELECT id, nombre_hotel FROM hoteles WHERE federacion_id = ?';

  db.query(query, [federationId], (err, results) => {
    if (err) {
      console.error('Error al obtener hoteles:', err);
      return res.status(500).json({ error: 'Error al obtener hoteles' });
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
