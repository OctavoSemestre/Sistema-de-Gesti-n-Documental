/**
 * Adapter Pattern for Cloud Object Storage (AWS S3 / Azure Blob Abstraction)
 */

export class IStorageService {
    async upload(file) {
        throw new Error('Method upload() must be implemented.');
    }

    async getDownloadUrl(storageUrl) {
        throw new Error('Method getDownloadUrl() must be implemented.');
    }
}

/**
 * Cloud Storage Adapter (Simulates AWS S3 Multipart / Presigned Upload and Object Storage)
 */
export class CloudStorageAdapter extends IStorageService {
    constructor(bucketName = 'samana-document-vault-prod') {
        super();
        this.bucketName = bucketName;
        this._storagePrefix = 's3://' + this.bucketName;
    }

    /**
     * Uploads file to simulated Cloud Object Storage with base64 data persistence
     */
    async upload(file) {
        if (!file) throw new Error('No file provided for upload.');

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const objectKey = `documents/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
                const storageUrl = `${this._storagePrefix}/${objectKey}`;

                // Store payload in local session storage to simulate real file persistence
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
     * Resolves object URL / Presigned link for downloading
     */
    async getDownloadUrl(storageUrl) {
        const storedBlob = localStorage.getItem(`storage_${storageUrl}`);
        if (storedBlob) {
            return storedBlob;
        }
        // Fallback simulated URL
        return storageUrl;
    }
}
