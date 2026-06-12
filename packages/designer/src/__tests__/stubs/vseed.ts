export const Builder = {
  from: () => ({
    build: () => ({
      type: 'bar',
      data: [{ id: 'mock', values: [] }],
      color: { range: ['#5B8FF9', '#5AD8A6', '#5D7092'] },
      animation: false,
    }),
  }),
};

export const registerAll = () => undefined;
export const registerLightTheme = () => undefined;
export const registerDarkTheme = () => undefined;
export const registerTokenTheme = () => undefined;
export const lightTheme = () => ({ config: {} });
export const darkTheme = () => ({ config: {} });
export const createTokenThemeConfig = (opts: unknown) => opts;
