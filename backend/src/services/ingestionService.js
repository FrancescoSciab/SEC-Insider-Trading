const logger = require('../utils/logger');
const { Transaction } = require('../models/Transaction');
const { Company } = require('../models/Company');
const { IngestionMeta } = require('../models/IngestionMeta');
const {
  fetchCompanyTickers,
  fetchRecentForm4Filings,
  fetchForm4Xml,
  fetchQuarterlyFormIndex,
  getCurrentQuarter,
  getDateNDaysAgo,
} = require('./secApiService');
const { parseForm4Xml } = require('./form4Parser');

const BATCH_DELAY_MS = 500; // Polite delay between SEC requests
const MAX_FILINGS_PER_RUN = 200; // Cap per cron run to stay polite

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sync the company tickers lookup table
 */
async function syncCompanyTickers() {
  logger.info('Syncing company tickers...');
  try {
    const data = await fetchCompanyTickers();
    const entries = Object.values(data);
    const bulk = entries.map(e => ({
      updateOne: {
        filter: { cik: e.cik_str.toString().padStart(10, '0') },
        update: {
          $set: {
            cik: e.cik_str.toString().padStart(10, '0'),
            name: e.title,
            ticker: e.ticker?.toUpperCase(),
          },
        },
        upsert: true,
      },
    }));

    if (bulk.length > 0) {
      await Company.bulkWrite(bulk, { ordered: false });
      logger.info(`Upserted ${bulk.length} company records`);
    }
  } catch (err) {
    logger.error('Failed to sync company tickers', { err: err.message });
  }
}

/**
 * Ingest recent Form 4 filings (last N days)
 * Called by cron and on first startup
 */
