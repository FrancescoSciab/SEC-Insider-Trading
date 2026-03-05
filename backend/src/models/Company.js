const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    cik: { type: String, unique: true, index: true },
    name: { type: String, index: true },
    ticker: { type: String, index: true, uppercase: true },
  },
  { timestamps: true }
);

companySchema.index({ name: 'text', ticker: 'text' });

const Company = mongoose.model('Company', companySchema);
module.exports = { Company };
