const express = require('express');
const cors = require('cors');
const path = require('path');
const { optionalAuth } = require('./lib/auth');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const familyRoutes = require('./routes/familyRoutes');
const historyRoutes = require('./routes/historyRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const mealRoutes = require('./routes/mealRoutes');

const app = express();
const allowedOrigins = String(process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(optionalAuth);
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use(authRoutes);
app.use(adminRoutes);
app.use(mealRoutes);
app.use(historyRoutes);
app.use(ingredientRoutes);
app.use(familyRoutes);

module.exports = app;
