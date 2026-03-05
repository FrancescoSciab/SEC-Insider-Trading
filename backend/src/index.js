require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const cron = require('node-cron');
const logger = require('./utils/logger');
const { setupRoutes } = require('./routes');
const { runDailyIngestion } = require('./services/ingestionService');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting — 100 requests per 15 mins per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
setupRoutes(app);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── DB + Server Start ────────────────────────────────────────────────────────
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ MongoDB connected');

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });

    // Cron: run data ingestion every day at 2am UTC
    cron.schedule('0 2 * * *', async () => {
      logger.info('⏰ Daily ingestion cron triggered');
      await runDailyIngestion();
    });

    // On first start, trigger ingestion if DB is empty
    const { Transaction } = require('./models/Transaction');
    const count = await Transaction.countDocuments();
    if (count === 0) {
      logger.info('📥 Empty DB detected — triggering initial data ingestion...');
      runDailyIngestion().catch(err => logger.error('Initial ingestion failed', { err }));
    }
  } catch (err) {
    logger.error('Failed to start server', { err });
    process.exit(1);
  }
}

startServer();
