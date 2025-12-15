require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// --- INICIALIZAR TABLAS ---
const initDB = async () => {
  try {
    // 1. Tabla Movimientos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movimientos (
        id SERIAL PRIMARY KEY,
        concepto VARCHAR(255) NOT NULL,
        monto NUMERIC NOT NULL,
        fecha DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL
      );
    `);
    
    // 2. NUEVA: Tabla Usuarios (nombre es la clave única)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        nombre VARCHAR(50) PRIMARY KEY,
        rol VARCHAR(20) NOT NULL
      );
    `);
    
    console.log('Tablas listas (Movimientos y Usuarios) 🗄️');
  } catch (err) {
    console.error('Error iniciando DB:', err);
  }
};

initDB();

app.get('/', (req, res) => res.send('API Gastos + Usuarios 🟢'));

// --- RUTAS DE USUARIOS (AUTH) ---

// Login: Busca si el usuario existe y devuelve su rol
app.post('/api/login', async (req, res) => {
  const { nombre } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]); // Devuelve { nombre: 'Gus', rol: 'admin' }
    } else {
      res.status(404).json({ message: 'Usuario no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registro: Crea un usuario nuevo
app.post('/api/registro', async (req, res) => {
  const { nombre, rol } = req.body; // Rol debe ser 'admin' o 'viewer'
  try {
    // Verificar si ya existe
    const existe = await pool.query('SELECT * FROM usuarios WHERE nombre = $1', [nombre]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    // Crear
    await pool.query('INSERT INTO usuarios (nombre, rol) VALUES ($1, $2)', [nombre, rol]);
    res.status(201).json({ message: 'Usuario creado exitosamente', nombre, rol });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RUTAS DE MOVIMIENTOS (Igual que antes) ---
app.get('/api/movimientos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movimientos ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/movimientos', async (req, res) => {
  const { concepto, monto, fecha, tipo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO movimientos (concepto, monto, fecha, tipo) VALUES ($1, $2, $3, $4) RETURNING *',
      [concepto, monto, fecha, tipo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/movimientos/:id', async (req, res) => {
  const { id } = req.params;
  const { concepto, monto, fecha, tipo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE movimientos SET concepto = $1, monto = $2, fecha = $3, tipo = $4 WHERE id = $5 RETURNING *',
      [concepto, monto, fecha, tipo, id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/movimientos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM movimientos WHERE id = $1', [id]);
    res.json({ message: 'Eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(port, () => {
  console.log(`Server corriendo en puerto ${port}`);
});