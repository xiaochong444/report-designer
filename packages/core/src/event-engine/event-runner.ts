import { createEventLogCollector } from './event-log';
import type {
  EventLogCollector,
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

  if (new TextEncoder().encode(script).length > maxScriptLength) {
    errors.push(`Script length exceeds ${maxScriptLength} bytes.`);
  }

  for (const token of blockedTokens) {
    const tokenPattern = new RegExp(`\\b${escapeRegExp(token)}\\b`);
    if (tokenPattern.test(script)) {
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
    writeError(eventLogs, target, toErrorMessage(error));
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

function writeError(log: { error(message: string, target?: Partial<EventTargetState>): void }, target: EventTargetState, message: string): void {
  log.error(message, target);
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
