/**
 * Record and Document Management Application Service (Use Cases)
 */
import { RecordFactory } from '../domain/models.js';
import { Permission } from '../domain/roles.js';
import { LocalStorageRecordRepository } from '../infrastructure/recordRepository.js';
import { CloudStorageAdapter } from '../infrastructure/storageAdapter.js';
import { globalEventBus, SystemEvents } from '../infrastructure/eventBus.js';
import { authService } from './authService.js';

export class RecordService {
    constructor(repository = new LocalStorageRecordRepository(), storage = new CloudStorageAdapter()) {
        this._repository = repository;
        this._storage = storage;
    }

    async listRecords(searchQuery = '') {
        const records = await this._repository.getAll();
        if (!searchQuery || !searchQuery.trim()) {
            return records;
        }

        const query = searchQuery.toLowerCase().trim();
        return records.filter(r => 
            r.code.toLowerCase().includes(query) ||
            r.series.toLowerCase().includes(query) ||
            r.subseries.toLowerCase().includes(query) ||
            r.location.toLowerCase().includes(query) ||
            (r.observations && r.observations.toLowerCase().includes(query))
        );
    }

    async getRecord(code) {
        const record = await this._repository.getByCode(code);
        if (!record) {
            throw new Error(`Record with code '${code}' not found.`);
        }
        return record;
    }

    async createRecord(dto) {
        authService.assertPermission(Permission.CREATE_RECORD);

        // Check if code already exists
        const existing = await this._repository.getByCode(dto.code);
        if (existing) {
            throw new Error(`A record with code '${dto.code}' already exists.`);
        }

        const newRecord = RecordFactory.createRecord(dto);
        await this._repository.save(newRecord);

        globalEventBus.publish(SystemEvents.RECORD_CREATED, newRecord);
        globalEventBus.publish(SystemEvents.UI_NOTIFICATION, {
            type: 'success',
            message: `Record '${newRecord.code}' created successfully.`
        });
        return newRecord;
    }

    async updateRecord(code, dto) {
        authService.assertPermission(Permission.EDIT_RECORD);

        const record = await this.getRecord(code);

        // Apply domain updates
        record.series = dto.series?.trim() || record.series;
        record.subseries = dto.subseries?.trim() || record.subseries;
        record.location = dto.location?.trim() || record.location;
        if (dto.startDate) record.startDate = new Date(dto.startDate);
        if (dto.endDate !== undefined) record.endDate = dto.endDate ? new Date(dto.endDate) : null;
        if (dto.observations !== undefined) record.observations = dto.observations.trim();

        record.validate();
        await this._repository.save(record);

        globalEventBus.publish(SystemEvents.RECORD_UPDATED, record);
        globalEventBus.publish(SystemEvents.UI_NOTIFICATION, {
            type: 'success',
            message: `Record '${record.code}' updated successfully.`
        });
        return record;
    }

    async deleteRecord(code) {
        authService.assertPermission(Permission.DELETE_RECORD);

        await this.getRecord(code);
        await this._repository.delete(code);

        globalEventBus.publish(SystemEvents.RECORD_DELETED, { code });
        globalEventBus.publish(SystemEvents.UI_NOTIFICATION, {
            type: 'success',
            message: `Record '${code}' deleted successfully.`
        });
    }

    async attachDocument(recordCode, file) {
        authService.assertPermission(Permission.UPLOAD_DOCUMENT);

        if (!file) throw new Error('A PDF document file is required.');
        if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
            throw new Error('Only PDF documents are supported for regulatory compliance.');
        }

        const record = await this.getRecord(recordCode);

        // Upload through cloud storage adapter
        const uploadResult = await this._storage.upload(file);

        const docEntity = RecordFactory.createDocument({
            name: uploadResult.name,
            mimeType: uploadResult.mimeType,
            sizeBytes: uploadResult.sizeBytes,
            storageUrl: uploadResult.storageUrl
        });

        record.addDocument(docEntity);
        await this._repository.save(record);

        globalEventBus.publish(SystemEvents.DOCUMENT_ATTACHED, { recordCode, document: docEntity });
        globalEventBus.publish(SystemEvents.UI_NOTIFICATION, {
            type: 'success',
            message: `Document '${docEntity.name}' attached to '${recordCode}'.`
        });
        return docEntity;
    }

    async deleteDocument(recordCode, documentId) {
        authService.assertPermission(Permission.DELETE_DOCUMENT);

        const record = await this.getRecord(recordCode);
        const doc = record.getDocument(documentId);
        if (!doc) {
            throw new Error(`Document '${documentId}' not found in record '${recordCode}'.`);
        }

        record.removeDocument(documentId);
        await this._repository.save(record);

        globalEventBus.publish(SystemEvents.DOCUMENT_DELETED, { recordCode, documentId });
        globalEventBus.publish(SystemEvents.UI_NOTIFICATION, {
            type: 'success',
            message: `Document removed from '${recordCode}'.`
        });
    }

    async getDownloadUrl(storageUrl) {
        return await this._storage.getDownloadUrl(storageUrl);
    }
}

export const recordService = new RecordService();
