require('dotenv').config();

const app = require('./app');
const connectDB = require('./db');
const { ensureMealsSeeded } = require('./services/bootstrapService');

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;

async function bootstrap() {
  try {
    await connectDB();
    await ensureMealsSeeded();
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to bootstrap server:', error);
    process.exit(1);
  }
}

bootstrap();
