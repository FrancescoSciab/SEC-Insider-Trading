const { Transaction } = require('../models/Transaction');
const { Company } = require('../models/Company');

/**
 * GET /api/search?q=AAPL&type=ticker|insider|all
 * Unified search endpoint
 */
async function search(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    const type = req.query.type || 'all';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    if (!q || q.length < 1) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    let filter = {};
    const isTicker = /^[A-Z]{1,5}$/.test(q.toUpperCase()) || type === 'ticker';

    if (type === 'ticker' || isTicker) {
      filter = { issuerTicker: q.toUpperCase() };
    } else if (type === 'insider') {
      filter = {
        reportingName: { $regex: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      };
    } else {
      // Try both
      filter = {
        $or: [
          { issuerTicker: q.toUpperCase() },
          { issuerName: { $regex: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
          { reportingName: { $regex: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
        ],
      };
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      query: q,
      type: isTicker ? 'ticker' : type,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/search/autocomplete?q=app
 * Returns company suggestions for the search bar
 */
async function autocomplete(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 1) return res.json({ data: [] });

    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedQ}`, 'i');

    // Search companies by ticker or name
    const [byTicker, byName] = await Promise.all([
      Company.find({ ticker: regex }).limit(5).lean(),
      Company.find({ name: { $regex: new RegExp(escapedQ, 'i') } })
        .limit(5)
        .lean(),
    ]);

    // Merge and deduplicate
    const seen = new Set();
    const results = [...byTicker, ...byName].filter(c => {
      if (seen.has(c.cik)) return false;
      seen.add(c.cik);
      return true;
    }).slice(0, 8);

    res.json({
      data: results.map(c => ({
        cik: c.cik,
        name: c.name,
        ticker: c.ticker,
      })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { search, autocomplete };
