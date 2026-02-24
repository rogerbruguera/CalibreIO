const express = require('express');
const router = express.Router();
const db = require('../db');

// --- VARIETIES ---

router.get('/varieties', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM apple_varieties ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch varieties' });
    }
});

router.post('/varieties', async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const result = await db.query(
            'INSERT INTO apple_varieties (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') return res.status(400).json({ error: 'Variety already exists' });
        res.status(500).json({ error: 'Failed to create variety' });
    }
});

router.delete('/varieties/:id', async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        const { id } = req.params;

        // Deleting variety will cascade delete subvarieties if set up that way,
        // but fields using it might break if we don't handle it. For now, we allow it.
        const result = await db.query('DELETE FROM apple_varieties WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Variety not found' });

        res.json({ message: 'Variety deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete variety' });
    }
});

router.patch('/varieties/:id/reference-fields', async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        const { id } = req.params;
        const { reference_fields } = req.body;

        if (!Array.isArray(reference_fields)) {
            return res.status(400).json({ error: 'reference_fields must be an array of UUIDs' });
        }

        const result = await db.query(
            'UPDATE apple_varieties SET reference_fields = $1 WHERE id = $2 RETURNING *',
            [reference_fields, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Variety not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update reference fields' });
    }
});

// --- SUBVARIETIES ---

router.get('/subvarieties', async (req, res) => {
    try {
        const { variety_id } = req.query;
        let query = 'SELECT * FROM apple_subvarieties';
        let params = [];
        if (variety_id) {
            query += ' WHERE variety_id = $1';
            params.push(variety_id);
        }
        query += ' ORDER BY name ASC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch subvarieties' });
    }
});

router.post('/subvarieties', async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        const { variety_id, name } = req.body;
        if (!variety_id || !name) return res.status(400).json({ error: 'variety_id and name required' });

        const result = await db.query(
            'INSERT INTO apple_subvarieties (variety_id, name) VALUES ($1, $2) RETURNING *',
            [variety_id, name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') return res.status(400).json({ error: 'Subvariety already exists for this variety' });
        res.status(500).json({ error: 'Failed to create subvariety' });
    }
});

router.delete('/subvarieties/:id', async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
        const { id } = req.params;

        const result = await db.query('DELETE FROM apple_subvarieties WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Subvariety not found' });

        res.json({ message: 'Subvariety deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete subvariety' });
    }
});

module.exports = router;
