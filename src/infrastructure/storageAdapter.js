export class IStorageService {
    /**
     * @param {File} file
     * @returns {Promise<Object>}
     */
    async upload(file) {
        throw new Error('Method upload() must be implemented.');
    }

    /**
     * @param {string} storageUrl
     * @returns {Promise<string>}
     */
    async getDownloadUrl(storageUrl) {
        throw new Error('Method getDownloadUrl() must be implemented.');
    }
}

export class CloudStorageAdapter extends IStorageService {
    /**
     * @param {string} [bucketName] - Target cloud storage bucket name.
     */
    constructor(bucketName = 'samana-document-vault-prod') {
        super();
        this.bucketName = bucketName;
        this._storagePrefix = 's3://' + this.bucketName;
    }

    /**
     * Simulates presigned multipart cloud storage upload using FileReader and session persistence.
     * @param {File} file - PDF binary file to upload.
     * @returns {Promise<{name: string, mimeType: string, sizeBytes: number, storageUrl: string, dataUri: string}>}
     */
    async upload(file) {
        if (!file) throw new Error('No file provided for upload.');

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const objectKey = `documents/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                const storageUrl = `${this._storagePrefix}/${objectKey}`;

                try {
                    localStorage.setItem(`storage_${storageUrl}`, reader.result);
                } catch (e) {
                    console.warn('Storage quota limit reached for local blob simulation, using memory reference.');
                }

                resolve({
                    name: file.name,
                    mimeType: file.type || 'application/pdf',
                    sizeBytes: file.size,
                    storageUrl: storageUrl,
                    dataUri: reader.result
                });
            };
            reader.onerror = (err) => reject(new Error('Failed to read file: ' + err));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Resolves presigned retrieval URL for the uploaded cloud blob.
     * @param {string} storageUrl - Cloud object URI (e.g., s3://...).
     * @returns {Promise<string>}
     */
    async getDownloadUrl(storageUrl) {
        const storedBlob = localStorage.getItem(`storage_${storageUrl}`);
        if (storedBlob) {
            return storedBlob;
        }
        return storageUrl;
    }
}
