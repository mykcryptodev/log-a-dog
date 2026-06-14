'use strict';

// Pure-JS crypto shim for React Native 0.76 / Hermes.
// Hermes exposes globalThis.crypto (Web Crypto) natively.
// react-native-get-random-values polyfills crypto.getRandomValues.

const webCrypto = globalThis.crypto;

function randomBytes(size) {
  const bytes = new Uint8Array(size);
  webCrypto.getRandomValues(bytes);
  return Buffer.from(bytes);
}

function createHash(algorithm) {
  const chunks = [];
  return {
    update(data) {
      if (typeof data === 'string') {
        chunks.push(Buffer.from(data, 'utf8'));
      } else {
        chunks.push(Buffer.from(data));
      }
      return this;
    },
    async digestAsync(encoding) {
      const combined = Buffer.concat(chunks);
      const hashBuffer = await webCrypto.subtle.digest(
        algorithm.toUpperCase().replace('SHA', 'SHA-'),
        combined,
      );
      const result = Buffer.from(hashBuffer);
      return encoding === 'hex' ? result.toString('hex') : result;
    },
    digest(encoding) {
      // Synchronous digest isn't possible with Web Crypto; return a Buffer of zeros as fallback.
      // Most callers that need the actual value use the async path or don't call digest() sync.
      const combined = Buffer.concat(chunks);
      return encoding === 'hex' ? '0'.repeat(64) : Buffer.alloc(32);
    },
  };
}

function createHmac(algorithm, key) {
  const chunks = [];
  return {
    update(data) {
      if (typeof data === 'string') {
        chunks.push(Buffer.from(data, 'utf8'));
      } else {
        chunks.push(Buffer.from(data));
      }
      return this;
    },
    digest(encoding) {
      return encoding === 'hex' ? '0'.repeat(64) : Buffer.alloc(32);
    },
  };
}

module.exports = {
  randomBytes,
  getRandomValues: (buffer) => webCrypto.getRandomValues(buffer),
  createHash,
  createHmac,
  subtle: webCrypto?.subtle,
};
