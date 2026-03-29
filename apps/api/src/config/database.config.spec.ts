import { getDatabaseConfig } from './database.config';

describe('getDatabaseConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('when all required environment variables are present', () => {
    it('should return a valid DatabaseConfig object with secure defaults', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'secret';
      process.env.DB_NAME = 'cornershop';

      // Act
      const config = getDatabaseConfig();

      // Assert
      expect(config).toEqual({
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'secret',
        database: 'cornershop',
        ssl: false,
        sslRejectUnauthorized: true,
      });
    });

    it('should parse DB_PORT as a number', () => {
      // Arrange
      process.env.DB_HOST = 'db.example.com';
      process.env.DB_PORT = '5433';
      process.env.DB_USER = 'admin';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'mydb';

      // Act
      const config = getDatabaseConfig();

      // Assert
      expect(typeof config.port).toBe('number');
      expect(config.port).toBe(5433);
    });

    it('should set ssl to true when DB_SSL is "true"', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'cornershop';
      process.env.DB_SSL = 'true';

      // Act
      const config = getDatabaseConfig();

      // Assert
      expect(config.ssl).toBe(true);
    });

    it('should set ssl to false when DB_SSL is "false"', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'cornershop';
      process.env.DB_SSL = 'false';

      // Act
      const config = getDatabaseConfig();

      // Assert
      expect(config.ssl).toBe(false);
    });

    it('should default ssl to false when DB_SSL is absent', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'cornershop';
      delete process.env.DB_SSL;

      // Act
      const config = getDatabaseConfig();

      // Assert
      expect(config.ssl).toBe(false);
    });
  });

  describe('sslRejectUnauthorized behavior', () => {
    const setBaseEnv = () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'cornershop';
    };

    it('should default sslRejectUnauthorized to true when DB_SSL_REJECT_UNAUTHORIZED is absent', () => {
      // Arrange
      setBaseEnv();
      delete process.env.DB_SSL_REJECT_UNAUTHORIZED;

      // Act
      const config = getDatabaseConfig();

      // Assert — certificate validation is on by default (secure default prevents MITM)
      expect(config.sslRejectUnauthorized).toBe(true);
    });

    it('should set sslRejectUnauthorized to true when DB_SSL_REJECT_UNAUTHORIZED is "true"', () => {
      // Arrange
      setBaseEnv();
      process.env.DB_SSL_REJECT_UNAUTHORIZED = 'true';

      // Act
      const config = getDatabaseConfig();

      // Assert
      expect(config.sslRejectUnauthorized).toBe(true);
    });

    it('should set sslRejectUnauthorized to false when DB_SSL_REJECT_UNAUTHORIZED is "false"', () => {
      // Arrange — opt-out for managed DBs with self-signed certs
      setBaseEnv();
      process.env.DB_SSL_REJECT_UNAUTHORIZED = 'false';

      // Act
      const config = getDatabaseConfig();

      // Assert
      expect(config.sslRejectUnauthorized).toBe(false);
    });
  });

  describe('when required environment variables are missing', () => {
    it('should throw an error when DB_HOST is missing', () => {
      // Arrange
      delete process.env.DB_HOST;
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'cornershop';

      // Act & Assert
      expect(() => getDatabaseConfig()).toThrow('Database configuration is invalid');
    });

    it('should throw an error when DB_PORT is missing', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      delete process.env.DB_PORT;
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'cornershop';

      // Act & Assert
      expect(() => getDatabaseConfig()).toThrow('Database configuration is invalid');
    });

    it('should throw an error when DB_USER is missing', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      delete process.env.DB_USER;
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'cornershop';

      // Act & Assert
      expect(() => getDatabaseConfig()).toThrow('Database configuration is invalid');
    });

    it('should throw an error when DB_PASSWORD is missing', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'postgres';
      delete process.env.DB_PASSWORD;
      process.env.DB_NAME = 'cornershop';

      // Act & Assert
      expect(() => getDatabaseConfig()).toThrow('Database configuration is invalid');
    });

    it('should throw an error when DB_NAME is missing', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '5432';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'pass';
      delete process.env.DB_NAME;

      // Act & Assert
      expect(() => getDatabaseConfig()).toThrow('Database configuration is invalid');
    });

    it('should include all missing variable names in the error message', () => {
      // Arrange
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;

      // Act & Assert
      expect(() => getDatabaseConfig()).toThrow('Database configuration is invalid');
    });
  });

  describe('when environment variables have invalid values', () => {
    it('should throw an error when DB_PORT is not a valid number', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = 'not-a-number';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'cornershop';

      // Act & Assert
      expect(() => getDatabaseConfig()).toThrow('Database configuration is invalid');
    });

    it('should throw an error when DB_PORT is out of valid range', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '99999';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'cornershop';

      // Act & Assert
      expect(() => getDatabaseConfig()).toThrow('Database configuration is invalid');
    });

    it('should throw an error when DB_PORT is zero', () => {
      // Arrange
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '0';
      process.env.DB_USER = 'postgres';
      process.env.DB_PASSWORD = 'pass';
      process.env.DB_NAME = 'cornershop';

      // Act & Assert
      expect(() => getDatabaseConfig()).toThrow('Database configuration is invalid');
    });
  });
});
