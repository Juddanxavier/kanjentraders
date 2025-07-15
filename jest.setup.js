// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Add TextEncoder/TextDecoder polyfills
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Add Request/Response polyfills
global.Request = global.Request || class Request {}
global.Response = global.Response || class Response {}

// Mock environment variables
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
process.env.BETTER_AUTH_SECRET = 'test-secret-for-testing-purposes-only'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
      replace: jest.fn()
    }
  },
  useSearchParams() {
    return {
      get: jest.fn()
    }
  },
  usePathname() {
    return '/test-path'
  }
}))

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers() {
    return new Headers()
  }
}))
