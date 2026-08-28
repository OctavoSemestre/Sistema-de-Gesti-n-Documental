export const Role = Object.freeze({
    ADMINISTRATOR: 'Administrador',
    OFFICER: 'Funcionario',
    TECHNICIAN: 'Técnico'
});

export const Permission = Object.freeze({
    READ_RECORDS: 'READ_RECORDS',
    CREATE_RECORD: 'CREATE_RECORD',
    EDIT_RECORD: 'EDIT_RECORD',
    DELETE_RECORD: 'DELETE_RECORD',
    UPLOAD_DOCUMENT: 'UPLOAD_DOCUMENT',
    DOWNLOAD_DOCUMENT: 'DOWNLOAD_DOCUMENT',
    DELETE_DOCUMENT: 'DELETE_DOCUMENT',
    MANAGE_USERS: 'MANAGE_USERS'
});

export class RoleStrategy {
    /**
     * @returns {string[]}
     */
    getPermissions() {
        return [];
    }

    /**
     * @param {string} permission
     * @returns {boolean}
     */
    hasPermission(permission) {
        return this.getPermissions().includes(permission);
    }
}

export class AdministratorStrategy extends RoleStrategy {
    getPermissions() {
        return [
            Permission.READ_RECORDS,
            Permission.CREATE_RECORD,
            Permission.EDIT_RECORD,
            Permission.DELETE_RECORD,
            Permission.UPLOAD_DOCUMENT,
            Permission.DOWNLOAD_DOCUMENT,
            Permission.DELETE_DOCUMENT,
            Permission.MANAGE_USERS
        ];
    }
}

export class OfficerStrategy extends RoleStrategy {
    getPermissions() {
        return [
            Permission.READ_RECORDS,
            Permission.CREATE_RECORD,
            Permission.EDIT_RECORD,
            Permission.UPLOAD_DOCUMENT,
            Permission.DOWNLOAD_DOCUMENT
        ];
    }
}

export class TechnicianStrategy extends RoleStrategy {
    getPermissions() {
        return [
            Permission.READ_RECORDS,
            Permission.DOWNLOAD_DOCUMENT
        ];
    }
}

export class RoleStrategyResolver {
    /**
     * Resolves the concrete RBAC authorization strategy for a given user role.
     * @param {string} role - The role name to resolve.
     * @returns {RoleStrategy} Concrete role strategy instance.
     */
    static getStrategy(role) {
        switch (role) {
            case Role.ADMINISTRATOR:
                return new AdministratorStrategy();
            case Role.OFFICER:
                return new OfficerStrategy();
            case Role.TECHNICIAN:
                return new TechnicianStrategy();
            default:
                return new RoleStrategy();
        }
    }
}
