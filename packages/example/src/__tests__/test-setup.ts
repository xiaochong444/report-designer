import { vi } from 'vitest';

vi.mock('@visactor/vchart', () => ({
  default: class VChartMock {},
}));

vi.mock('@visactor/vdataset', () => ({}));

vi.mock('@visactor/vseed', () => {
  return {
    Builder: {
      from: (input: Record<string, any>) => ({
        build: () => ({
          type: input.chartType === 'donut' ? 'pie' : input.chartType === 'column' ? 'bar' : input.chartType,
          data: [{ id: input.chartType ?? 'mock', values: input.dataset ?? [] }],
          xField: input.xField,
          yField: input.yField,
          categoryField: input.categoryField,
          valueField: input.angleField ?? input.valueField,
          color: { range: ['#5B8FF9', '#5AD8A6', '#5D7092'] },
          animation: false,
        }),
      }),
    },
    registerAll: vi.fn(),
    registerLightTheme: vi.fn(),
    registerDarkTheme: vi.fn(),
    lightTheme: () => ({ config: {} }),
    darkTheme: () => ({ config: {} }),
    createTokenThemeConfig: (opts: unknown) => opts,
  };
});
