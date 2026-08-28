import { authService } from './application/authService.js';
import { recordService } from './application/recordService.js';
import { globalEventBus, SystemEvents } from './infrastructure/eventBus.js';
import { Permission } from './domain/roles.js';

class AppController {
    constructor() {
        this.currentActiveRecordCode = null;
        this._cacheElements();
        this._bindEvents();
        this._subscribeSystemEvents();
    }

    /**
     * @private
     */
    _cacheElements() {
        this.pantallaLogin = document.getElementById('pantalla-login');
        this.appMain = document.getElementById('app-main');
        this.seccionConsulta = document.getElementById('seccion-consulta');
        this.seccionCrear = document.getElementById('seccion-crear');
        this.seccionDocumentos = document.getElementById('seccion-documentos');
        this.toastContainer = document.getElementById('toast-container');

        this.formLogin = document.getElementById('form-login');
        this.loginEmail = document.getElementById('login-email');
        this.loginPassword = document.getElementById('login-password');
        this.loginRol = document.getElementById('login-rol');
        this.usuarioInfo = document.getElementById('usuario-info');
        this.btnSalir = document.getElementById('btn-salir');

        this.btnNuevoExp = document.getElementById('btn-nuevo-exp');
        this.btnRegistrarUsuario = document.getElementById('btn-registrar-usuario');
        this.inputBusqueda = document.getElementById('input-busqueda-exp');
        this.tablaExpedientesBody = document.getElementById('tabla-expedientes-body');

        this.formCrearExp = document.getElementById('form-crear-exp');
        this.tituloFormExp = document.getElementById('titulo-form-exp');
        this.expIsEdit = document.getElementById('exp-is-edit');
        this.expCode = document.getElementById('exp-code');
        this.expSeries = document.getElementById('exp-series');
        this.expSubseries = document.getElementById('exp-subseries');
        this.expLocation = document.getElementById('exp-location');
        this.expStartDate = document.getElementById('exp-start-date');
        this.expEndDate = document.getElementById('exp-end-date');
        this.expObservations = document.getElementById('exp-observations');
        this.btnCancelarCrear = document.getElementById('btn-cancelar-crear');

        this.docExpCodeTitle = document.getElementById('doc-exp-code-title');
        this.docExpDetailsSubtitle = document.getElementById('doc-exp-details-subtitle');
        this.inputArchivoDoc = document.getElementById('input-archivo-doc');
        this.btnAsociarDoc = document.getElementById('btn-asociar-doc');
        this.tablaDocumentosBody = document.getElementById('tabla-documentos-body');
        this.btnVolverLista = document.getElementById('btn-volver-lista');
        this.zonaCarga = document.getElementById('zona-carga');
    }

    /**
     * @private
     */
    _bindEvents() {
        this.formLogin.addEventListener('submit', (e) => this._handleLogin(e));
        this.btnSalir.addEventListener('click', () => authService.logout());

        this.btnNuevoExp.addEventListener('click', () => this._showCreateForm());
        this.btnCancelarCrear.addEventListener('click', () => this._showListView());
        this.btnVolverLista.addEventListener('click', () => this._showListView());

        this.inputBusqueda.addEventListener('input', () => this._renderRecordsList());
        this.formCrearExp.addEventListener('submit', (e) => this._handleSaveRecord(e));

        this.btnAsociarDoc.addEventListener('click', () => this._handleUploadDocument());

        if (this.btnRegistrarUsuario) {
            this.btnRegistrarUsuario.addEventListener('click', () => {
                this._showToast('Módulo de Administración de Usuarios: Funcionalidad habilitada exclusivamente para Administrador.', 'info');
            });
        }
    }

    /**
     * @private
     */
    _subscribeSystemEvents() {
        globalEventBus.subscribe(SystemEvents.AUTH_STATE_CHANGED, (user) => this._handleAuthStateChanged(user));
        globalEventBus.subscribe(SystemEvents.RECORD_CREATED, () => this._renderRecordsList());
        globalEventBus.subscribe(SystemEvents.RECORD_UPDATED, () => this._renderRecordsList());
        globalEventBus.subscribe(SystemEvents.RECORD_DELETED, () => this._renderRecordsList());
        globalEventBus.subscribe(SystemEvents.DOCUMENT_ATTACHED, () => this._refreshDocumentsView());
        globalEventBus.subscribe(SystemEvents.DOCUMENT_DELETED, () => this._refreshDocumentsView());
        globalEventBus.subscribe(SystemEvents.UI_NOTIFICATION, (data) => this._showToast(data.message, data.type));
    }

