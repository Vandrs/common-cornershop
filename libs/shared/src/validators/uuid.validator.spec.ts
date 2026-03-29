import { isValidUUID } from './uuid.validator';

describe('isValidUUID', () => {
  describe('isValidUUID', () => {
    it('should return true when given a valid UUID v4', () => {
      // Arrange
      const validUUID = '550e8400-e29b-4fd4-a716-446655440000';

      // Act
      const result = isValidUUID(validUUID);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true when given a valid UUID v4 with uppercase letters', () => {
      // Arrange
      const validUUID = '550E8400-E29B-4FD4-A716-446655440000';

      // Act
      const result = isValidUUID(validUUID);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when given an empty string', () => {
      // Arrange
      const emptyString = '';

      // Act
      const result = isValidUUID(emptyString);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when given a UUID v1', () => {
      // Arrange
      const uuidV1 = '550e8400-e29b-11d4-a716-446655440000';

      // Act
      const result = isValidUUID(uuidV1);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when given a UUID v3', () => {
      // Arrange
      const uuidV3 = '550e8400-e29b-31d4-a716-446655440000';

      // Act
      const result = isValidUUID(uuidV3);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when given a UUID v5', () => {
      // Arrange
      const uuidV5 = '550e8400-e29b-51d4-a716-446655440000';

      // Act
      const result = isValidUUID(uuidV5);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when given a plain string', () => {
      // Arrange
      const notUUID = 'not-a-uuid';

      // Act
      const result = isValidUUID(notUUID);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when given a UUID missing a segment', () => {
      // Arrange
      const malformed = '550e8400-e29b-4fd4-a716';

      // Act
      const result = isValidUUID(malformed);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when given a UUID with extra characters', () => {
      // Arrange
      const tooLong = '550e8400-e29b-4fd4-a716-446655440000-extra';

      // Act
      const result = isValidUUID(tooLong);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when given a string of only whitespace', () => {
      // Arrange
      const whitespace = '   ';

      // Act
      const result = isValidUUID(whitespace);

      // Assert
      expect(result).toBe(false);
    });
  });
});
