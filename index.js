require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
});

// Obtener ventas
app.get('/ventas', (req, res) => {
  const sql = `
    SELECT
      v.id,
      e.nombre AS estudiante,
      p.nombre AS producto,
      v.cantidad,
      v.fecha,
      p.precio,
      (v.cantidad * p.precio) AS total,
      v.estudiante_id,
      v.producto_id
    FROM ventas v
    INNER JOIN estudiantes e ON v.estudiante_id = e.id
    INNER JOIN productos p ON v.producto_id = p.id
  `;

  conexion.query(sql, (err, resultados) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(resultados);
  });
});

// Obtener estudiantes
app.get('/estudiantes', (req, res) => {
  conexion.query('SELECT * FROM estudiantes', (err, resultados) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(resultados);
  });
});

// Obtener productos
app.get('/productos', (req, res) => {
  conexion.query('SELECT * FROM productos', (err, resultados) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(resultados);
  });
});

// Registrar venta
app.post('/ventas', (req, res) => {
  const { estudiante_id, producto_id, cantidad, fecha } = req.body;

  const sql = `
    INSERT INTO ventas (estudiante_id, producto_id, cantidad, fecha)
    VALUES (?, ?, ?, ?)
  `;

  conexion.query(
    sql,
    [estudiante_id, producto_id, cantidad, fecha],
    (err, resultado) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: 'Venta registrada correctamente',
        id: resultado.insertId,
      });
    }
  );
});

// Actualizar venta
app.put('/ventas/:id', (req, res) => {
  const { estudiante_id, producto_id, cantidad, fecha } = req.body;
  const { id } = req.params;

  const sql = `
    UPDATE ventas
    SET estudiante_id = ?, producto_id = ?, cantidad = ?, fecha = ?
    WHERE id = ?
  `;

  conexion.query(
    sql,
    [estudiante_id, producto_id, cantidad, fecha, id],
    (err, resultado) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (resultado.affectedRows === 0) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      res.json({ message: `Venta con ID ${id} actualizada` });
    }
  );
});

// Eliminar venta
app.delete('/ventas/:id', (req  , res) => {
  const { id } = req.params;

  conexion.query('DELETE FROM ventas WHERE id = ?', [id], (err, resultado) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json({ message: `Venta con ID ${id} eliminada` });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en el puerto ${PORT}`);
});