    init() {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            this._handleAuthStateChanged(currentUser);
        } else {
            this.pantallaLogin.classList.remove('hidden');
            this.appMain.classList.add('hidden');
        }
    }

    /**
     * @private
     * @param {Event} e
     */
    _handleLogin(e) {
        e.preventDefault();
        try {
            const email = this.loginEmail.value;
            const password = this.loginPassword.value;
            const role = this.loginRol.value;
            authService.login(email, password, role);
        } catch (error) {
            this._showToast(error.message, 'error');
        }
    }

    /**
     * Updates view layout and toggles RBAC-restricted action controls based on authenticated role.
     * @private
     * @param {Object|null} user - Active authenticated domain user.
     */
    _handleAuthStateChanged(user) {
        if (!user) {
            this.appMain.classList.add('hidden');
            this.pantallaLogin.classList.remove('hidden');
            this.tablaExpedientesBody.innerHTML = '';
            return;
        }

        this.pantallaLogin.classList.add('hidden');
        this.appMain.classList.remove('hidden');
        this.usuarioInfo.innerHTML = `👤 Rol: <strong>${this._escapeHtml(user.role)}</strong>`;

        const canWrite = user.can(Permission.CREATE_RECORD);
        const canAdmin = user.can(Permission.MANAGE_USERS);

        if (canWrite) {
            this.btnNuevoExp.classList.remove('hidden');
            this.zonaCarga.classList.remove('hidden');
        } else {
            this.btnNuevoExp.classList.add('hidden');
            this.zonaCarga.classList.add('hidden');
        }

        if (canAdmin) {
            this.btnRegistrarUsuario.classList.remove('hidden');
        } else {
            this.btnRegistrarUsuario.classList.add('hidden');
        }

        this._showListView();
        this._renderRecordsList();
    }

    /**
     * @private
     */
    _showListView() {
        this.seccionCrear.classList.add('hidden');
        this.seccionDocumentos.classList.add('hidden');
        this.seccionConsulta.classList.remove('hidden');
    }

    /**
     * @private
     * @param {Object|null} [recordToEdit]
     */
    _showCreateForm(recordToEdit = null) {
        this.seccionConsulta.classList.add('hidden');
        this.seccionDocumentos.classList.add('hidden');
        this.seccionCrear.classList.remove('hidden');

        if (recordToEdit) {
            this.tituloFormExp.innerText = `Modificar Expediente: ${recordToEdit.code}`;
            this.expIsEdit.value = recordToEdit.code;
            this.expCode.value = recordToEdit.code;
            this.expCode.disabled = true;
            this.expSeries.value = recordToEdit.series;
            this.expSubseries.value = recordToEdit.subseries;
            this.expLocation.value = recordToEdit.location;
            this.expStartDate.value = recordToEdit.formattedStartDate;
            this.expEndDate.value = recordToEdit.formattedEndDate;
            this.expObservations.value = recordToEdit.observations || '';
        } else {
            this.tituloFormExp.innerText = 'Registrar Nuevo Expediente';
            this.expIsEdit.value = '0';
            this.expCode.value = '';
            this.expCode.disabled = false;
            this.expSeries.value = '';
            this.expSubseries.value = '';
            this.expLocation.value = 'Archivo de Gestión';
            this.expStartDate.value = new Date().toISOString().split('T')[0];
            this.expEndDate.value = '';
            this.expObservations.value = '';
        }
    }

    /**
     * @private
     * @param {Event} e
     */
    async _handleSaveRecord(e) {
        e.preventDefault();
        try {
            const isEdit = this.expIsEdit.value !== '0';
            const dto = {
                code: this.expCode.value,
                series: this.expSeries.value,
                subseries: this.expSubseries.value,
                location: this.expLocation.value,
                startDate: this.expStartDate.value,
                endDate: this.expEndDate.value || null,
                observations: this.expObservations.value
            };

            if (isEdit) {
                await recordService.updateRecord(this.expIsEdit.value, dto);
            } else {
                await recordService.createRecord(dto);
            }

            this._showListView();
        } catch (error) {
            this._showToast(error.message, 'error');
        }
    }

    /**
     * Renders reactive records table dynamically applying RBAC permission checks for action buttons.
     * @private
     */
    async _renderRecordsList() {
        const query = this.inputBusqueda.value;
        const records = await recordService.listRecords(query);
        const user = authService.getCurrentUser();
        if (!user) return;

        this.tablaExpedientesBody.innerHTML = '';

        if (records.length === 0) {
            this.tablaExpedientesBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">No se encontraron expedientes coincidentes.</td>
                </tr>
            `;
            return;
        }

        records.forEach(rec => {
            const tr = document.createElement('tr');

            let badgeClass = 'badge-gestion';
            if (rec.location.includes('Central')) badgeClass = 'badge-central';
            if (rec.location.includes('Histórico')) badgeClass = 'badge-historico';

            tr.innerHTML = `
                <td><strong>${this._escapeHtml(rec.code)}</strong></td>
                <td>${this._escapeHtml(rec.series)}</td>
                <td>${this._escapeHtml(rec.subseries)}</td>
                <td><span class="badge ${badgeClass}">${this._escapeHtml(rec.location)}</span></td>
                <td><span class="badge-doc-count">${rec.documents.length} doc(s)</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-docs" data-code="${rec.code}">Documentos</button>
                        ${user.can(Permission.EDIT_RECORD) ? `<button class="btn btn-sm btn-secondary btn-edit" data-code="${rec.code}">Editar</button>` : ''}
                        ${user.can(Permission.DELETE_RECORD) ? `<button class="btn btn-sm btn-danger btn-del" data-code="${rec.code}">Eliminar</button>` : ''}
                    </div>
                </td>
            `;

            tr.querySelector('.btn-docs').addEventListener('click', () => this._openDocumentsView(rec.code));
            
            const btnEdit = tr.querySelector('.btn-edit');
            if (btnEdit) {
                btnEdit.addEventListener('click', () => this._showCreateForm(rec));
            }

            const btnDel = tr.querySelector('.btn-del');
            if (btnDel) {
                btnDel.addEventListener('click', () => this._handleDeleteRecord(rec.code));
            }

            this.tablaExpedientesBody.appendChild(tr);
        });
    }

    /**
     * @private
     * @param {string} code
     */
    async _handleDeleteRecord(code) {
        if (confirm(`¿Confirma que desea eliminar el expediente '${code}' y sus archivos adjuntos?`)) {
            try {
                await recordService.deleteRecord(code);
            } catch (error) {
                this._showToast(error.message, 'error');
            }
        }
    }

    /**
     * @private
     * @param {string} recordCode
     */
    async _openDocumentsView(recordCode) {
        this.currentActiveRecordCode = recordCode;
        this.seccionConsulta.classList.add('hidden');
        this.seccionCrear.classList.add('hidden');
        this.seccionDocumentos.classList.remove('hidden');
        this._refreshDocumentsView();
    }

    /**
     * @private
     */
    async _refreshDocumentsView() {
        if (!this.currentActiveRecordCode) return;

        try {
            const record = await recordService.getRecord(this.currentActiveRecordCode);
            const user = authService.getCurrentUser();

            this.docExpCodeTitle.innerText = `Expediente: ${record.code}`;
            this.docExpDetailsSubtitle.innerText = `Serie: ${record.series} | Subserie: ${record.subseries} | Ubicación: ${record.location}`;
            this.tablaDocumentosBody.innerHTML = '';

            if (record.documents.length === 0) {
                this.tablaDocumentosBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">No hay documentos digitales asociados a este expediente.</td>
                    </tr>
                `;
                return;
            }

            record.documents.forEach(doc => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${this._escapeHtml(doc.name)}</strong></td>
                    <td>${doc.formattedSize}</td>
                    <td>${doc.formattedDate}</td>
                    <td><span class="cloud-tag">${doc.storageUrl ? 'S3: ' + doc.storageUrl.split('/').pop() : 'Cloud Vault'}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-download" data-id="${doc.id}">Descargar</button>
                            ${user.can(Permission.DELETE_DOCUMENT) ? `<button class="btn btn-sm btn-danger btn-doc-del" data-id="${doc.id}">Eliminar</button>` : ''}
                        </div>
                    </td>
                `;

                tr.querySelector('.btn-download').addEventListener('click', () => this._handleDownloadDocument(doc));

                const btnDocDel = tr.querySelector('.btn-doc-del');
                if (btnDocDel) {
                    btnDocDel.addEventListener('click', () => this._handleDeleteDocument(doc.id));
                }

                this.tablaDocumentosBody.appendChild(tr);
            });
        } catch (error) {
            this._showToast(error.message, 'error');
            this._showListView();
        }
    }

    /**
     * @private
     */
    async _handleUploadDocument() {
        const file = this.inputArchivoDoc.files[0];
        if (!file) {
            this._showToast('Por favor seleccione un archivo PDF para asociar.', 'error');
            return;
        }

        try {
            this.btnAsociarDoc.disabled = true;
            this.btnAsociarDoc.innerText = 'Cargando a la Nube...';
            await recordService.attachDocument(this.currentActiveRecordCode, file);
            this.inputArchivoDoc.value = '';
        } catch (error) {
            this._showToast(error.message, 'error');
        } finally {
            this.btnAsociarDoc.disabled = false;
            this.btnAsociarDoc.innerText = 'Cargar a la Nube (S3 Vault)';
        }
    }

    /**
     * @private
     * @param {Object} doc
     */
    async _handleDownloadDocument(doc) {
        try {
            const url = await recordService.getDownloadUrl(doc.storageUrl);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            this._showToast(`Iniciando descarga segura de: ${doc.name}`, 'success');
        } catch (error) {
            this._showToast(error.message, 'error');
        }
    }

    /**
     * @private
     * @param {string} documentId
     */
    async _handleDeleteDocument(documentId) {
        if (confirm('¿Desea eliminar este documento digital del repositorio Cloud?')) {
            try {
                await recordService.deleteDocument(this.currentActiveRecordCode, documentId);
            } catch (error) {
                this._showToast(error.message, 'error');
            }
        }
    }

    /**
     * @private
     * @param {string} message
     * @param {string} [type]
     */
    _showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'toast-error' : 'toast-success'}`;
        toast.innerText = message;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 4000);
    }

    /**
     * Sanitizes untrusted user input before DOM insertion to prevent XSS.
     * @private
     * @param {string} str
     * @returns {string} Sanitized HTML-safe string.
     */
    _escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    app.init();
});
