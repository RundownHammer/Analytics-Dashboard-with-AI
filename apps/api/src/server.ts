import express from 'express';
import cors from 'cors';
import analyticsRoutes from './routes/analytics.routes';
import chatRoutes from './routes/chat.routes';
import { errorHandler, notFoundHandler, requestLogger } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api', analyticsRoutes);
app.use('/api', chatRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`✅ API server running on port ${port}`);
  console.log(`📡 Endpoints: http://localhost:${port}/api`);
  console.log(`🏥 Health: http://localhost:${port}/health`);
});

export default app;
