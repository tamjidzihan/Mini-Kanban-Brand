import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Log all incoming HTTP traffic
app.use(morgan('dev'));

app.use(cors({
  origin: ENV.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());

// App API routes
app.use('/api', routes);

// Centralized error handler
app.use(errorHandler);

const PORT = parseInt(ENV.PORT, 10) || 5000;

app.listen(PORT, () => {
  console.log(`Mini Kanban API Server running on port http://localhost:${PORT}`);
});

export default app;
