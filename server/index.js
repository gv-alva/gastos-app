require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necesario para conectar a Render desde fuera
  }
});

app.use(cors());
app.use(express.json());

// --- INICIALIZAR TABLA (Se ejecuta al arrancar) ---
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS movimientos (
        id SERIAL PRIMARY KEY,
        concepto VARCHAR(255) NOT NULL,
        monto NUMERIC NOT NULL,
        fecha DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL
      );
    `);
    console.log('Tabla de base de datos lista 🗄️');
  } catch (err) {
    console.error('Error iniciando DB:', err);
  }
};

initDB();

app.get('/', (req, res) => {
  res.send('API Financiera con PostgreSQL 🟢');
});

// --- RUTAS CON SQL ---

// 1. Obtener todos
app.get('/api/movimientos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movimientos ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Crear
app.post('/api/movimientos', async (req, res) => {
  const { concepto, monto, fecha, tipo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO movimientos (concepto, monto, fecha, tipo) VALUES ($1, $2, $3, $4) RETURNING *',
      [concepto, monto, fecha, tipo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Editar (PUT)
app.put('/api/movimientos/:id', async (req, res) => {
  const { id } = req.params;
  const { concepto, monto, fecha, tipo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE movimientos SET concepto = $1, monto = $2, fecha = $3, tipo = $4 WHERE id = $5 RETURNING *',
      [concepto, monto, fecha, tipo, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Borrar
app.delete('/api/movimientos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM movimientos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'No encontrado' });
    res.json({ message: 'Eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server corriendo en puerto ${port}`);
});