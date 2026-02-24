require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutes
const usersRoutes = require('./routes/users');
const fieldsRoutes = require('./routes/fields');
const sizeControlsRoutes = require('./routes/sizeControls');
const authRoutes = require('./routes/auth');
const catalogRoutes = require('./routes/catalog');
const { authMiddleware } = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/catalog', authMiddleware, catalogRoutes);
app.use('/api/fields', authMiddleware, fieldsRoutes);
app.use('/api/size-controls', authMiddleware, sizeControlsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'CalibreIO Backend is running!' });
});

app.listen(port, () => {
  console.log('Server listening on port ' + port);
});
