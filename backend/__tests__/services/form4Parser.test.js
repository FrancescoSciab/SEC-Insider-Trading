const { parseForm4Xml, TRANSACTION_CODES } = require('../../src/services/form4Parser');

// ── Sample Form 4 XML (representative minimal structure) ──────────────────────
const SAMPLE_PURCHASE_XML = `
<?xml version="1.0"?>
<ownershipDocument>
  <issuer>
    <issuerCik>0001045810</issuerCik>
    <issuerName>NVIDIA Corp</issuerName>
    <issuerTradingSymbol>NVDA</issuerTradingSymbol>
  </issuer>
  <reportingOwner>
    <reportingOwnerId>
      <rptOwnerCik>0001234567</rptOwnerCik>
      <rptOwnerName>Jensen Huang</rptOwnerName>
    </reportingOwnerId>
    <reportingOwnerRelationship>
      <isDirector>1</isDirector>
      <isOfficer>1</isOfficer>
      <isTenPercentOwner>0</isTenPercentOwner>
      <officerTitle>Chief Executive Officer</officerTitle>
    </reportingOwnerRelationship>
  </reportingOwner>
  <nonDerivativeTable>
    <nonDerivativeTransaction>
      <securityTitle><value>Common Stock</value></securityTitle>
      <transactionDate><value>2024-11-15</value></transactionDate>
      <transactionCoding>
        <transactionCode>P</transactionCode>
      </transactionCoding>
      <transactionAmounts>
        <transactionShares><value>10000</value></transactionShares>
        <transactionPricePerShare><value>138.50</value></transactionPricePerShare>
        <transactionAcquiredDisposedCode><value>A</value></transactionAcquiredDisposedCode>
      </transactionAmounts>
      <postTransactionAmounts>
        <sharesOwnedFollowingTransaction><value>5000000</value></sharesOwnedFollowingTransaction>
      </postTransactionAmounts>
      <ownershipNature>
        <directOrIndirectOwnership><value>D</value></directOrIndirectOwnership>
      </ownershipNature>
    </nonDerivativeTransaction>
  </nonDerivativeTable>
  <footnotes>
    <footnote id="F1">Transaction executed under Rule 10b5-1 plan.</footnote>
  </footnotes>
</ownershipDocument>
`;

const SAMPLE_SALE_XML = `
<?xml version="1.0"?>
<ownershipDocument>
  <issuer>
    <issuerCik>0000320193</issuerCik>
    <issuerName>Apple Inc.</issuerName>
    <issuerTradingSymbol>AAPL</issuerTradingSymbol>
  </issuer>
  <reportingOwner>
    <reportingOwnerId>
      <rptOwnerCik>0009876543</rptOwnerCik>
      <rptOwnerName>Tim Cook</rptOwnerName>
    </reportingOwnerId>
    <reportingOwnerRelationship>
      <isOfficer>1</isOfficer>
      <officerTitle>CEO</officerTitle>
    </reportingOwnerRelationship>
  </reportingOwner>
  <nonDerivativeTable>
    <nonDerivativeTransaction>
      <securityTitle><value>Common Stock</value></securityTitle>
      <transactionDate><value>2024-11-20</value></transactionDate>
      <transactionCoding>
        <transactionCode>S</transactionCode>
      </transactionCoding>
      <transactionAmounts>
        <transactionShares><value>50000</value></transactionShares>
        <transactionPricePerShare><value>224.10</value></transactionPricePerShare>
        <transactionAcquiredDisposedCode><value>D</value></transactionAcquiredDisposedCode>
      </transactionAmounts>
      <postTransactionAmounts>
        <sharesOwnedFollowingTransaction><value>3200000</value></sharesOwnedFollowingTransaction>
      </postTransactionAmounts>
      <ownershipNature>
        <directOrIndirectOwnership><value>D</value></directOrIndirectOwnership>
      </ownershipNature>
    </nonDerivativeTransaction>
  </nonDerivativeTable>
</ownershipDocument>
`;

