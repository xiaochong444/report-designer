import { vi } from 'vitest';

vi.mock('@visactor/vchart', () => ({
  default: class VChartMock {},
}));

vi.mock('@visactor/vdataset', () => ({}));

vi.mock('@visactor/vseed', () => {
  const mockBuilder = {
    build: () => ({
      type: 'bar',
      data: [{ id: 'mock', values: [] }],
      color: { range: ['#5B8FF9', '#5AD8A6', '#5D7092'] },
      animation: false,
    }),
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
    createTokenThemeConfig: (opts: unknown) => opts,
  };
});
