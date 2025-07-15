// Jest setup file for common mocks

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Headers()),
  cookies: jest.fn(() => ({
    get: jest.fn(),
    getAll: jest.fn().mockReturnValue([]),
    has: jest.fn().mockReturnValue(false),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Mock server components
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextRequest: jest.fn().mockImplementation((url, init) => {
      const urlObj = typeof url === 'string' ? new URL(url) : url;
      return {
        url: urlObj.toString(),
        method: init?.method || 'GET',
        headers: init?.headers || new Headers(),
        nextUrl: {
          pathname: urlObj.pathname,
          search: urlObj.search,
          searchParams: urlObj.searchParams,
          href: urlObj.href,
          origin: urlObj.origin,
          clone: () => urlObj,
        },
        json: jest.fn().mockImplementation(async () => {
          if (init?.body) {
            return JSON.parse(init.body);
          }
          return {};
        }),
        text: jest.fn().mockResolvedValue(init?.body || ''),
        cookies: {
          get: jest.fn(),
          getAll: jest.fn().mockReturnValue([]),
          has: jest.fn().mockReturnValue(false),
          set: jest.fn(),
          delete: jest.fn(),
        },
      };
    }),
    NextResponse: {
      json: jest.fn((data, init) => ({
        status: init?.status || 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => data,
      })),
      redirect: jest.fn((url, status = 307) => ({
        status,
        headers: new Headers({ location: url.toString() }),
      })),
      next: jest.fn(() => ({
        status: 200,
        headers: new Headers(),
      })),
    },
  };
});

// Mock React cache
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  cache: (fn: any) => fn,
}));

// Mock Sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
  Toaster: () => null,
}));

// Setup global test environment
global.fetch = jest.fn();

// Suppress console errors in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
