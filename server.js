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
  host: '127.0.0.1',
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
  const { n_federacion, n_country, c_person, p_number, email_address, mobile_number, n_address, n_hotel1, n_hotel2, n_hotel3, code_country, clave } = req.body;

  // Validación de los campos
  if (!n_federacion || !c_person || !p_number || !email_address || !mobile_number || !clave || !n_address) {
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
      INSERT INTO federacion (n_federacion, n_country, c_person, p_number, email_address, mobile_number, n_address, n_hotel1, n_hotel2, n_hotel3, code_country, clave)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      query,
      [n_federacion, n_country, c_person, p_number, email_address, mobile_number, n_address, n_hotel1, n_hotel2, n_hotel3, code_country, hashedClave],
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

  // Consultar el usuario en la tabla federación
  const federationQuery = 'SELECT * FROM federacion WHERE email_address = ?';
  db.query(federationQuery, [email_address], async (err, federationResults) => {
    if (err) {
      console.error('Error al consultar la tabla federación:', err);
      return res.status(500).send('Error al autenticar el usuario');
    }

    if (federationResults.length > 0) {
      const user = federationResults[0];
      const match = await bcrypt.compare(clave, user.clave);

      if (!match) {
        return res.status(401).send('Contraseña incorrecta');
      }

      // Crear un token JWT para el usuario federado
      const token = jwt.sign(
        { id: user.id, email_address: user.email_address, role: 'USER' },
        'secreta',
        { expiresIn: '1h' }
      );

      return res.status(200).send({
        message: 'Login exitoso',
        token: token,
        role: 'USER',
        data: {
          id: user.id,
          n_federacion: user.n_federacion,
          n_country: user.n_country,
          p_number: user.p_number,
          email_address: user.email_address,
          mobile_number: user.mobile_number,
        },
      });
    }

    // Si no se encuentra en federación, buscar en la tabla usuarios directamente
    const userQuery = 'SELECT id, de_email, de_password, de_nom_solicitante, de_pat_solicitante, de_fecha FROM usuarios WHERE de_email = ? AND de_password = ?';
    db.query(userQuery, [email_address, clave], (err, userResults) => {
      if (err) {
        console.error('Error al consultar la tabla usuarios:', err);
        return res.status(500).send('Error al autenticar el usuario');
      }

      if (userResults.length === 0) {
        return res.status(404).send('Usuario no encontrado');
      }

      const admin = userResults[0];

      // Crear un token JWT para el usuario administrador
      const token = jwt.sign(
        { id: admin.id, email_address: admin.de_email, role: 'ADMIN' },
        'secreta',
        { expiresIn: '1h' }
      );

      return res.status(200).send({
        message: 'Login exitoso',
        token: token,
        role: 'ADMIN',
        data: {
          id: admin.id,
          email_address: admin.de_email,
          de_nom_solicitante: admin.de_nom_solicitante,
          de_pat_solicitante: admin.de_pat_solicitante,
          de_fecha: admin.de_fecha
        },
      });
    });
  });
});


