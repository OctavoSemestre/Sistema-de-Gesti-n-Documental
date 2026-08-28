/**
 * Authentication and RBAC Application Service
 */
import { User } from '../domain/models.js';
import { Role, Permission } from '../domain/roles.js';
import { globalEventBus, SystemEvents } from '../infrastructure/eventBus.js';

const SESSION_KEY = 'samana_active_session_v1';

export class AuthService {
    constructor() {
        this._currentUser = null;
        this._loadSession();
    }

    _loadSession() {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                this._currentUser = new User(data);
            } catch (e) {
                sessionStorage.removeItem(SESSION_KEY);
            }
        }
    }

    getCurrentUser() {
        return this._currentUser;
    }

    isAuthenticated() {
        return this._currentUser !== null;
    }

    login(email, password, role) {
        if (!email || !password) {
            throw new Error('Email and password are required.');
        }

        const user = new User({
            email: email.trim(),
            role: role || Role.OFFICER,
            name: email.split('@')[0]
        });

        this._currentUser = user;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user.toJSON()));
        globalEventBus.publish(SystemEvents.AUTH_STATE_CHANGED, this._currentUser);
        return this._currentUser;
    }

    logout() {
        this._currentUser = null;
        sessionStorage.removeItem(SESSION_KEY);
        globalEventBus.publish(SystemEvents.AUTH_STATE_CHANGED, null);
    }

    assertPermission(permission) {
        if (!this._currentUser) {
            throw new Error('Authentication required: No active session.');
        }
        if (!this._currentUser.can(permission)) {
            throw new Error(`Unauthorized: Role '${this._currentUser.role}' lacks '${permission}' permission.`);
        }
    }
}

export const authService = new AuthService();
