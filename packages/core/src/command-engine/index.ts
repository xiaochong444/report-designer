import type { ReportTemplate } from '../template-model/types';

/** A command that mutates the template state */
export interface Command {
  type: string;
  payload: Record<string, any>;
  /** Execute and return the new state */
  execute(state: ReportTemplate): ReportTemplate;
  /** Undo this command given the previous state */
  undo(state: ReportTemplate): ReportTemplate;
}

/** Command handler registry */
type CommandHandler = (state: ReportTemplate, payload: Record<string, any>) => ReportTemplate;
type UndoHandler = (state: ReportTemplate, payload: Record<string, any>) => ReportTemplate;

/** Whitelisted commands that are allowed to execute */
const allowedCommands = new Set<string>();

/** Register a command type with its execute and undo handlers */
export function registerCommand(
  type: string,
  execute: CommandHandler,
  undo: UndoHandler,
) {
  allowedCommands.add(type);
  commandHandlers[type] = execute;
  undoHandlers[type] = undo;
}

const commandHandlers: Record<string, CommandHandler> = {};
const undoHandlers: Record<string, UndoHandler> = {};

/** Command execution error */
export class CommandError extends Error {
  constructor(message: string, public commandType: string) {
    super(message);
  }
}

/**
 * CommandDispatcher with whitelist security.
 * Only registered commands can be executed.
 */
export class CommandDispatcher {
  private history: Command[] = [];
  private future: Command[] = [];
  private maxHistory = 100;

  /** Check if a command type is allowed */
  static isAllowed(type: string): boolean {
    return allowedCommands.has(type);
  }

  /** List all registered command types */
  static listCommands(): string[] {
    return Array.from(allowedCommands);
  }

  /** Execute a command */
  execute(state: ReportTemplate, command: Command): ReportTemplate {
    if (!CommandDispatcher.isAllowed(command.type)) {
      throw new CommandError(`Command '${command.type}' is not whitelisted`, command.type);
    }

    const handler = commandHandlers[command.type];
    if (!handler) {
      throw new CommandError(`No handler registered for '${command.type}'`, command.type);
    }

    // Execute the command
    const newState = handler(state, command.payload);

    // Record in history
    this.history.push(command);
    this.future = []; // Clear redo stack

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    return newState;
  }

  /** Undo the last command */
  undo(state: ReportTemplate): ReportTemplate | null {
    if (this.history.length === 0) return null;

    const command = this.history.pop()!;
    const handler = undoHandlers[command.type];
    if (!handler) {
      throw new CommandError(`No undo handler for '${command.type}'`, command.type);
    }

    const newState = handler(state, command.payload);
    this.future.push(command);
    return newState;
  }

  /** Redo the last undone command */
  redo(state: ReportTemplate): ReportTemplate | null {
    if (this.future.length === 0) return null;

    const command = this.future.pop()!;
    const handler = commandHandlers[command.type];
    if (!handler) {
      throw new CommandError(`No handler registered for '${command.type}'`, command.type);
    }

    const newState = handler(state, command.payload);
    this.history.push(command);
    return newState;
  }

  /** Check if undo is available */
  canUndo(): boolean {
    return this.history.length > 0;
  }

  /** Check if redo is available */
  canRedo(): boolean {
    return this.future.length > 0;
  }

  /** Get the current history size */
  get historySize(): number {
    return this.history.length;
  }

  /** Clear history */
  clear(): void {
    this.history = [];
    this.future = [];
  }
}

// ---- Built-in Command Handlers ----

/** Add a component to a band */
registerCommand(
  'add-component',
  (state, payload) => {
    const { pageId, bandId, component } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return { ...b, components: [...b.components, component] };
          }),
        };
      }),
    };
  },
  (state, payload) => {
    const { pageId, bandId, component } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return { ...b, components: b.components.filter(c => c.id !== component.id) };
          }),
        };
      }),
    };
  },
);

/** Remove a component from a band */
registerCommand(
  'remove-component',
  (state, payload) => {
    const { pageId, bandId, componentId } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return { ...b, components: b.components.filter(c => c.id !== componentId) };
          }),
        };
      }),
    };
  },
  (state, payload) => {
    // Undo of remove = re-add (but we need the component data)
    // The payload should include the removed component
    const { pageId, bandId, component } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return { ...b, components: [...b.components, component] };
          }),
        };
      }),
    };
  },
);

