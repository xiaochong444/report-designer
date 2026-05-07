import React, { createContext, useContext, useMemo } from 'react';
import { designerMessages, type DesignerLocale, type DesignerMessageKey } from './messages';

interface DesignerI18nContextValue {
  locale: DesignerLocale;
  t: (key: DesignerMessageKey, values?: Record<string, string | number>) => string;
}

const DesignerI18nContext = createContext<DesignerI18nContextValue | null>(null);

function interpolate(message: string, values?: Record<string, string | number>) {
  if (!values) {
    return message;
  }
  return message.replace(/\{(\w+)\}/g, (match, key) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

export const DesignerI18nProvider: React.FC<React.PropsWithChildren<{
  locale?: DesignerLocale;
}>> = ({ children, locale = 'zh-CN' }) => {
  const value = useMemo<DesignerI18nContextValue>(() => {
    const messages = designerMessages[locale] ?? designerMessages['zh-CN'];
    return {
      locale,
      t: (key, values) => interpolate(messages[key] ?? designerMessages['en-US'][key] ?? key, values),
    };
  }, [locale]);

  return (
    <DesignerI18nContext.Provider value={value}>
      {children}
    </DesignerI18nContext.Provider>
  );
};

export function useDesignerI18n() {
  const context = useContext(DesignerI18nContext);
  if (!context) {
    const messages = designerMessages['zh-CN'];
    return {
      locale: 'zh-CN' as DesignerLocale,
      t: (key: DesignerMessageKey, values?: Record<string, string | number>) => interpolate(messages[key] ?? key, values),
    };
  }
  return context;
}

export type { DesignerLocale, DesignerMessageKey };
