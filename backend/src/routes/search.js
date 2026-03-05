const router = require('express').Router();
const { search, autocomplete } = require('../controllers/searchController');

// GET /api/search?q=AAPL&type=ticker|insider|all&page=1&limit=20
router.get('/', search);

// GET /api/search/autocomplete?q=app
router.get('/autocomplete', autocomplete);

module.exports = router;
