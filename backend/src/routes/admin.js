const router = require('express').Router();
const { triggerIngestion, getIngestionStatus } = require('../controllers/adminController');

// Simple admin key middleware
router.use((req, res, next) => {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (process.env.NODE_ENV !== 'development' && key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// POST /api/admin/ingest  — trigger a fresh ingestion
router.post('/ingest', triggerIngestion);

// GET /api/admin/status
router.get('/status', getIngestionStatus);

module.exports = router;
