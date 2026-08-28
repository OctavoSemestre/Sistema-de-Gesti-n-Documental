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

    /**
     * Subscribes a callback to an event topic and returns a disposal function.
     * @param {string} event - Topic identifier from SystemEvents.
     * @param {Function} callback - Event handler function.
     * @returns {Function} Unsubscribe handler.
     */
    subscribe(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);

        return () => this.unsubscribe(event, callback);
    }

    /**
     * @param {string} event
     * @param {Function} callback
     */
    unsubscribe(event, callback) {
        if (this._listeners.has(event)) {
            this._listeners.get(event).delete(callback);
        }
    }

    /**
     * Publishes a payload to all registered listeners of a topic.
     * @param {string} event - Topic identifier.
     * @param {*} [payload] - Data dispatched to listeners.
     */
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

export const globalEventBus = new EventBus();
