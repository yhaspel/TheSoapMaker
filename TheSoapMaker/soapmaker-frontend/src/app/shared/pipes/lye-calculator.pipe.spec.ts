import { LyeCalculatorPipe } from './lye-calculator.pipe';

describe('LyeCalculatorPipe', () => {
  let pipe: LyeCalculatorPipe;

  beforeEach(() => {
    pipe = new LyeCalculatorPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('zero and falsy values', () => {
    it('should return 0 when oilGrams is 0', () => {
      expect(pipe.transform(0, 0.136, 5)).toBe(0);
    });

    it('should return 0 when sapValue is 0', () => {
      expect(pipe.transform(100, 0, 5)).toBe(0);
    });

    it('should return 0 when oilGrams is falsy', () => {
      expect(pipe.transform(null, 0.136, 5)).toBe(0);
      expect(pipe.transform(undefined, 0.136, 5)).toBe(0);
      expect(pipe.transform('', 0.136, 5)).toBe(0);
    });

    it('should return 0 when sapValue is falsy', () => {
      expect(pipe.transform(100, null, 5)).toBe(0);
      expect(pipe.transform(100, undefined, 5)).toBe(0);
      expect(pipe.transform(100, '', 5)).toBe(0);
    });
  });

  describe('calculation with superfat', () => {
    it('should correctly calculate NaOH with 5% superfat', () => {
      const result = pipe.transform(100, 0.136, 5);
      // 100 * 0.136 * (1 - 5/100) = 100 * 0.136 * 0.95 = 12.92
      expect(result).toBeCloseTo(12.92, 2);
    });

    it('should use default 5% superfat when not specified', () => {
      const resultWithDefault = pipe.transform(100, 0.136);
      const resultExplicit = pipe.transform(100, 0.136, 5);
      expect(resultWithDefault).toBeCloseTo(resultExplicit, 2);
      expect(resultWithDefault).toBeCloseTo(12.92, 2);
    });

    it('should correctly calculate with different superfat percentage', () => {
      const result = pipe.transform(100, 0.136, 8);
      // 100 * 0.136 * (1 - 8/100) = 100 * 0.136 * 0.92 = 12.512
      expect(result).toBeCloseTo(12.51, 2);
    });

    it('should handle 0% superfat', () => {
      const result = pipe.transform(100, 0.136, 0);
      // 100 * 0.136 * (1 - 0/100) = 100 * 0.136 * 1 = 13.6
      expect(result).toBeCloseTo(13.6, 2);
    });

    it('should handle high superfat percentages', () => {
      const result = pipe.transform(100, 0.136, 20);
      // 100 * 0.136 * (1 - 20/100) = 100 * 0.136 * 0.8 = 10.88
      expect(result).toBeCloseTo(10.88, 2);
    });
  });

  describe('various oil weights and sap values', () => {
    it('should calculate correctly with different oil weights', () => {
      const result = pipe.transform(500, 0.136, 5);
      // 500 * 0.136 * 0.95 = 64.6
      expect(result).toBeCloseTo(64.6, 2);
    });

    it('should calculate correctly with different sap values', () => {
      const result = pipe.transform(100, 0.203, 5);
      // 100 * 0.203 * 0.95 = 19.285
      expect(result).toBeCloseTo(19.29, 2);
    });

    it('should calculate correctly with decimal oil weights', () => {
      const result = pipe.transform(250.5, 0.136, 5);
      // 250.5 * 0.136 * 0.95 = 32.3318
      expect(result).toBeCloseTo(32.33, 2);
    });
  });
});