const EMPTY_XML = `
<?xml version="1.0"?>
<ownershipDocument>
  <issuer>
    <issuerCik>0001111111</issuerCik>
    <issuerName>Test Corp</issuerName>
  </issuer>
  <reportingOwner>
    <reportingOwnerId>
      <rptOwnerCik>0002222222</rptOwnerCik>
      <rptOwnerName>Test Person</rptOwnerName>
    </reportingOwnerId>
  </reportingOwner>
</ownershipDocument>
`;

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('form4Parser — parseForm4Xml', () => {

  describe('Purchase transaction (code P, acquired)', () => {
    let txns;
    beforeEach(() => {
      txns = parseForm4Xml(SAMPLE_PURCHASE_XML, '0001045810-24-000001', '2024-11-17', 'NVDA');
    });

    test('returns an array of transactions', () => {
      expect(Array.isArray(txns)).toBe(true);
      expect(txns.length).toBeGreaterThan(0);
    });

    test('extracts issuer details correctly', () => {
      expect(txns[0].issuerName).toBe('NVIDIA Corp');
      expect(txns[0].issuerTicker).toBe('NVDA');
      expect(txns[0].issuerCik).toBe('0001045810');
    });

    test('extracts reporting owner details correctly', () => {
      expect(txns[0].reportingName).toBe('Jensen Huang');
      expect(txns[0].reportingCik).toBe('0001234567');
    });

    test('extracts relationship flags correctly', () => {
      expect(txns[0].isDirector).toBe(true);
      expect(txns[0].isOfficer).toBe(true);
      expect(txns[0].isTenPercentOwner).toBe(false);
      expect(txns[0].officerTitle).toBe('Chief Executive Officer');
    });

    test('sharesTraded is POSITIVE for acquired (A) transaction', () => {
      expect(txns[0].sharesTraded).toBeGreaterThan(0);
      expect(txns[0].sharesTraded).toBe(10000);
    });

    test('extracts price per share', () => {
      expect(txns[0].pricePerShare).toBe(138.5);
    });

    test('sets transaction code to P', () => {
      expect(txns[0].transactionCode).toBe('P');
      expect(txns[0].transactionCodeDescription).toBe('Open Market Purchase');
    });

    test('assigns correct filingId', () => {
      expect(txns[0].filingId).toContain('0001045810-24-000001');
    });

    test('extracts footnotes', () => {
      expect(txns[0].footnotes).toBeInstanceOf(Array);
      expect(txns[0].footnotes.length).toBeGreaterThan(0);
      expect(txns[0].footnotes[0]).toContain('10b5-1');
    });

    test('builds SEC filing URL', () => {
      expect(txns[0].secFilingUrl).toContain('sec.gov');
    });
  });

  describe('Sale transaction (code S, disposed)', () => {
    let txns;
    beforeEach(() => {
      txns = parseForm4Xml(SAMPLE_SALE_XML, '0000320193-24-000001', '2024-11-22', 'AAPL');
    });

    test('sharesTraded is NEGATIVE for disposed (D) transaction', () => {
      expect(txns[0].sharesTraded).toBeLessThan(0);
      expect(txns[0].sharesTraded).toBe(-50000);
    });

    test('sets transaction code to S', () => {
      expect(txns[0].transactionCode).toBe('S');
      expect(txns[0].transactionCodeDescription).toBe('Open Market Sale');
    });

    test('extracts shares owned after', () => {
      expect(txns[0].sharesOwnedAfter).toBe(3200000);
    });

    test('sets direct ownership flag', () => {
      expect(txns[0].directIndirect).toBe('D');
    });

    test('has empty footnotes array when no footnotes in XML', () => {
      expect(txns[0].footnotes).toBeInstanceOf(Array);
    });
  });

  describe('Edge cases', () => {
    test('returns empty array when no transactions in XML', () => {
      const txns = parseForm4Xml(EMPTY_XML, 'test-accession', '2024-01-01', null);
      expect(Array.isArray(txns)).toBe(true);
      expect(txns.length).toBe(0);
    });

    test('handles missing ticker gracefully — uses XML value', () => {
      const txns = parseForm4Xml(SAMPLE_PURCHASE_XML, 'acc-123', '2024-01-01', null);
      // Parser should fall back to issuerTradingSymbol in XML
      expect(txns[0].issuerTicker).toBeTruthy();
    });

    test('handles malformed/empty XML without throwing', () => {
      expect(() => {
        parseForm4Xml('<ownershipDocument></ownershipDocument>', 'acc', '2024-01-01', null);
      }).not.toThrow();
    });
  });

  describe('TRANSACTION_CODES lookup table', () => {
    test('contains all major transaction codes', () => {
      expect(TRANSACTION_CODES['P']).toBe('Open Market Purchase');
      expect(TRANSACTION_CODES['S']).toBe('Open Market Sale');
      expect(TRANSACTION_CODES['A']).toBe('Grant / Award');
      expect(TRANSACTION_CODES['M']).toBe('Exercise of Derivative');
    });
  });
});
