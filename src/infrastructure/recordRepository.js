import { RecordArchive, DocumentFile } from '../domain/models.js';

const STORAGE_KEY = 'samana_expedientes_db_v1';

export class IRecordRepository {
    async getAll() { throw new Error('Not implemented'); }
    async getByCode(code) { throw new Error('Not implemented'); }
    async save(record) { throw new Error('Not implemented'); }
    async delete(code) { throw new Error('Not implemented'); }
}

export class LocalStorageRecordRepository extends IRecordRepository {
    constructor() {
        super();
        this._cache = new Map();
        this._isInitialized = false;
    }

    /**
     * Initializes repository using Cache-Aside strategy, seeding baseline data on first launch.
     * @private
     */
    async _ensureInitialized() {
        if (this._isInitialized) return;

        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            this._seedInitialData();
            this._isInitialized = true;
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            this._cache.clear();
            parsed.forEach(item => {
                const record = RecordArchive.fromJSON(item);
                this._cache.set(record.code, record);
            });
        } catch (err) {
            console.error('[Repository] Failed to parse local storage, re-seeding.', err);
            this._seedInitialData();
        }

        this._isInitialized = true;
    }

    /**
     * @private
     */
    _seedInitialData() {
        this._cache.clear();

        const rec1 = new RecordArchive({
            code: 'EXP-2026-001',
            series: 'Contratación',
            subseries: 'Licitaciones Públicas',
            location: 'Archivo de Gestión',
            startDate: '2026-01-15',
            endDate: '2026-12-31',
            observations: 'Proceso licitatorio para infraestructura vial del municipio.',
            documents: [
                new DocumentFile({
                    id: 'DOC-001',
                    name: 'Pliego_de_Condiciones.pdf',
                    mimeType: 'application/pdf',
                    sizeBytes: 1542000,
                    uploadDate: '2026-08-20',
                    storageUrl: 's3://samana-document-vault-prod/documents/Pliego_de_Condiciones.pdf'
                })
            ]
        });

        const rec2 = new RecordArchive({
            code: 'EXP-2026-002',
            series: 'Talento Humano',
            subseries: 'Hojas de Vida',
            location: 'Archivo Central',
            startDate: '2026-02-01',
            endDate: null,
            observations: 'Expediente laboral de funcionarios de planta.',
            documents: []
        });

        this._cache.set(rec1.code, rec1);
        this._cache.set(rec2.code, rec2);
        this._persist();
    }

    /**
     * @private
     */
    _persist() {
        const recordsArray = Array.from(this._cache.values()).map(r => r.toJSON());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recordsArray));
    }

    /**
     * @returns {Promise<RecordArchive[]>}
     */
    async getAll() {
        await this._ensureInitialized();
        return Array.from(this._cache.values());
    }

    /**
     * @param {string} code
     * @returns {Promise<RecordArchive|null>}
     */
    async getByCode(code) {
        await this._ensureInitialized();
        return this._cache.get(code) || null;
    }

    /**
     * @param {RecordArchive} record
     * @returns {Promise<RecordArchive>}
     */
    async save(record) {
        await this._ensureInitialized();
        if (!(record instanceof RecordArchive)) {
            throw new Error('Entity must be an instance of RecordArchive.');
        }
        record.validate();
        this._cache.set(record.code, record);
        this._persist();
        return record;
    }

    /**
     * @param {string} code
     * @returns {Promise<void>}
     */
    async delete(code) {
        await this._ensureInitialized();
        if (!this._cache.has(code)) {
            throw new Error(`Record with code '${code}' not found.`);
        }
        this._cache.delete(code);
        this._persist();
    }
}
