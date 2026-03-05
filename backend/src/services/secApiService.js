const axios = require('axios');
const logger = require('../utils/logger');

// SEC EDGAR requires a descriptive User-Agent per their robots.txt
const SEC_HEADERS = {
  'User-Agent': 'SEC Insider Tracker App contact@example.com',
  'Accept-Encoding': 'gzip, deflate',
  Accept: 'application/json',
};

const SEC_BASE = 'https://data.sec.gov';
const SEC_WWW = 'https://www.sec.gov';
const EFTS_BASE = 'https://efts.sec.gov';

const secClient = axios.create({
  headers: SEC_HEADERS,
  timeout: 30000,
});

/**
 * Fetch the full company tickers JSON from SEC
 * Returns: { [index]: { cik_str, ticker, title } }
 */
async function fetchCompanyTickers() {
  const url = `${SEC_WWW}/files/company_tickers.json`;
  logger.debug(`Fetching company tickers: ${url}`);
  const res = await secClient.get(url);
  return res.data;
}

/**
 * Fetch submissions (filings) for a given CIK
 */
async function fetchSubmissions(cik) {
  const paddedCik = cik.toString().padStart(10, '0');
  const url = `${SEC_BASE}/submissions/CIK${paddedCik}.json`;
  logger.debug(`Fetching submissions for CIK ${cik}`);
  const res = await secClient.get(url);
  return res.data;
}

/**
 * Fetch bulk insider transaction quarterly dataset index
 * SEC publishes quarterly archives at:
 * https://www.sec.gov/Archives/edgar/full-index/{year}/{quarter}/company.idx
 */
async function fetchQuarterlyIndex(year, quarter) {
  const url = `${SEC_WWW}/Archives/edgar/full-index/${year}/${quarter}/company.idx`;
  logger.debug(`Fetching quarterly index: ${url}`);
  const res = await secClient.get(url, { responseType: 'text' });
  return res.data;
}

/**
 * Fetch the insider transactions bulk data sets available from SEC
 * https://www.sec.gov/data-research/sec-markets-data/insider-transactions-data-sets
 */
async function fetchInsiderBulkIndex() {
  const url = `${SEC_WWW}/cgi-bin/browse-edgar?action=getcompany&type=4&dateb=&owner=include&count=40&search_text=`;
  const res = await secClient.get(url, { responseType: 'text' });
  return res.data;
}

/**
 * Download the quarterly insider transactions ZIP from SEC
 * URL pattern: https://www.sec.gov/Archives/edgar/full-index/{year}/QTR{n}/form.idx
 */
async function fetchQuarterlyFormIndex(year, qtr) {
  const url = `${SEC_WWW}/Archives/edgar/full-index/${year}/QTR${qtr}/form.idx`;
  logger.debug(`Fetching form index: ${url}`);
  const res = await secClient.get(url, { responseType: 'text' });
  return res.data;
}

/**
 * Fetch a specific EDGAR filing document
 */
async function fetchFilingDocument(accessionNumber, cik) {
  const paddedCik = cik.toString().padStart(10, '0');
  const cleanAccession = accessionNumber.replace(/-/g, '');
  const url = `${SEC_BASE}/Archives/edgar/data/${paddedCik}/${cleanAccession}/${accessionNumber}.txt`;
  const res = await secClient.get(url, { responseType: 'text' });
  return res.data;
}

/**
 * Search EDGAR full-text search for Form 4 filings
 * Returns recent Form 4 filings metadata
 */
async function searchEDGARForm4(params = {}) {
  const {
    dateFrom = getDateNDaysAgo(7),
    dateTo = getTodayString(),
    start = 0,
    hits = 20,
  } = params;

  const url = `${EFTS_BASE}/LATEST/search-index?q=%22form+4%22&dateRange=custom&startdt=${dateFrom}&enddt=${dateTo}&forms=4&from=${start}&hits.hits.total.value=true&hits.hits._source.period_of_report=true`;

  logger.debug(`Searching EDGAR: ${url}`);
  try {
    const res = await secClient.get(url);
    return res.data;
  } catch (err) {
    logger.warn('EDGAR full-text search failed, falling back to company search');
    return null;
  }
}

/**
 * Fetch recent Form 4 filings via EDGAR EFTS
 */
async function fetchRecentForm4Filings(daysBack = 7, start = 0) {
  const dateFrom = getDateNDaysAgo(daysBack);
  const dateTo = getTodayString();
  const url = `${EFTS_BASE}/LATEST/search-index?forms=4&dateRange=custom&startdt=${dateFrom}&enddt=${dateTo}&from=${start}`;
  logger.debug(`Fetching recent Form 4: ${url}`);
  try {
    const res = await secClient.get(url);
    return res.data;
  } catch (err) {
    logger.error('Failed to fetch recent Form 4 filings', { err: err.message });
    throw err;
  }
}

/**
 * Fetch Form 4 filings for a specific company (by CIK)
 */
async function fetchForm4ByCik(cik, start = 0) {
  const paddedCik = cik.toString().padStart(10, '0');
  const url = `${EFTS_BASE}/LATEST/search-index?forms=4&entity=${paddedCik}&from=${start}`;
  const res = await secClient.get(url);
  return res.data;
}

/**
 * Fetch the actual XML for a Form 4 filing
 */
async function fetchForm4Xml(accessionNumber, cik) {
  const paddedCik = cik.toString().padStart(10, '0');
  const cleanAccession = accessionNumber.replace(/-/g, '');
  // Primary document is typically named after accession
  const url = `${SEC_BASE}/Archives/edgar/data/${paddedCik}/${cleanAccession}/${accessionNumber}.xml`;
  try {
    const res = await secClient.get(url, { responseType: 'text' });
    return res.data;
  } catch {
    // Try alternate naming
    const url2 = `${SEC_BASE}/Archives/edgar/data/${paddedCik}/${cleanAccession}/`;
    const index = await secClient.get(url2 + 'index.json');
    const files = index.data?.directory?.item || [];
    const xmlFile = files.find(f => f.name?.endsWith('.xml') && !f.name.includes('R'));
    if (xmlFile) {
      const xmlRes = await secClient.get(url2 + xmlFile.name, { responseType: 'text' });
      return xmlRes.data;
    }
    throw new Error(`No XML found for ${accessionNumber}`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getDateNDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function getCurrentQuarter() {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return { year: now.getFullYear(), qtr: q };
}

module.exports = {
  fetchCompanyTickers,
  fetchSubmissions,
  fetchQuarterlyIndex,
  fetchQuarterlyFormIndex,
  fetchRecentForm4Filings,
  fetchForm4ByCik,
  fetchForm4Xml,
  searchEDGARForm4,
  getCurrentQuarter,
  getDateNDaysAgo,
  getTodayString,
};
