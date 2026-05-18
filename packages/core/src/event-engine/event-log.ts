import type { EventLogCollector, EventLogEntry, EventLogLevel, EventTargetState } from './types';

const emptyTarget: EventTargetState = {
  ownerType: 'report',
  ownerId: '',
  eventName: '',
};

export function createEventLogCollector(defaultTarget: Partial<EventTargetState> = {}): EventLogCollector {
  const entries: EventLogEntry[] = [];

  const write = (level: EventLogLevel, message: string, target: Partial<EventTargetState> = {}) => {
    entries.push({
      ...emptyTarget,
      ...defaultTarget,
      ...target,
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  };

  return {
    entries,
    info(message, target) {
      write('info', message, target);
    },
    warning(message, target) {
      write('warning', message, target);
    },
    error(message, target) {
      write('error', message, target);
    },
    push(entry) {
      entries.push({
        timestamp: new Date().toISOString(),
        ...entry,
      });
    },
  };
}
