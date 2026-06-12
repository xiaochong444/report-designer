export const Builder = {
  from: () => ({
    build: () => ({
      type: 'bar',
      data: [{ id: 'mock', values: [] }],
      animation: false,
    }),
  }),
};

export const registerAll = () => undefined;
export const registerLightTheme = () => undefined;
export const registerDarkTheme = () => undefined;
export const lightTheme = () => ({ config: {} });
export const darkTheme = () => ({ config: {} });
export const createTokenThemeConfig = (opts: unknown) => opts;
