const { Transaction } = require('../models/Transaction');
const logger = require('../utils/logger');

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function getPagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit) || DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * GET /api/transactions/recent
 */
async function getRecent(req, res, next) {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { code, from, to } = req.query;

    const filter = {};
    if (code) filter.transactionCode = code.toUpperCase();
    if (from || to) {
      filter.transactionDate = {};
      if (from) filter.transactionDate.$gte = new Date(from);
      if (to) filter.transactionDate.$lte = new Date(to);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ filingDate: -1, transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
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
 * GET /api/transactions/ticker/:ticker
 */
async function getByTicker(req, res, next) {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const { page, limit, skip } = getPagination(req.query);
    const { code, from, to } = req.query;

    const filter = { issuerTicker: ticker };
    if (code) filter.transactionCode = code.toUpperCase();
    if (from || to) {
      filter.transactionDate = {};
      if (from) filter.transactionDate.$gte = new Date(from);
      if (to) filter.transactionDate.$lte = new Date(to);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    if (total === 0) {
      return res.json({
        data: [],
        pagination: { page, limit, total: 0, pages: 0 },
        message: `No transactions found for ticker "${ticker}". Data may not be ingested yet.`,
      });
    }

    res.json({
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions/insider/:name
 */
async function getByInsider(req, res, next) {
  try {
    const name = req.params.name;
    const { page, limit, skip } = getPagination(req.query);
    const { from, to } = req.query;

    // Case-insensitive name search
    const filter = {
      reportingName: { $regex: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    };
    if (from || to) {
      filter.transactionDate = {};
      if (from) filter.transactionDate.$gte = new Date(from);
      if (to) filter.transactionDate.$lte = new Date(to);
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
      data: transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions/:id
 */
async function getById(req, res, next) {
  try {
    const transaction = await Transaction.findById(req.params.id).lean();
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ data: transaction });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transactions/stats/:ticker
 * Summary stats: total buys vs sells, biggest transactions, active insiders
 */
async function getStats(req, res, next) {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const daysBack = parseInt(req.query.days) || 90;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const [stats] = await Transaction.aggregate([
      {
        $match: {
          issuerTicker: ticker,
          transactionDate: { $gte: since },
        },
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalBuyValue: {
            $sum: {
              $cond: [{ $gt: ['$sharesTraded', 0] }, { $ifNull: ['$totalValue', 0] }, 0],
            },
          },
          totalSellValue: {
            $sum: {
              $cond: [{ $lt: ['$sharesTraded', 0] }, { $abs: { $ifNull: ['$totalValue', 0] } }, 0],
            },
          },
          buyCount: {
            $sum: { $cond: [{ $gt: ['$sharesTraded', 0] }, 1, 0] },
          },
          sellCount: {
            $sum: { $cond: [{ $lt: ['$sharesTraded', 0] }, 1, 0] },
          },
          uniqueInsiders: { $addToSet: '$reportingName' },
        },
      },
      {
        $project: {
          totalTransactions: 1,
          totalBuyValue: 1,
          totalSellValue: 1,
          buyCount: 1,
          sellCount: 1,
          uniqueInsiderCount: { $size: '$uniqueInsiders' },
          netSentiment: {
            $cond: [
              { $gt: ['$totalBuyValue', '$totalSellValue'] },
              'bullish',
              { $cond: [{ $lt: ['$totalBuyValue', '$totalSellValue'] }, 'bearish', 'neutral'] },
            ],
          },
        },
      },
    ]);

    const recentTransactions = await Transaction.find({
      issuerTicker: ticker,
      transactionDate: { $gte: since },
    })
      .sort({ totalValue: -1 })
      .limit(5)
      .lean();

    res.json({
      ticker,
      period: `${daysBack} days`,
      stats: stats || {
        totalTransactions: 0,
        totalBuyValue: 0,
        totalSellValue: 0,
        buyCount: 0,
        sellCount: 0,
        uniqueInsiderCount: 0,
        netSentiment: 'neutral',
      },
      topTransactions: recentTransactions,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getByTicker, getByInsider, getById, getRecent, getStats };