async function ingestRecentFilings(daysBack = 7) {
  logger.info(`Ingesting recent Form 4 filings (last ${daysBack} days)...`);
  let inserted = 0;
  let processed = 0;
  let start = 0;
  const pageSize = 20;

  try {
    while (processed < MAX_FILINGS_PER_RUN) {
      const data = await fetchRecentForm4Filings(daysBack, start);
      const hits = data?.hits?.hits || [];

      if (hits.length === 0) break;

      for (const hit of hits) {
        if (processed >= MAX_FILINGS_PER_RUN) break;
        processed++;

        const source = hit._source || {};
        const accessionRaw = source.file_date
          ? hit._id
          : (source.accession_no || hit._id);
        const accessionNumber = (accessionRaw || '').replace(/\//g, '-');
        const cik = source.entity_id || source.ciks?.[0];
        const filingDate = source.file_date || source.period_of_report;
        const ticker = source.tickers?.[0]?.toUpperCase();

        if (!accessionNumber || !cik) continue;

        // Check if already ingested
        const exists = await Transaction.exists({
          accessionNumber,
        });
        if (exists) continue;

        await sleep(BATCH_DELAY_MS);

        try {
          const xml = await fetchForm4Xml(accessionNumber, cik);
          const txns = parseForm4Xml(xml, accessionNumber, filingDate, ticker);

          if (txns.length > 0) {
            const bulk = txns.map(t => ({
              updateOne: {
                filter: { filingId: t.filingId },
                update: { $set: t },
                upsert: true,
              },
            }));
            await Transaction.bulkWrite(bulk, { ordered: false });
            inserted += txns.length;
            logger.debug(`Ingested ${txns.length} transactions from ${accessionNumber}`);
          }
        } catch (err) {
          logger.warn(`Failed to parse filing ${accessionNumber}`, { err: err.message });
        }
      }

      if (hits.length < pageSize) break;
      start += pageSize;
    }

    logger.info(`Ingestion complete: ${inserted} transactions inserted/updated`);
    return inserted;
  } catch (err) {
    logger.error('Ingestion failed', { err: err.message });
    throw err;
  }
}

/**
 * Ingest a historical quarterly bulk data set
 * Uses the form.idx files from EDGAR full-index
 */
async function ingestQuarterlyBulk(year, qtr) {
  logger.info(`Starting quarterly bulk ingestion: ${year} Q${qtr}`);
  const quarterKey = `${year}Q${qtr}`;
  let inserted = 0;

  try {
    await IngestionMeta.updateOne(
      { key: quarterKey },
      { $set: { status: 'running', lastRun: new Date() } },
      { upsert: true }
    );

    const indexText = await fetchQuarterlyFormIndex(year, qtr);
    const lines = indexText.split('\n');

    // form.idx format: Company Name | Form Type | CIK | Date Filed | Filename
    const form4Lines = lines.filter(line => {
      const parts = line.split('|');
      return parts[1]?.trim() === '4';
    });

    logger.info(`Found ${form4Lines.length} Form 4 entries in ${quarterKey}`);

    for (let i = 0; i < Math.min(form4Lines.length, 500); i++) {
      const parts = form4Lines[i].split('|');
      const cik = parts[2]?.trim();
      const filingDate = parts[3]?.trim();
      const filename = parts[4]?.trim(); // e.g. edgar/data/1234/000...txt

      if (!cik || !filename) continue;

      // Derive accession from filename
      const accessionMatch = filename.match(/(\d{18})/);
      if (!accessionMatch) continue;
      const rawAcc = accessionMatch[1];
      const accessionNumber = `${rawAcc.slice(0, 10)}-${rawAcc.slice(10, 12)}-${rawAcc.slice(12)}`;

      const exists = await Transaction.exists({ accessionNumber });
      if (exists) continue;

      await sleep(BATCH_DELAY_MS);

      try {
        const xml = await fetchForm4Xml(accessionNumber, cik);
        const txns = parseForm4Xml(xml, accessionNumber, filingDate, null);
        txns.forEach(t => { t.quarter = quarterKey; });

        if (txns.length > 0) {
          const bulk = txns.map(t => ({
            updateOne: {
              filter: { filingId: t.filingId },
              update: { $set: t },
              upsert: true,
            },
          }));
          await Transaction.bulkWrite(bulk, { ordered: false });
          inserted += txns.length;
        }
      } catch (err) {
        logger.warn(`Quarterly skip ${accessionNumber}: ${err.message}`);
      }

      if (i % 50 === 0) {
        logger.info(`Quarterly progress: ${i}/${Math.min(form4Lines.length, 500)}`);
      }
    }

    await IngestionMeta.updateOne(
      { key: quarterKey },
      { $set: { status: 'success', recordsInserted: inserted, lastQuarter: quarterKey } }
    );

    logger.info(`Quarterly ingestion done: ${inserted} records for ${quarterKey}`);
    return inserted;
  } catch (err) {
    await IngestionMeta.updateOne(
      { key: quarterKey },
      { $set: { status: 'failed', errorMessage: err.message } }
    );
    throw err;
  }
}

/**
 * Main daily ingestion — called by cron
 */
async function runDailyIngestion() {
  logger.info('▶ Running daily ingestion...');
  try {
    // Sync company tickers first
    await syncCompanyTickers();

    // Ingest last 2 days of Form 4 filings
    const inserted = await ingestRecentFilings(2);

    await IngestionMeta.updateOne(
      { key: 'daily' },
      {
        $set: {
          status: 'success',
          lastRun: new Date(),
          recordsInserted: inserted,
        },
      },
      { upsert: true }
    );

    logger.info(`✅ Daily ingestion complete: ${inserted} new records`);
  } catch (err) {
    logger.error('Daily ingestion failed', { err: err.message });
    await IngestionMeta.updateOne(
      { key: 'daily' },
      { $set: { status: 'failed', errorMessage: err.message, lastRun: new Date() } },
      { upsert: true }
    );
  }
}

module.exports = {
  runDailyIngestion,
  ingestRecentFilings,
  ingestQuarterlyBulk,
  syncCompanyTickers,
};
