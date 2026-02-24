const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { field_id } = req.query;
    let query = "SELECT sc.*, to_char(sc.date, 'YYYY-MM-DD') as formatted_date, f.name as field_name FROM size_controls sc JOIN fields f ON sc.field_id = f.id";
    let params = [];

    if (req.user.role === 'producer') {
      query += ' WHERE sc.user_id = $1';
      params.push(req.user.id);
    } else {
      query += ' WHERE 1=1'; // placeholder for admin
    }

    if (field_id) {
      query += ` AND sc.field_id = $${params.length + 1}`;
      params.push(field_id);
    }

    query += ' ORDER BY sc.date DESC, sc.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch size controls' });
  }
});

router.get('/global-average', async (req, res) => {
  try {
    const { variety } = req.query;
    if (!variety) return res.status(400).json({ error: 'variety query parameter required' });

    // Look up reference fields for this variety
    const varCheck = await db.query('SELECT reference_fields FROM apple_varieties WHERE name = $1', [variety]);
    if (varCheck.rows.length === 0) return res.status(404).json({ error: 'Variety not found in catalog' });

    const referenceFields = varCheck.rows[0].reference_fields || [];

    if (referenceFields.length === 0) {
      return res.json([]); // No reference fields chosen yet, so no curve
    }

    // Now securely average those specific fields
    const query = `
      SELECT 
        to_char(date, 'YYYY-MM-DD') as formatted_date,
        date,
        ROUND(AVG(average_size)::numeric, 2) as aggregated_average
      FROM size_controls
      WHERE field_id = ANY($1::uuid[])
      GROUP BY date
      ORDER BY date ASC
    `;

    const result = await db.query(query, [referenceFields]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to build global average' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let checkQuery = "SELECT *, to_char(date, 'YYYY-MM-DD') as formatted_date FROM size_controls WHERE id = $1";
    let checkParams = [req.params.id];

    if (req.user.role === 'producer') {
      checkQuery += ' AND user_id = $2';
      checkParams.push(req.user.id);
    }

    const result = await db.query(checkQuery, checkParams);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found or unauthorized' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch record' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { field_id, date, average_size, sample_size, notes, measurements, zone } = req.body;
    const user_id = req.user.id;

    if (!field_id || !average_size || !sample_size) {
      return res.status(400).json({ error: 'field_id, average_size and sample_size are required' });
    }

    const measurementsJson = measurements ? JSON.stringify(measurements) : null;

    const result = await db.query(
      'INSERT INTO size_controls (field_id, user_id, date, average_size, sample_size, notes, measurements, zone) VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, $7, $8) RETURNING *',
      [field_id, user_id, date || null, average_size, sample_size, notes, measurementsJson, zone || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create size control record' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { average_size, sample_size, notes, measurements, date, zone } = req.body;

    if (req.user.role !== 'admin') {
      const check = await db.query('SELECT user_id FROM size_controls WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
      if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    }

    const measurementsJson = measurements ? JSON.stringify(measurements) : null;

    const result = await db.query(
      'UPDATE size_controls SET average_size = COALESCE($1, average_size), sample_size = COALESCE($2, sample_size), notes = COALESCE($3, notes), measurements = COALESCE($4, measurements), date = COALESCE($5, date), zone = COALESCE($6, zone) WHERE id = $7 RETURNING *',
      [average_size, sample_size, notes, measurementsJson, date, zone, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      const check = await db.query('SELECT user_id FROM size_controls WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
      if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await db.query('DELETE FROM size_controls WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

module.exports = router;
