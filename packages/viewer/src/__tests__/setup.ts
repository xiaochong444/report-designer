import { vi } from 'vitest';

// Mock @visactor/vseed to avoid ESM module resolution issues in test environment.
// The real VSeed is only needed at runtime for actual chart rendering.
vi.mock('@visactor/vseed', () => {
  const mockBuilder = {
    build: () => {
      // Return a minimal VChart spec that satisfies the ISpec contract
      return {
        type: 'bar',
        data: [{ id: 'mock', values: [] }],
        color: { range: ['#5B8FF9', '#5AD8A6', '#5D7092'] },
        animation: false,
      };
    },
  };

  return {
    Builder: {
      from: () => mockBuilder,
    },
    registerAll: vi.fn(),
    registerLightTheme: vi.fn(),
    registerDarkTheme: vi.fn(),
    lightTheme: () => ({ config: {} }),
    darkTheme: () => ({ config: {} }),
    createTokenThemeConfig: (opts: any) => opts,
  };
});
