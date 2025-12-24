// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock crypto.randomUUID for tests
if (typeof global.crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => Math.random().toString(36).substring(2, 15),
  }
}
