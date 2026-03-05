const router = require('express').Router();
const {
  getByTicker,
  getByInsider,
  getById,
  getRecent,
  getStats,
} = require('../controllers/transactionController');

// GET /api/transactions/recent?limit=20&page=1
router.get('/recent', getRecent);

// GET /api/transactions/ticker/:ticker?page=1&limit=20&from=&to=&code=
router.get('/ticker/:ticker', getByTicker);

// GET /api/transactions/insider/:name?page=1&limit=20
router.get('/insider/:name', getByInsider);

// GET /api/transactions/stats/:ticker
router.get('/stats/:ticker', getStats);

// GET /api/transactions/:id
router.get('/:id', getById);

module.exports = router;
