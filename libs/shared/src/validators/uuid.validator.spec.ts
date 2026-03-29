import { isValidUUID } from './uuid.validator';

describe('isValidUUID', () => {
  describe('isValidUUID', () => {
    it('should return true when given a valid UUID v4', () => {
      const validUUID = '550e8400-e29b-4fd4-a716-446655440000';

      const result = isValidUUID(validUUID);

      expect(result).toBe(true);
    });

    it('should return true when given a valid UUID v4 with uppercase letters', () => {
      const validUUID = '550E8400-E29B-4FD4-A716-446655440000';

      const result = isValidUUID(validUUID);

      expect(result).toBe(true);
    });

    it('should return false when given an empty string', () => {
      const emptyString = '';

      const result = isValidUUID(emptyString);

      expect(result).toBe(false);
    });

    it('should return false when given a UUID v1', () => {
      const uuidV1 = '550e8400-e29b-11d4-a716-446655440000';

      const result = isValidUUID(uuidV1);

      expect(result).toBe(false);
    });

    it('should return false when given a UUID v3', () => {
      const uuidV3 = '550e8400-e29b-31d4-a716-446655440000';

      const result = isValidUUID(uuidV3);

      expect(result).toBe(false);
    });

    it('should return false when given a UUID v5', () => {
      const uuidV5 = '550e8400-e29b-51d4-a716-446655440000';

      const result = isValidUUID(uuidV5);

      expect(result).toBe(false);
    });

    it('should return false when given a plain string', () => {
      const notUUID = 'not-a-uuid';

      const result = isValidUUID(notUUID);

      expect(result).toBe(false);
    });

    it('should return false when given a UUID missing a segment', () => {
      const malformed = '550e8400-e29b-4fd4-a716';

      const result = isValidUUID(malformed);

      expect(result).toBe(false);
    });

    it('should return false when given a UUID with extra characters', () => {
      const tooLong = '550e8400-e29b-4fd4-a716-446655440000-extra';

      const result = isValidUUID(tooLong);

      expect(result).toBe(false);
    });

    it('should return false when given a string of only whitespace', () => {
      const whitespace = '   ';

      const result = isValidUUID(whitespace);

      expect(result).toBe(false);
    });
  });
});