// Ruta para obtener los datos de la federación por ID
app.get('/api/getFederationData/:id', (req, res) => {
  const federationId = req.params.id;

  // Validar que el ID esté presente
  if (!federationId) {
    return res.status(400).send('El ID de la federación es obligatorio');
  }

  // Consulta SQL para obtener los datos de la federación filtrados por ID
  const query = 'SELECT * FROM federacion WHERE id = ?';

  db.query(query, [federationId], (err, results) => {
    if (err) {
      console.error('Error al obtener los datos de la federación:', err);
      return res.status(500).send('Error al obtener los datos de la federación');
    }

    if (results.length > 0) {
      res.status(200).send(results[0]); // Devolver el primer resultado
    } else {
      res.status(404).send('No se encontraron datos para el ID proporcionado');
    }
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

app.get('/api/hotel/:federationId/:hotelId', (req, res) => {
  const federationId = req.params.federationId;
  const hotelId = req.params.hotelId;

  // Validar que ambos parámetros estén presentes
  if (!federationId || !hotelId) {
    return res.status(400).send({ message: 'El ID de la federación y del hotel son obligatorios.' });
  }

  // Consulta para obtener los datos del hotel
  const query = `SELECT * FROM hoteles WHERE federacion_id = ? AND id = ?`;
  db.query(query, [federationId, hotelId], (err, results) => {
    if (err) {
      console.error('Error al obtener los datos del hotel:', err);
      return res.status(500).send({ message: 'Error al obtener los datos del hotel.' });
    }

    if (results.length > 0) {
      // Si el hotel existe, devolver los datos del hotel
      res.status(200).send(results[0]);
    } else {
      // Si el hotel no existe, devolver un error
      res.status(404).send({ message: 'El hotel no fue encontrado.' });
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
  console.log("ID Federación: ", federationId);

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

app.get('/api/federations', (req, res) => {
  const query = 'SELECT * FROM federacion';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener las federaciones:', err);
      return res.status(500).send('Error al obtener las federaciones');
    }

    res.status(200).send(results);
  });
});

// Obtener los hoteles de una federación
app.get('/api/hotels/:id', (req, res) => {
  const federationId = req.params.id;
  console.log("FEDERACIÓN: ", federationId);
  const query = 'SELECT n_federacion, n_hotel1, n_hotel2, n_hotel3 FROM federacion WHERE id = ?';

  db.query(query, [federationId], (err, results) => {
    if (err) {
      console.error('Error al obtener los hoteles:', err);
      return res.status(500).send('Error al obtener los hoteles');
    }

    res.status(200).send(results);
  });
});

app.get('/api/hoteles/:id', (req, res) => {
  const federationsId = req.params.id;
  console.log("FEDERACIÓN: ", federationsId);
  const query = 'SELECT * FROM hoteles WHERE federacion_id = ?';

  db.query(query, [federationsId], (err, results) => {
    if (err) {
      console.error('Error al obtener los hoteles:', err);
      return res.status(500).send('Error al obtener los hoteles');
    }

    res.status(200).send(results);
  });
});

// Listado de Hoteles sin confirmar para cada federación
app.get('/api/hotelsPreview', (req, res) => {
  const federationId = req.query.federation_id;
  const query = `
    SELECT n_hotel1, n_hotel2, n_hotel3
    FROM federacion
    WHERE id = ?
  `;

  db.query(query, [federationId], (err, results) => {
    if (err) {
      console.error('Error al obtener hoteles sin confirmar:', err);
      return res.status(500).send('Error al obtener los hoteles sin confirmar');
    }

    // Obtener los hoteles seleccionados
    const hotels = [
      results[0]?.n_hotel1,
      results[0]?.n_hotel2,
      results[0]?.n_hotel3
    ].filter((hotel) => hotel);

    res.status(200).send(hotels.map((hotel) => ({ nombre_hotel: hotel })));
  });
});

// Obtener los hoteles ya guardados para marcar checkboxes
app.get('/api/approved-hotels/:id', (req, res) => {
  const federationId = req.params.id;
  const query = 'SELECT nombre_hotel FROM hoteles WHERE federacion_id = ?';

  db.query(query, [federationId], (err, results) => {
    if (err) {
      console.error('Error al obtener los hoteles aprobados:', err);
      return res.status(500).send('Error al obtener los hoteles aprobados');
    }

    res.status(200).send(results.map(h => h.nombre_hotel));
  });
});

app.put('/api/datosFederation/:id', (req, res) => {
  const federationId = req.params.id;
  const { n_federacion, mobile_number,n_address } = req.body;

  // Verificar que los campos estén presentes
  if (!n_federacion || !mobile_number || !n_address) {
    return res.status(400).send('Todos los campos son requeridos.');
  }

  const query = `
    UPDATE federacion
    SET 
      n_federacion = ?, 
      mobile_number = ?, 
      n_address = ?
    WHERE id = ?
  `;

  db.query(query, [n_federacion, mobile_number, n_address, federationId], (err, results) => {
    if (err) {
      console.error('Error al actualizar la federación:', err);
      return res.status(500).send('Error al actualizar la federación');
    }

    if (results.affectedRows === 0) {
      return res.status(404).send('Federación no encontrada');
    }

    res.status(200).send('Federación actualizada correctamente');
  });
});

// Guardar hoteles seleccionados y eliminar los desmarcados
app.post('/api/hotels', (req, res) => {
  const { selectedHotels, federationId } = req.body;
  const fechaRegistro = new Date().toISOString().slice(0, 19).replace('T', ' ');

  if (!federationId) {
    return res.status(400).send('Falta el ID de la federación');
  }

  if (!selectedHotels || selectedHotels.length === 0) {
    // Si no hay hoteles seleccionados, eliminar todos los hoteles de la federación
    const deleteAllQuery = 'DELETE FROM hoteles WHERE federacion_id = ?';
    db.query(deleteAllQuery, [federationId], (err) => {
      if (err) {
        console.error('Error eliminando todos los hoteles:', err);
        return res.status(500).send('Error eliminando todos los hoteles');
      }
      return res.status(200).send('Todos los hoteles han sido eliminados');
    });
    return;
  }

  // Obtener hoteles aprobados actuales en la base de datos
  const queryApprovedHotels = 'SELECT nombre_hotel FROM hoteles WHERE federacion_id = ?';

  db.query(queryApprovedHotels, [federationId], (err, results) => {
    if (err) {
      console.error('Error obteniendo hoteles aprobados:', err);
      return res.status(500).send('Error obteniendo hoteles aprobados');
    }

    const approvedHotels = results.map(h => h.nombre_hotel);

    // Hoteles a eliminar (desmarcados)
    const hotelsToDelete = approvedHotels.filter(hotel => !selectedHotels.includes(hotel));

    if (hotelsToDelete.length > 0) {
      const deleteQuery = 'DELETE FROM hoteles WHERE federacion_id = ? AND nombre_hotel IN (?)';
      db.query(deleteQuery, [federationId, hotelsToDelete], (err) => {
        if (err) {
          console.error('Error eliminando hoteles desmarcados:', err);
          return res.status(500).send('Error eliminando hoteles desmarcados');
        }
      });
    }

    // Hoteles a insertar (nuevos seleccionados que no están en la BD)
    const newHotels = selectedHotels.filter(hotel => !approvedHotels.includes(hotel));

    if (newHotels.length === 0) {
      return res.status(200).send('No se hicieron cambios en la lista de hoteles');
    }

    // Obtener el último código de hotel
    const queryLastCode = 'SELECT codigo_hotel FROM hoteles ORDER BY id DESC LIMIT 1';

    db.query(queryLastCode, (err, result) => {
      if (err) {
        console.error('Error obteniendo el último código de hotel:', err);
        return res.status(500).send('Error obteniendo el código de hotel');
      }

      let lastCode = result.length > 0 ? parseInt(result[0].codigo_hotel.substring(1)) : 0;

      const values = newHotels.map(hotel => {
        lastCode++;
        return [`H${lastCode}`, hotel, federationId, fechaRegistro];
      });

      const queryInsert = 'INSERT INTO hoteles (codigo_hotel, nombre_hotel, federacion_id, f_registro) VALUES ?';

      db.query(queryInsert, [values], (err) => {
        if (err) {
          console.error('Error guardando nuevos hoteles:', err);
          return res.status(500).send('Error guardando nuevos hoteles');
        }

        res.status(200).send('Hoteles actualizados con éxito');
      });
    });
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
  console.log('Servidor corriendo en http://127.0.0.1:3000');
});
