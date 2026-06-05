import { useCallback, useEffect, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { ReportTemplate } from '@report-designer/core';
import type { DesignerLocale } from '../../i18n/messages';
import type { ExpressionCatalogExtensions } from '../../expression/expression-catalog';
import { validateReportExpression, type ExpressionDiagnostic } from '../../expression/expression-validation';
import {
  buildExpressionCompletions,
  getExpressionModelPath,
  registerReportExpressionLanguage,
  REPORT_EXPRESSION_LANGUAGE_ID,
  type MonacoCompletionConstants,
} from './expression-monaco';

export interface ExpressionMonacoEditorProps {
  ariaLabel: string;
  value: string;
  template: ReportTemplate;
  locale: DesignerLocale;
  expressionExtensions?: ExpressionCatalogExtensions;
  height?: number | string;
  onChange: (value: string) => void;
  onDiagnostics: (diagnostics: ExpressionDiagnostic[]) => void;
}

interface Disposable {
  dispose: () => void;
}

interface MonacoEditorLike {
  getModel?: () => unknown;
}

interface MonacoLike extends MonacoCompletionConstants {
  editor?: {
    setModelMarkers?: (model: unknown, owner: string, markers: ExpressionDiagnostic[]) => void;
  };
  languages?: MonacoCompletionConstants['languages'] & {
    registerCompletionItemProvider?: (
      language: string,
      provider: { provideCompletionItems: () => { suggestions: ReturnType<typeof buildExpressionCompletions> } },
    ) => Disposable;
  };
}

export function ExpressionMonacoEditor({
  ariaLabel,
  value,
  template,
  locale,
  expressionExtensions,
  height = 260,
  onChange,
  onDiagnostics,
}: ExpressionMonacoEditorProps) {
  const monacoRef = useRef<MonacoLike | undefined>(undefined);
  const editorRef = useRef<MonacoEditorLike | undefined>(undefined);
  const completionDisposableRef = useRef<Disposable | undefined>(undefined);
  const completionInput = useMemo(() => ({ template, locale, expressionExtensions }), [expressionExtensions, locale, template]);
  const latestCompletionInputRef = useRef(completionInput);

  useEffect(() => {
    latestCompletionInputRef.current = completionInput;
  }, [completionInput]);

  const disposeCompletionProvider = useCallback(() => {
    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = undefined;
  }, []);

  const updateDiagnostics = useCallback(
    (nextValue: string) => {
      const diagnostics = validateReportExpression(nextValue, template, expressionExtensions);
      onDiagnostics(diagnostics);
      monacoRef.current?.editor?.setModelMarkers?.(
        editorRef.current?.getModel?.(),
        REPORT_EXPRESSION_LANGUAGE_ID,
        diagnostics,
      );
    },
    [expressionExtensions, onDiagnostics, template],
  );

  useEffect(() => {
    updateDiagnostics(value);
  }, [updateDiagnostics, value]);

  useEffect(
    () => () => {
      disposeCompletionProvider();
    },
    [disposeCompletionProvider],
  );

  const beforeMount = useCallback((monaco: MonacoLike) => {
    registerReportExpressionLanguage(monaco);
  }, []);

  const onMount = useCallback(
    (editor: MonacoEditorLike, monaco: MonacoLike) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      updateDiagnostics(value);
      disposeCompletionProvider();

      const registerCompletionItemProvider = monaco.languages?.registerCompletionItemProvider;
      if (!registerCompletionItemProvider) {
        return;
      }

      completionDisposableRef.current = registerCompletionItemProvider(REPORT_EXPRESSION_LANGUAGE_ID, {
        provideCompletionItems: () => ({
          suggestions: buildExpressionCompletions(
            latestCompletionInputRef.current.template,
            latestCompletionInputRef.current.locale,
            (monaco.languages ?? monaco) as MonacoCompletionConstants,
            latestCompletionInputRef.current.expressionExtensions,
          ),
        }),
      });
    },
    [disposeCompletionProvider, updateDiagnostics, value],
  );

  return (
    <Editor
      aria-label={ariaLabel}
      value={value}
      language={REPORT_EXPRESSION_LANGUAGE_ID}
      path={getExpressionModelPath()}
      height={height}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'off',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
        suggestOnTriggerCharacters: true,
      }}
      beforeMount={beforeMount}
      onMount={onMount}
      onChange={(nextValue) => {
        const text = nextValue ?? '';
        onChange(text);
        updateDiagnostics(text);
      }}
    />
  );
}
