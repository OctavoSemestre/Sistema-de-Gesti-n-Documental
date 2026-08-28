/**
 * Domain Models, Aggregates, and Factories
 */
import { RoleStrategyResolver } from './roles.js';

export class DocumentFile {
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

    static fromJSON(data) {
        return new DocumentFile(data);
    }
}

export class RecordArchive {
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

    validate() {
        if (!this.code) throw new Error('Record code is mandatory.');
        if (!this.series) throw new Error('Record series is mandatory.');
        if (!this.subseries) throw new Error('Record subseries is mandatory.');
        if (isNaN(this.startDate.getTime())) throw new Error('Valid start date is mandatory.');
        if (this.endDate && this.endDate < this.startDate) {
            throw new Error('End date cannot precede start date.');
        }
    }

    addDocument(document) {
        if (!(document instanceof DocumentFile)) {
            throw new Error('Invalid document instance.');
        }
        this.documents.push(document);
    }

    removeDocument(documentId) {
        this.documents = this.documents.filter(doc => doc.id !== documentId);
    }

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

    static fromJSON(data) {
        return new RecordArchive(data);
    }
}

export class User {
    constructor({ id, email, role, name }) {
        this.id = id || `USR-${Date.now()}`;
        this.email = email;
        this.role = role;
        this.name = name || email.split('@')[0];
        this._strategy = RoleStrategyResolver.getStrategy(this.role);
    }

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

/**
 * Factory Method for domain instantiation
 */
export class RecordFactory {
    static createRecord(dto) {
        const record = new RecordArchive(dto);
        record.validate();
        return record;
    }

    static createDocument({ name, mimeType, sizeBytes, storageUrl }) {
        if (!name) throw new Error('File name is mandatory.');
        return new DocumentFile({ name, mimeType, sizeBytes, storageUrl });
    }
}
