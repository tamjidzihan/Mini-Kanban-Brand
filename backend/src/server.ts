import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { ENV } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { connectDB } from './config/db.js';
import './models/index.js';

const app = express();
const trustProxyHops = Number(ENV.TRUST_PROXY_HOPS);
if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0) {
  throw new Error('TRUST_PROXY_HOPS must be a non-negative integer.');
}
app.set('trust proxy', trustProxyHops);

// Log all incoming HTTP traffic
app.use(morgan('dev'));

app.use(cors({
  origin: ENV.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), 'uploads'), {
    dotfiles: 'deny',
    index: false,
    maxAge: '1d',
  })
);


app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Taskgrid API!' });
});

// App API routes
app.use('/api', routes);

// Centralized error handler
app.use(errorHandler);

const PORT = parseInt(ENV.PORT, 10) || 5000;

// Connect to database first, then start server
const startServer = async () => {
  try {
    if (!ENV.JWT_SECRET || ENV.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be configured with at least 32 characters');
    }
    await connectDB(); // Connect to MySQL
    app.listen(PORT, () => {
      console.log(`✅ Taskgrid API Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
