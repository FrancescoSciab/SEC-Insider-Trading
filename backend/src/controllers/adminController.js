const { runDailyIngestion, ingestQuarterlyBulk } = require('../services/ingestionService');
const { IngestionMeta } = require('../models/IngestionMeta');
const { Transaction } = require('../models/Transaction');
const logger = require('../utils/logger');

let ingestionRunning = false;

async function triggerIngestion(req, res, next) {
  try {
    if (ingestionRunning) {
      return res.json({ message: 'Ingestion already in progress', status: 'running' });
    }

    const { type = 'recent', year, qtr } = req.body;

    res.json({ message: 'Ingestion started', type });

    ingestionRunning = true;
    try {
      if (type === 'quarterly' && year && qtr) {
        await ingestQuarterlyBulk(parseInt(year), parseInt(qtr));
      } else {
        await runDailyIngestion();
      }
    } finally {
      ingestionRunning = false;
    }
  } catch (err) {
    ingestionRunning = false;
    next(err);
  }
}

async function getIngestionStatus(req, res, next) {
  try {
    const [meta, count] = await Promise.all([
      IngestionMeta.find().sort({ lastRun: -1 }).lean(),
      Transaction.countDocuments(),
    ]);
    res.json({
      totalTransactions: count,
      ingestionRunning,
      runs: meta,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { triggerIngestion, getIngestionStatus };
