/**
 * Parses Form 4 XML into structured transaction objects
 * SEC Form 4 XML schema: https://www.sec.gov/info/edgar/edgarfm-vol2-v36.pdf
 */

const TRANSACTION_CODES = {
  P: 'Open Market Purchase',
  S: 'Open Market Sale',
  A: 'Grant / Award',
  D: 'Sale Back to Issuer',
  F: 'Tax Withholding',
  I: 'Discretionary Transaction',
  M: 'Exercise of Derivative',
  C: 'Conversion of Derivative',
  E: 'Expiration of Short Derivative',
  H: 'Expiration of Long Derivative',
  O: 'Exercise of Out-of-Money Derivative',
  X: 'Exercise of In-Money Derivative',
  G: 'Bona Fide Gift',
  L: 'Small Acquisition',
  W: 'Acquisition by Will/Laws',
  Z: 'Deposit into Voting Trust',
  J: 'Other Acquisition/Disposition',
  K: 'Equity Swap or Instrument',
  U: 'Disposition pursuant to tender',
};

/**
 * Simple XML tag value extractor (avoids heavy XML parser dependency)
 */
function getTagValue(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(re);
  return match ? match[1].trim() : null;
}

function getTagValues(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results = [];
  let match;
  while ((match = re.exec(xml)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

function getAllBlocks(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const results = [];
  let match;
  while ((match = re.exec(xml)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function parseFloat2(val) {
  if (!val) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parse a Form 4 XML string into an array of transaction records
 */
function parseForm4Xml(xmlStr, accessionNumber, filingDate, issuerTicker) {
  const transactions = [];

  // ── Issuer ────────────────────────────────────────────────────────────────
  const issuerBlock = getTagValue(xmlStr, 'issuer') || '';
  const issuerCik = getTagValue(issuerBlock || xmlStr, 'issuerCik') ||
    getTagValue(xmlStr, 'issuerCik');
  const issuerName = getTagValue(issuerBlock || xmlStr, 'issuerName') ||
    getTagValue(xmlStr, 'issuerName');
  const ticker = issuerTicker ||
    getTagValue(issuerBlock || xmlStr, 'issuerTradingSymbol') ||
    getTagValue(xmlStr, 'issuerTradingSymbol');

  // ── Reporting Owner ───────────────────────────────────────────────────────
  const ownerBlock = getTagValue(xmlStr, 'reportingOwner') || xmlStr;
  const reportingCik = getTagValue(ownerBlock, 'rptOwnerCik') ||
    getTagValue(xmlStr, 'rptOwnerCik');
  const reportingName = getTagValue(ownerBlock, 'rptOwnerName') ||
    getTagValue(xmlStr, 'rptOwnerName');

  // ── Relationship ──────────────────────────────────────────────────────────
  const relBlock = getTagValue(xmlStr, 'reportingOwnerRelationship') || '';
  const isDirector = /true|1/i.test(getTagValue(relBlock, 'isDirector') || '');
  const isOfficer = /true|1/i.test(getTagValue(relBlock, 'isOfficer') || '');
  const isTenPercentOwner = /true|1/i.test(getTagValue(relBlock, 'isTenPercentOwner') || '');
  const officerTitle = getTagValue(relBlock, 'officerTitle');

  // ── Footnotes ──────────────────────────────────────────────────────────────
  const footnoteBlocks = getAllBlocks(xmlStr, 'footnote');
  const footnotes = footnoteBlocks.map(f => {
    // Remove inner tags
    return f.replace(/<[^>]+>/g, '').trim();
  }).filter(Boolean);

  // ── Non-Derivative Transactions ───────────────────────────────────────────
  const nonDerivBlocks = getAllBlocks(xmlStr, 'nonDerivativeTransaction');
  nonDerivBlocks.forEach((block, idx) => {
    const txCode = getTagValue(block, 'transactionCode');
    const sharesTraded = parseFloat2(getTagValue(block, 'transactionShares') ||
      getTagValue(block, 'value'));
    const pricePerShare = parseFloat2(getTagValue(block, 'transactionPricePerShare') ||
      getTagValue(block, 'transactionPricePerShare'));
    const sharesOwnedAfter = parseFloat2(getTagValue(block, 'sharesOwnedFollowingTransaction') ||
      getTagValue(block, 'value'));
    const directIndirect = getTagValue(block, 'directOrIndirectOwnership') === 'I' ? 'I' : 'D';
    const txDate = parseDate(getTagValue(block, 'transactionDate') || getTagValue(block, 'value'));
    const securityTitle = getTagValue(block, 'securityTitle') || getTagValue(block, 'value');
    const acquiredDisposed = getTagValue(block, 'transactionAcquiredDisposedCode') ||
      getTagValue(block, 'value');

    // Adjust shares sign: D = disposed (negative), A = acquired (positive)
    const signedShares = acquiredDisposed === 'D' ? -(sharesTraded || 0) : (sharesTraded || 0);

    transactions.push({
      filingId: `${accessionNumber}-nd-${idx}`,
      accessionNumber,
      issuerCik,
      issuerName: cleanText(issuerName),
      issuerTicker: ticker ? ticker.toUpperCase() : null,
      reportingCik,
      reportingName: cleanText(reportingName),
      isDirector,
      isOfficer,
      isTenPercentOwner,
      officerTitle: cleanText(officerTitle),
      transactionDate: txDate,
      filingDate: parseDate(filingDate),
      formType: '4',
      transactionCode: txCode,
      transactionCodeDescription: TRANSACTION_CODES[txCode] || txCode,
      securityTitle: cleanText(securityTitle),
      sharesTraded: signedShares,
      pricePerShare,
      totalValue: pricePerShare && sharesTraded ? Math.abs(sharesTraded) * pricePerShare : null,
      sharesOwnedAfter,
      directIndirect,
      footnotes,
      secFilingUrl: `https://www.sec.gov/Archives/edgar/data/${issuerCik}/${accessionNumber.replace(/-/g, '')}/${accessionNumber}-index.htm`,
    });
  });

  // ── Derivative Transactions ───────────────────────────────────────────────
  const derivBlocks = getAllBlocks(xmlStr, 'derivativeTransaction');
  derivBlocks.forEach((block, idx) => {
    const txCode = getTagValue(block, 'transactionCode');
    const sharesTraded = parseFloat2(getTagValue(block, 'transactionShares') || getTagValue(block, 'value'));
    const pricePerShare = parseFloat2(getTagValue(block, 'transactionPricePerShare') || getTagValue(block, 'value'));
    const sharesOwnedAfter = parseFloat2(getTagValue(block, 'sharesOwnedFollowingTransaction') || getTagValue(block, 'value'));
    const txDate = parseDate(getTagValue(block, 'transactionDate') || getTagValue(block, 'value'));
    const securityTitle = getTagValue(block, 'securityTitle') || getTagValue(block, 'value');
    const acquiredDisposed = getTagValue(block, 'transactionAcquiredDisposedCode') || getTagValue(block, 'value');
    const signedShares = acquiredDisposed === 'D' ? -(sharesTraded || 0) : (sharesTraded || 0);

    transactions.push({
      filingId: `${accessionNumber}-d-${idx}`,
      accessionNumber,
      issuerCik,
      issuerName: cleanText(issuerName),
      issuerTicker: ticker ? ticker.toUpperCase() : null,
      reportingCik,
      reportingName: cleanText(reportingName),
      isDirector,
      isOfficer,
      isTenPercentOwner,
      officerTitle: cleanText(officerTitle),
      transactionDate: txDate,
      filingDate: parseDate(filingDate),
      formType: '4',
      transactionCode: txCode,
      transactionCodeDescription: TRANSACTION_CODES[txCode] || txCode,
      securityTitle: cleanText(securityTitle) + ' (Derivative)',
      sharesTraded: signedShares,
      pricePerShare,
      totalValue: pricePerShare && sharesTraded ? Math.abs(sharesTraded) * pricePerShare : null,
      sharesOwnedAfter,
      directIndirect: 'D',
      footnotes,
      secFilingUrl: `https://www.sec.gov/Archives/edgar/data/${issuerCik}/${accessionNumber.replace(/-/g, '')}/${accessionNumber}-index.htm`,
    });
  });

  return transactions;
}

function cleanText(str) {
  if (!str) return null;
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

module.exports = { parseForm4Xml, TRANSACTION_CODES };
