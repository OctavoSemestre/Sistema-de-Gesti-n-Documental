import { RoleStrategyResolver } from './roles.js';

export class DocumentFile {
    /**
     * @param {Object} params
     * @param {string} [params.id]
     * @param {string} params.name
     * @param {string} [params.mimeType]
     * @param {number} [params.sizeBytes]
     * @param {string|Date} [params.uploadDate]
     * @param {string} [params.storageUrl]
     */
    constructor({ id, name, mimeType, sizeBytes, uploadDate, storageUrl }) {
        this.id = id || `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        this.name = name;
        this.mimeType = mimeType || 'application/pdf';
        this.sizeBytes = sizeBytes || 0;
        this.uploadDate = uploadDate ? new Date(uploadDate) : new Date();
        this.storageUrl = storageUrl || '';
    }

    get formattedDate() {
        return this.uploadDate.toISOString().split('T')[0];
    }

    get formattedSize() {
        if (this.sizeBytes === 0) return 'N/A';
        const kb = (this.sizeBytes / 1024).toFixed(1);
        return `${kb} KB`;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            mimeType: this.mimeType,
            sizeBytes: this.sizeBytes,
            uploadDate: this.uploadDate.toISOString(),
            storageUrl: this.storageUrl
        };
    }

    /**
     * @param {Object} data
     * @returns {DocumentFile}
     */
    static fromJSON(data) {
        return new DocumentFile(data);
    }
}

export class RecordArchive {
    /**
     * @param {Object} params
     * @param {string} params.code
     * @param {string} params.series
     * @param {string} params.subseries
     * @param {string} [params.location]
     * @param {string|Date} params.startDate
     * @param {string|Date|null} [params.endDate]
     * @param {string} [params.observations]
     * @param {Array<DocumentFile|Object>} [params.documents]
     */
    constructor({ code, series, subseries, location, startDate, endDate, observations, documents = [] }) {
        this.code = code?.trim();
        this.series = series?.trim();
        this.subseries = subseries?.trim();
        this.location = location?.trim() || 'Archivo de Gestión';
        this.startDate = startDate ? new Date(startDate) : new Date();
        this.endDate = endDate ? new Date(endDate) : null;
        this.observations = observations?.trim() || '';
        this.documents = documents.map(doc => doc instanceof DocumentFile ? doc : DocumentFile.fromJSON(doc));
    }

    /**
     * Validates domain invariants and retention schedule temporal consistency.
     * @throws {Error} If mandatory fields are missing or temporal sequence is invalid.
     */
    validate() {
        if (!this.code) throw new Error('Record code is mandatory.');
        if (!this.series) throw new Error('Record series is mandatory.');
        if (!this.subseries) throw new Error('Record subseries is mandatory.');
        if (isNaN(this.startDate.getTime())) throw new Error('Valid start date is mandatory.');
        if (this.endDate && this.endDate < this.startDate) {
            throw new Error('End date cannot precede start date.');
        }
    }

    /**
     * @param {DocumentFile} document
     */
    addDocument(document) {
        if (!(document instanceof DocumentFile)) {
            throw new Error('Invalid document instance.');
        }
        this.documents.push(document);
    }

    /**
     * @param {string} documentId
     */
    removeDocument(documentId) {
        this.documents = this.documents.filter(doc => doc.id !== documentId);
    }

    /**
     * @param {string} documentId
     * @returns {DocumentFile|undefined}
     */
    getDocument(documentId) {
        return this.documents.find(doc => doc.id === documentId);
    }

    get formattedStartDate() {
        return this.startDate.toISOString().split('T')[0];
    }

    get formattedEndDate() {
        return this.endDate ? this.endDate.toISOString().split('T')[0] : '';
    }

    toJSON() {
        return {
            code: this.code,
            series: this.series,
            subseries: this.subseries,
            location: this.location,
            startDate: this.startDate.toISOString(),
            endDate: this.endDate ? this.endDate.toISOString() : null,
            observations: this.observations,
            documents: this.documents.map(d => d.toJSON())
        };
    }

    /**
     * @param {Object} data
     * @returns {RecordArchive}
     */
    static fromJSON(data) {
        return new RecordArchive(data);
    }
}

export class User {
    /**
     * @param {Object} params
     * @param {string} [params.id]
     * @param {string} params.email
     * @param {string} params.role
     * @param {string} [params.name]
     */
    constructor({ id, email, role, name }) {
        this.id = id || `USR-${Date.now()}`;
        this.email = email;
        this.role = role;
        this.name = name || email.split('@')[0];
        this._strategy = RoleStrategyResolver.getStrategy(this.role);
    }

    /**
     * Checks permission via Strategy pattern.
     * @param {string} permission
     * @returns {boolean}
     */
    can(permission) {
        return this._strategy.hasPermission(permission);
    }

    toJSON() {
        return {
            id: this.id,
            email: this.email,
            role: this.role,
            name: this.name
        };
    }
}

export class RecordFactory {
    /**
     * Factory method creating and validating a RecordArchive aggregate root.
     * @param {Object} dto - Raw record data transfer object.
     * @returns {RecordArchive} Validated domain entity.
     */
    static createRecord(dto) {
        const record = new RecordArchive(dto);
        record.validate();
        return record;
    }

    /**
     * Factory method constructing a validated DocumentFile entity.
     * @param {Object} params
     * @param {string} params.name
     * @param {string} [params.mimeType]
     * @param {number} [params.sizeBytes]
     * @param {string} [params.storageUrl]
     * @returns {DocumentFile}
     */
    static createDocument({ name, mimeType, sizeBytes, storageUrl }) {
        if (!name) throw new Error('File name is mandatory.');
        return new DocumentFile({ name, mimeType, sizeBytes, storageUrl });
    }
}
