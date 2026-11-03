import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(toCsv([['a,b', 'say "hi"', 'two\nlines', 12.5, null]])).toBe(
      '"a,b","say ""hi""","two\nlines",12.5,',
    );
  });

  it('neutralizes spreadsheet formulas in text but keeps negative numbers', () => {
    expect(toCsv([['=SUM(A1)', '@cmd', -5]])).toBe("'=SUM(A1),'@cmd,-5");
  });
});
