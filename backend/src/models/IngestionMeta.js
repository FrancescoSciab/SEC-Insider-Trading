const mongoose = require('mongoose');

const ingestionMetaSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  lastRun: Date,
  lastQuarter: String,
  recordsInserted: Number,
  status: { type: String, enum: ['success', 'failed', 'running'] },
  errorMessage: String,
});

const IngestionMeta = mongoose.model('IngestionMeta', ingestionMetaSchema);
module.exports = { IngestionMeta };
