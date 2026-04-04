import { CureTimePipe } from './cure-time.pipe';

describe('CureTimePipe', () => {
  let pipe: CureTimePipe;

  beforeEach(() => {
    pipe = new CureTimePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('falsy and zero values', () => {
    it('should return "Unknown" for null', () => {
      expect(pipe.transform(null)).toBe('Unknown');
    });

    it('should return "Unknown" for undefined', () => {
      expect(pipe.transform(undefined)).toBe('Unknown');
    });

    it('should return "Unknown" for 0', () => {
      expect(pipe.transform(0)).toBe('Unknown');
    });

    it('should return "Unknown" for negative numbers', () => {
      expect(pipe.transform(-5)).toBe('Unknown');
    });

    it('should return "Unknown" for empty string', () => {
      expect(pipe.transform('')).toBe('Unknown');
    });
  });

  describe('days (< 7)', () => {
    it('should return "1 day" for 1 day', () => {
      expect(pipe.transform(1)).toBe('1 day');
    });

    it('should return "X days" for multiple days', () => {
      expect(pipe.transform(2)).toBe('2 days');
      expect(pipe.transform(3)).toBe('3 days');
      expect(pipe.transform(5)).toBe('5 days');
      expect(pipe.transform(6)).toBe('6 days');
    });
  });

  describe('weeks', () => {
    it('should return "1 week" for 7 days', () => {
      expect(pipe.transform(7)).toBe('1 week');
    });

    it('should return rounded weeks for values between 7 and 56', () => {
      expect(pipe.transform(14)).toBe('2 weeks');
      expect(pipe.transform(21)).toBe('3 weeks');
      expect(pipe.transform(28)).toBe('4 weeks');
      expect(pipe.transform(35)).toBe('5 weeks');
      expect(pipe.transform(42)).toBe('6 weeks');
      expect(pipe.transform(49)).toBe('7 weeks');
    });

    it('should round to nearest week', () => {
      expect(pipe.transform(10)).toBe('1 week');
      expect(pipe.transform(11)).toBe('2 weeks');
    });
  });

  describe('months (>= 56)', () => {
    it('should return "2 months" for 56 days', () => {
      expect(pipe.transform(56)).toBe('2 months');
    });

    it('should return "3 months" for 84 days', () => {
      expect(pipe.transform(84)).toBe('3 months');
    });

    it('should calculate months correctly for larger values', () => {
      expect(pipe.transform(112)).toBe('4 months');
      expect(pipe.transform(140)).toBe('5 months');
      expect(pipe.transform(168)).toBe('6 months');
    });
  });
});
