import { useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { EventEditorTargetType } from '@report-designer/core';
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
  dictionaryItems?: EventCompletionTreeItem[];
  componentItems?: EventCompletionTreeItem[];
  exampleItems?: EventCompletionTextItem[];
  loadingText?: string;
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
        addExtraLib: (content: string, filePath?: string) => void;
      };
    };
    registerCompletionItemProvider?: (
      language: string,
      provider: { provideCompletionItems: () => { suggestions: ReturnType<typeof buildEventScriptCompletions> } },
    ) => Disposable;
  };
}

const EVENT_API_EXTRA_LIB_PATH = 'inmemory://event-scripts/event-api.d.ts';
const FALLBACK_SCRIPT_TARGET_ES2020 = 7;

export function EventScriptEditor({
  ariaLabel,
  value,
  targetType,
  eventName,
  helperItems,
  dictionaryItems,
  componentItems,
  exampleItems,
  loadingText,
  onChange,
  onDiagnostics,
}: EventScriptEditorProps) {
  const completionDisposableRef = useRef<Disposable | undefined>(undefined);

  const disposeCompletionProvider = useCallback(() => {
    completionDisposableRef.current?.dispose();
    completionDisposableRef.current = undefined;
  }, []);

  useEffect(() => disposeCompletionProvider, [disposeCompletionProvider]);

  const completionInput = {
    helperItems,
    dictionaryItems,
    componentItems,
    exampleItems,
  };

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
      javascriptDefaults.addExtraLib(buildEventEditorExtraLib(targetType, eventName), EVENT_API_EXTRA_LIB_PATH);
    },
    [eventName, targetType],
  );

  const onMount = useCallback(
    (_editor: unknown, monaco: MonacoLike) => {
      disposeCompletionProvider();

      const registerCompletionItemProvider = monaco.languages?.registerCompletionItemProvider;
      if (!registerCompletionItemProvider) {
        return;
      }

      completionDisposableRef.current = registerCompletionItemProvider('javascript', {
        provideCompletionItems: () => ({
          suggestions: buildEventScriptCompletions(
            completionInput,
            (monaco.languages ?? monaco) as MonacoCompletionConstants,
          ),
        }),
      });
    },
    [completionInput, disposeCompletionProvider],
  );

  const onValidate = useCallback(
    (markers: MonacoDiagnostic[]) => {
      onDiagnostics?.(splitDiagnostics(markers));
    },
    [onDiagnostics],
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
