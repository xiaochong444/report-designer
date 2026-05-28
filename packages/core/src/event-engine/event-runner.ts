import { createEventLogCollector } from './event-log';
import type {
  EventLogCollector,
  EventLogEntry,
  EventRuntimeState,
  EventScriptValidationResult,
  EventTargetState,
  RunEventScriptOptions,
} from './types';

const maxScriptLength = 8 * 1024;
const blockedTokens = [
  'window',
  'document',
  'globalThis',
  'Function',
  'eval',
  'XMLHttpRequest',
  'fetch',
  'localStorage',
  'sessionStorage',
  'import',
  'require',
  'constructor',
  'prototype',
  '__proto__',
] as const;

const shadowedGlobals = [
  'window',
  'document',
  'globalThis',
  'Function',
  'eval',
  'XMLHttpRequest',
  'fetch',
  'localStorage',
  'sessionStorage',
  'require',
] as const;

export function createEventRuntimeState(options: { maxEventCount?: number } = {}): EventRuntimeState {
  return {
    eventCount: 0,
    maxEventCount: options.maxEventCount ?? 1000,
  };
}

export function validateEventScript(script: string): EventScriptValidationResult {
  const errors: string[] = [];
  const scanned = maskNonCodeSegments(script);

  if (new TextEncoder().encode(script).length > maxScriptLength) {
    errors.push(`Script length exceeds ${maxScriptLength} bytes.`);
  }

  for (const token of blockedTokens) {
    const tokenPattern = new RegExp(`\\b${escapeRegExp(token)}\\b`);
    if (tokenPattern.test(scanned.code) || scanned.bracketPropertyTokens.has(token)) {
      errors.push(`Script contains blocked token: ${token}.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function runEventScript(options: RunEventScriptOptions): void {
  const { event, ctx, target } = options;
  const eventLogs = options.eventLogs ?? ctx.log ?? createEventLogCollector(target);
  const runtimeState = options.runtimeState ?? ctx.runtime ?? createEventRuntimeState({ maxEventCount: options.maxEventCount });

  if (!event?.enabled || event.script.trim() === '') {
    return;
  }

  if (runtimeState.eventCount >= runtimeState.maxEventCount) {
    writeError(eventLogs, target, `Event execution stopped because maxEventCount ${runtimeState.maxEventCount} was exceeded.`);
    return;
  }

  const validation = validateEventScript(event.script);
  if (!validation.valid) {
    for (const error of validation.errors) {
      writeError(eventLogs, target, error);
    }
    return;
  }

  runtimeState.eventCount += 1;
  ctx.runtime = runtimeState;

  const originalLog = ctx.log;
  ctx.log = createScopedLogCollector(eventLogs, target);

  try {
    const fn = new Function('ctx', buildWrapper(event.script));
    fn(ctx);
  } catch (error) {
    writeError(eventLogs, target, toErrorMessage(error), extractScriptErrorLocation(error));
  } finally {
    ctx.log = originalLog;
  }
}

function buildWrapper(script: string): string {
  const shadowDeclarations = shadowedGlobals.map((name) => `const ${name} = undefined;`).join('\n');

  return `${shadowDeclarations}
return (function () {
"use strict";
${script}
}).call(undefined);`;
}

function writeError(
  log: { error(message: string, target?: Partial<EventLogEntry>): void },
  target: EventTargetState,
  message: string,
  diagnostics: Partial<Pick<EventLogEntry, 'line' | 'column' | 'stackExcerpt'>> = {},
): void {
  log.error(message, { ...target, ...diagnostics });
}

function createScopedLogCollector(log: EventLogCollector, target: EventTargetState): EventLogCollector {
  return {
    entries: log.entries,
    info(message, nextTarget) {
      log.info(message, { ...target, ...nextTarget });
    },
    warning(message, nextTarget) {
      log.warning(message, { ...target, ...nextTarget });
    },
    error(message, nextTarget) {
      log.error(message, { ...target, ...nextTarget });
    },
    push(entry) {
      log.push({
        ...target,
        ...entry,
      });
    },
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function extractScriptErrorLocation(error: unknown): Partial<Pick<EventLogEntry, 'line' | 'column' | 'stackExcerpt'>> {
  if (!(error instanceof Error) || !error.stack) {
    return {};
  }

  const stackLines = error.stack.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const anonymousFrame = stackLines.find(line => /<anonymous>:\d+:\d+/.test(line));
  const match = anonymousFrame?.match(/<anonymous>:(\d+):(\d+)/);
  const wrapperLineOffset = shadowedGlobals.length + 4;
  const line = match ? Number(match[1]) - wrapperLineOffset : undefined;
  const column = match ? Number(match[2]) : undefined;
  const normalizedLine = line && line > 0 ? line : undefined;

  return {
    line: normalizedLine,
    column: column && column > 0 ? column : undefined,
    stackExcerpt: stackLines.slice(0, 4).join('\n'),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskNonCodeSegments(script: string): { code: string; bracketPropertyTokens: Set<string> } {
  const chars = script.split('');
  const bracketPropertyTokens = new Set<string>();

  const maskRange = (start: number, end: number) => {
    for (let index = start; index < end; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  };

  const previousCodeChar = (index: number): string | undefined => {
    for (let cursor = index; cursor >= 0; cursor -= 1) {
      const char = chars[cursor];
      if (char && !/\s/.test(char)) return char;
    }
    return undefined;
  };

  const nextSourceChar = (index: number): string | undefined => {
    for (let cursor = index; cursor < script.length; cursor += 1) {
      const char = script[cursor];
      if (char && !/\s/.test(char)) return char;
    }
    return undefined;
  };

  const readQuotedLiteral = (start: number, quote: string): number => {
    let cursor = start + 1;
    let raw = '';
    while (cursor < script.length) {
      const char = script[cursor];
      if (char === '\\') {
        raw += script[cursor + 1] ?? '';
        cursor += 2;
        continue;
      }
      if (char === quote) {
        const previous = previousCodeChar(start - 1);
        const next = nextSourceChar(cursor + 1);
        if (previous === '[' && next === ']' && blockedTokens.includes(raw as (typeof blockedTokens)[number])) {
          bracketPropertyTokens.add(raw);
        }
        maskRange(start, cursor + 1);
        return cursor + 1;
      }
      raw += char;
      cursor += 1;
    }
    maskRange(start, cursor);
    return cursor;
  };

  const readTemplate = (start: number): number => {
    maskRange(start, start + 1);
    let cursor = start + 1;
    while (cursor < script.length) {
      const char = script[cursor];
      const next = script[cursor + 1];
      if (char === '\\') {
        maskRange(cursor, Math.min(cursor + 2, script.length));
        cursor += 2;
        continue;
      }
      if (char === '`') {
        maskRange(cursor, cursor + 1);
        return cursor + 1;
      }
      if (char === '$' && next === '{') {
        maskRange(cursor, cursor + 2);
        cursor = scanCode(cursor + 2, 1);
        continue;
      }
      maskRange(cursor, cursor + 1);
      cursor += 1;
    }
    return cursor;
  };

  const scanCode = (start: number, braceDepth = 0): number => {
    let cursor = start;
    let depth = braceDepth;
    while (cursor < script.length) {
      const char = script[cursor];
      const next = script[cursor + 1];
      if (char === '/' && next === '/') {
        const end = script.indexOf('\n', cursor + 2);
        const commentEnd = end === -1 ? script.length : end;
        maskRange(cursor, commentEnd);
        cursor = commentEnd;
        continue;
      }
      if (char === '/' && next === '*') {
        const end = script.indexOf('*/', cursor + 2);
        const commentEnd = end === -1 ? script.length : end + 2;
        maskRange(cursor, commentEnd);
        cursor = commentEnd;
        continue;
      }
      if (char === '"' || char === "'") {
        cursor = readQuotedLiteral(cursor, char);
        continue;
      }
      if (char === '`') {
        cursor = readTemplate(cursor);
        continue;
      }
      if (depth > 0 && char === '{') {
        depth += 1;
      } else if (depth > 0 && char === '}') {
        depth -= 1;
        if (depth === 0) {
          maskRange(cursor, cursor + 1);
          return cursor + 1;
        }
      }
      cursor += 1;
    }
    return cursor;
  };

  scanCode(0);

  return { code: chars.join(''), bracketPropertyTokens };
}
