/**
 * Run standalone: node scripts/ingestData.js
 * Use this for the first full data load or backfills
 */
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { ingestRecentFilings, syncCompanyTickers, ingestQuarterlyBulk } = require('../src/services/ingestionService');
const logger = require('../src/utils/logger');

const args = process.argv.slice(2);
const mode = args[0] || 'recent'; // recent | quarterly
const year = parseInt(args[1]) || new Date().getFullYear();
const qtr = parseInt(args[2]) || Math.ceil((new Date().getMonth() + 1) / 3);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  logger.info('Connected to MongoDB');

  await syncCompanyTickers();

  if (mode === 'quarterly') {
    logger.info(`Starting quarterly ingest: ${year} Q${qtr}`);
    await ingestQuarterlyBulk(year, qtr);
  } else {
    logger.info('Starting recent filings ingest (last 30 days)');
    await ingestRecentFilings(30);
  }

  await mongoose.disconnect();
  logger.info('Done');
  process.exit(0);
}

main().catch(err => {
  logger.error('Script failed', { err });
  process.exit(1);
});
