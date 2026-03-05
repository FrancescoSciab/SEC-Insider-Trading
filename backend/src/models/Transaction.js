const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // ── Identifiers ──────────────────────────────────────────────────────────
    accessionNumber: { type: String, index: true },
    filingId: { type: String, unique: true, index: true }, // accession + sequence

    // ── Company ──────────────────────────────────────────────────────────────
    issuerCik: { type: String, index: true },
    issuerName: { type: String, index: true },
    issuerTicker: { type: String, index: true, uppercase: true },

    // ── Insider ───────────────────────────────────────────────────────────────
    reportingName: { type: String, index: true },
    reportingCik: { type: String, index: true },
    isDirector: Boolean,
    isOfficer: Boolean,
    isTenPercentOwner: Boolean,
    officerTitle: String,

    // ── Transaction ───────────────────────────────────────────────────────────
    transactionDate: { type: Date, index: true },
    filingDate: { type: Date, index: true },
    formType: { type: String, enum: ['3', '4', '5'] },
    transactionCode: String, // P=Purchase, S=Sale, A=Award, etc.
    transactionCodeDescription: String,
    securityTitle: String,
    sharesTraded: Number,
    pricePerShare: Number,
    totalValue: Number,
    sharesOwnedAfter: Number,
    directIndirect: { type: String, enum: ['D', 'I'] }, // Direct or Indirect
    footnotes: [String],

    // ── Source ────────────────────────────────────────────────────────────────
    secFilingUrl: String,
    quarter: String, // e.g. "2024Q4"
  },
  {
    timestamps: true,
  }
);

// ── Compound indexes ──────────────────────────────────────────────────────────
transactionSchema.index({ issuerTicker: 1, transactionDate: -1 });
transactionSchema.index({ reportingName: 'text', issuerName: 'text' });
transactionSchema.index({ issuerCik: 1, transactionDate: -1 });
transactionSchema.index({ reportingCik: 1, transactionDate: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = { Transaction };
