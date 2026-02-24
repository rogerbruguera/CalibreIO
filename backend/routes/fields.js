const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM fields';
    let params = [];

    if (req.user.role === 'producer') {
      query += ' WHERE user_id = $1';
      params.push(req.user.id);
    } else if (req.user.role === 'admin' && req.query.user_id) {
      query += ' WHERE user_id = $1';
      params.push(req.query.user_id);
    }

    query += ' ORDER BY name ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let checkQuery = 'SELECT * FROM fields WHERE id = $1';
    let checkParams = [req.params.id];

    if (req.user.role === 'producer') {
      checkQuery += ' AND user_id = $2';
      checkParams.push(req.user.id);
    }

    const result = await db.query(checkQuery, checkParams);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Field not found or unauthorized' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch field' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, polygon, parcel, area, row_width, plantation_frame, tree_type,
      variety, specific_variety, rootstock, planting_year, irrigation_type } = req.body;

    // Force usage of the authenticated user's ID
    const user_id = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await db.query(
      'INSERT INTO fields (name, polygon, parcel, area, row_width, plantation_frame, tree_type, variety, specific_variety, rootstock, planting_year, irrigation_type, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *',
      [name, polygon, parcel, area, row_width, plantation_frame, tree_type, variety, specific_variety, rootstock, planting_year, irrigation_type, user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create field' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, polygon, parcel, area, row_width, plantation_frame, tree_type,
      variety, specific_variety, rootstock, planting_year, irrigation_type } = req.body;

    if (req.user.role !== 'admin') {
      const check = await db.query('SELECT user_id FROM fields WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Field not found' });
      if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await db.query(
      'UPDATE fields SET name = COALESCE($1, name), polygon = COALESCE($2, polygon), parcel = COALESCE($3, parcel), area = COALESCE($4, area), row_width = COALESCE($5, row_width), plantation_frame = COALESCE($6, plantation_frame), tree_type = COALESCE($7, tree_type), variety = COALESCE($8, variety), specific_variety = COALESCE($9, specific_variety), rootstock = COALESCE($10, rootstock), planting_year = COALESCE($11, planting_year), irrigation_type = COALESCE($12, irrigation_type) WHERE id = $13 RETURNING *',
      [name, polygon, parcel, area, row_width, plantation_frame, tree_type, variety, specific_variety, rootstock, planting_year, irrigation_type, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Field not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update field' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      const check = await db.query('SELECT user_id FROM fields WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Field not found' });
      if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await db.query('DELETE FROM fields WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Field not found' });
    res.json({ message: 'Field deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete field' });
  }
});

module.exports = router;
