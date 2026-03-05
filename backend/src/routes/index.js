const transactionRoutes = require('./transactions');
const searchRoutes = require('./search');
const adminRoutes = require('./admin');

function setupRoutes(app) {
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/admin', adminRoutes);
}

module.exports = { setupRoutes };