/** Update a component's properties */
registerCommand(
  'update-component',
  (state, payload) => {
    const { pageId, bandId, componentId, updates } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                if (c.id !== componentId) return c;
                return { ...c, ...updates };
              }),
            };
          }),
        };
      }),
    };
  },
  (state, payload) => {
    const { pageId, bandId, componentId, previous } = payload;
    if (!previous) return state;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                if (c.id !== componentId) return c;
                return { ...c, ...previous };
              }),
            };
          }),
        };
      }),
    };
  },
);

/** Update a band's height */
registerCommand(
  'resize-band',
  (state, payload) => {
    const { pageId, bandId, newHeight } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return { ...b, height: newHeight };
          }),
        };
      }),
    };
  },
  (state, payload) => {
    const { pageId, bandId, oldHeight } = payload;
    if (oldHeight === undefined) return state;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return { ...b, height: oldHeight };
          }),
        };
      }),
    };
  },
);

/** Move a component (update x, y) */
registerCommand(
  'move-component',
  (state, payload) => {
    const { pageId, bandId, componentId, x, y } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                if (c.id !== componentId) return c;
                return { ...c, x: x ?? c.x, y: y ?? c.y };
              }),
            };
          }),
        };
      }),
    };
  },
  (state, payload) => {
    const { pageId, bandId, componentId, prevX, prevY } = payload;
    if (prevX === undefined && prevY === undefined) return state;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                if (c.id !== componentId) return c;
                return { ...c, x: prevX ?? c.x, y: prevY ?? c.y };
              }),
            };
          }),
        };
      }),
    };
  },
);

/** Set template property */
registerCommand(
  'set-template',
  (state, payload) => {
    return { ...state, ...payload };
  },
  (state, payload) => {
    const { previous } = payload;
    if (!previous) return state;
    return { ...state, ...previous };
  },
);

/** Align multiple selected components */
registerCommand(
  'align-components',
  (state, payload) => {
    const { pageId, bandId, componentIds, alignment, updates, previous } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                const idx = componentIds.indexOf(c.id);
                if (idx < 0) return c;
                return { ...c, ...updates[idx] };
              }),
            };
          }),
        };
      }),
    };
  },
  (state, payload) => {
    const { pageId, bandId, componentIds, previous } = payload;
    if (!previous) return state;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                const idx = componentIds.indexOf(c.id);
                if (idx < 0) return c;
                return { ...c, ...previous[idx] };
              }),
            };
          }),
        };
      }),
    };
  },
);

/** Resize multiple selected components */
registerCommand(
  'size-components',
  (state, payload) => {
    const { pageId, bandId, componentIds, updates, previous } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                const idx = componentIds.indexOf(c.id);
                if (idx < 0) return c;
                return { ...c, ...updates[idx] };
              }),
            };
          }),
        };
      }),
    };
  },
  (state, payload) => {
    const { pageId, bandId, componentIds, previous } = payload;
    if (!previous) return state;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                const idx = componentIds.indexOf(c.id);
                if (idx < 0) return c;
                return { ...c, ...previous[idx] };
              }),
            };
          }),
        };
      }),
    };
  },
);

/** Bring component to front (z-order) */
registerCommand(
  'bring-to-front',
  (state, payload) => {
    const { pageId, bandId, componentId, zOrder } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                if (c.id !== componentId) return c;
                return { ...c, zOrder };
              }),
            };
          }),
        };
      }),
    };
  },
  (state, payload) => {
    const { pageId, bandId, componentId, previousZOrder } = payload;
    if (previousZOrder === undefined) return state;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                if (c.id !== componentId) return c;
                return { ...c, zOrder: previousZOrder };
              }),
            };
          }),
        };
      }),
    };
  },
);

/** Send component to back (z-order) */
registerCommand(
  'send-to-back',
  (state, payload) => {
    const { pageId, bandId, componentId, zOrder } = payload;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                if (c.id !== componentId) return c;
                return { ...c, zOrder };
              }),
            };
          }),
        };
      }),
    };
  },
  (state, payload) => {
    const { pageId, bandId, componentId, previousZOrder } = payload;
    if (previousZOrder === undefined) return state;
    return {
      ...state,
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          bands: p.bands.map(b => {
            if (b.id !== bandId) return b;
            return {
              ...b,
              components: b.components.map(c => {
                if (c.id !== componentId) return c;
                return { ...c, zOrder: previousZOrder };
              }),
            };
          }),
        };
      }),
    };
  },
);
