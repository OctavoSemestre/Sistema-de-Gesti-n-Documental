/**
 * Observer Pattern / Event Bus Implementation for Loose Coupling
 */

export const SystemEvents = Object.freeze({
    AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
    RECORD_CREATED: 'RECORD_CREATED',
    RECORD_UPDATED: 'RECORD_UPDATED',
    RECORD_DELETED: 'RECORD_DELETED',
    DOCUMENT_ATTACHED: 'DOCUMENT_ATTACHED',
    DOCUMENT_DELETED: 'DOCUMENT_DELETED',
    UI_NOTIFICATION: 'UI_NOTIFICATION'
});

export class EventBus {
    constructor() {
        this._listeners = new Map();
    }

    subscribe(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);

        // Return unsubscribe handle
        return () => this.unsubscribe(event, callback);
    }

    unsubscribe(event, callback) {
        if (this._listeners.has(event)) {
            this._listeners.get(event).delete(callback);
        }
    }

    publish(event, payload = null) {
        if (this._listeners.has(event)) {
            this._listeners.get(event).forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`[EventBus] Error dispatching event '${event}':`, error);
                }
            });
        }
    }
}

// Global Singleton Instance
export const globalEventBus = new EventBus();
