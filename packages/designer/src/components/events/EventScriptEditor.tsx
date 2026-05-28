import { useCallback, useEffect, useMemo, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { EventEditorDataContractInput, EventEditorTargetType } from '@report-designer/core';
import {
  buildEventEditorExtraLib,
  buildEventScriptCompletions,
  getEventScriptModelPath,
  splitDiagnostics,
  type EventCompletionTextItem,
  type EventCompletionTreeItem,
  type MonacoCompletionConstants,
  type MonacoDiagnostic,
} from './event-script-monaco';

export interface EventScriptEditorDiagnostics {
  blocking: string[];
  warnings: string[];
}

export interface EventScriptEditorProps {
  ariaLabel: string;
  value: string;
  targetType: EventEditorTargetType;
  eventName: string;
  helperItems?: EventCompletionTextItem[];
  dataContext?: EventEditorDataContractInput;
  dictionaryItems?: EventCompletionTreeItem[];
  componentItems?: EventCompletionTreeItem[];
  exampleItems?: EventCompletionTextItem[];
  initialCursor?: { line?: number; column?: number };
  loadingText?: string;
  diagnosticLineLabel?: string;
  onChange: (value: string) => void;
  onDiagnostics?: (diagnostics: EventScriptEditorDiagnostics) => void;
}

interface Disposable {
  dispose: () => void;
}

interface MonacoLike {
  languages?: {
    typescript?: {
      ScriptTarget?: {
        ES2020?: unknown;
      };
      javascriptDefaults?: {
        setCompilerOptions: (options: Record<string, unknown>) => void;
        addExtraLib: (content: string, filePath?: string) => Disposable;
      };
    };
    registerCompletionItemProvider?: (
      language: string,
      provider: { provideCompletionItems: () => { suggestions: ReturnType<typeof buildEventScriptCompletions> } },
    ) => Disposable;
  };
}

interface MonacoEditorLike {
  setPosition?: (position: { lineNumber: number; column: number }) => void;
  revealLineInCenter?: (lineNumber: number) => void;
  focus?: () => void;
}

const EVENT_API_EXTRA_LIB_PATH = 'inmemory://event-scripts/event-api.d.ts';
const FALLBACK_SCRIPT_TARGET_ES2020 = 7;

export function EventScriptEditor({
  ariaLabel,
  value,
  targetType,
  eventName,
  helperItems,
  dataContext,
  dictionaryItems,
  componentItems,
  exampleItems,
  initialCursor,
  loadingText,
  diagnosticLineLabel,
  onChange,
  onDiagnostics,
}: EventScriptEditorProps) {
  const monacoRef = useRef<MonacoLike | undefined>(undefined);
  const editorRef = useRef<MonacoEditorLike | undefined>(undefined);
  const extraLibDisposableRef = useRef<Disposable | undefined>(undefined);
  const completionDisposableRef = useRef<Disposable | undefined>(undefined);

  const disposeCompletionProvider = useCallback(() => {
    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = undefined;
  }, []);

  const disposeEventApiExtraLib = useCallback(() => {
    extraLibDisposableRef.current?.dispose();
    extraLibDisposableRef.current = undefined;
  }, []);

  const completionInput = useMemo(
    () => ({
      helperItems,
      dataContext,
      dictionaryItems,
      componentItems,
      exampleItems,
    }),
    [componentItems, dataContext, dictionaryItems, exampleItems, helperItems],
  );
  const latestCompletionInputRef = useRef(completionInput);

  useEffect(() => {
    latestCompletionInputRef.current = completionInput;
  }, [completionInput]);

  const focusInitialCursor = useCallback(() => {
    const line = initialCursor?.line;
    if (!line || line < 1) {
      return;
    }

    const column = initialCursor?.column && initialCursor.column > 0 ? initialCursor.column : 1;
    editorRef.current?.setPosition?.({ lineNumber: line, column });
    editorRef.current?.revealLineInCenter?.(line);
    editorRef.current?.focus?.();
  }, [initialCursor?.column, initialCursor?.line]);

  useEffect(() => {
    focusInitialCursor();
  }, [focusInitialCursor]);

  const registerEventApiExtraLib = useCallback(
    (monaco: MonacoLike) => {
      const javascriptDefaults = monaco.languages?.typescript?.javascriptDefaults;
      if (!javascriptDefaults) {
        return;
      }

      disposeEventApiExtraLib();
      extraLibDisposableRef.current = javascriptDefaults.addExtraLib(
        buildEventEditorExtraLib(targetType, eventName, dataContext),
        EVENT_API_EXTRA_LIB_PATH,
      );
    },
    [dataContext, disposeEventApiExtraLib, eventName, targetType],
  );

  useEffect(() => {
    if (monacoRef.current) {
      registerEventApiExtraLib(monacoRef.current);
    }
  }, [registerEventApiExtraLib]);

  useEffect(
    () => () => {
      disposeCompletionProvider();
      disposeEventApiExtraLib();
    },
    [disposeCompletionProvider, disposeEventApiExtraLib],
  );

  const beforeMount = useCallback(
    (monaco: MonacoLike) => {
      const javascriptDefaults = monaco.languages?.typescript?.javascriptDefaults;
      if (!javascriptDefaults) {
        return;
      }

      javascriptDefaults.setCompilerOptions({
        allowNonTsExtensions: true,
        checkJs: true,
        noEmit: true,
        target: monaco.languages?.typescript?.ScriptTarget?.ES2020 ?? FALLBACK_SCRIPT_TARGET_ES2020,
      });
    },
    [],
  );

  const onMount = useCallback(
    (editor: MonacoEditorLike, monaco: MonacoLike) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      registerEventApiExtraLib(monaco);
      focusInitialCursor();
      disposeCompletionProvider();

      const registerCompletionItemProvider = monaco.languages?.registerCompletionItemProvider;
      if (!registerCompletionItemProvider) {
        return;
      }

      completionDisposableRef.current = registerCompletionItemProvider('javascript', {
        provideCompletionItems: () => ({
          suggestions: buildEventScriptCompletions(
            latestCompletionInputRef.current,
            (monaco.languages ?? monaco) as MonacoCompletionConstants,
          ),
        }),
      });
    },
    [disposeCompletionProvider, registerEventApiExtraLib],
  );

  const onValidate = useCallback(
    (markers: MonacoDiagnostic[]) => {
      onDiagnostics?.(splitDiagnostics(markers, diagnosticLineLabel));
    },
    [diagnosticLineLabel, onDiagnostics],
  );

  return (
    <Editor
      aria-label={ariaLabel}
      value={value}
      language="javascript"
      path={getEventScriptModelPath(targetType, eventName)}
      height="420px"
      loading={loadingText}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
      }}
      beforeMount={beforeMount}
      onMount={onMount}
      onChange={(nextValue) => onChange(nextValue ?? '')}
      onValidate={onValidate}
    />
  );
}
