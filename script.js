let rolActual = '';

// Elementos del DOM
const pantallaLogin = document.getElementById('pantalla-login');
const appMain = document.getElementById('app-main');
const seccionConsulta = document.getElementById('seccion-consulta');
const seccionCrear = document.getElementById('seccion-crear');
const seccionDocumentos = document.getElementById('seccion-documentos');

const formLogin = document.getElementById('form-login');
const formCrearExp = document.getElementById('form-crear-exp');
const rolSelect = document.getElementById('rol-select');
const usuarioInfo = document.getElementById('usuario-info');

const btnSalir = document.getElementById('btn-salir');
const btnNuevoExp = document.getElementById('btn-nuevo-exp');
const btnRegistrarUsuario = document.getElementById('btn-registrar-usuario');
const btnCancelarCrear = document.getElementById('btn-cancelar-crear');
const btnVolverLista = document.getElementById('btn-volver-lista');
const btnAsociarDoc = document.getElementById('btn-asociar-doc');

// Asignación de eventos
formLogin.addEventListener('submit', iniciarSesion);
btnSalir.addEventListener('click', cerrarSesion);
btnNuevoExp.addEventListener('click', mostrarCrear);
btnCancelarCrear.addEventListener('click', mostrarConsulta);
btnVolverLista.addEventListener('click', mostrarConsulta);
formCrearExp.addEventListener('submit', guardarExpediente);

if (btnRegistrarUsuario) {
    btnRegistrarUsuario.addEventListener('click', () => alert('Formulario para registrar un nuevo usuario en la plataforma.'));
}

if (btnAsociarDoc) {
    btnAsociarDoc.addEventListener('click', () => alert('Documento digital asociado correctamente.'));
}

// Botones de la tabla
document.querySelectorAll('.btn-ver-doc').forEach(btn => btn.addEventListener('click', verDocumentos));
document.querySelectorAll('.btn-descargar').forEach(btn => btn.addEventListener('click', () => alert('Descargando archivo...')));
document.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', () => {
    document.getElementById('titulo-form-exp').innerText = 'Modificar Registro de Expediente';
    mostrarCrear();
}));
document.querySelectorAll('.btn-eliminar').forEach(btn => btn.addEventListener('click', () => alert('Registro eliminado del sistema.')));

// Gestión interna de permisos según el perfil activo
function iniciarSesion(e) {
    e.preventDefault();
    rolActual = rolSelect.value;
    usuarioInfo.innerText = 'Rol: ' + rolActual;
    
    pantallaLogin.classList.add('hidden');
    appMain.classList.remove('hidden');

    // Muestra u oculta botones de Administrador
    const elementosAdmin = document.querySelectorAll('.btn-admin-only');
    elementosAdmin.forEach(el => {
        if (rolActual === 'Administrador') el.classList.remove('hidden');
        else el.classList.add('hidden');
    });

    // Muestra u oculta controles operativos de Funcionario
    const elementosFuncionario = document.querySelectorAll('.solo-funcionario');
    elementosFuncionario.forEach(el => {
        if (rolActual === 'Técnico') el.classList.add('hidden');
        else el.classList.remove('hidden');
    });

    // Control de acceso para el botón de creación
    if (rolActual === 'Técnico') {
        btnNuevoExp.classList.add('hidden');
    } else {
        btnNuevoExp.classList.remove('hidden');
    }
}

function cerrarSesion() {
    appMain.classList.add('hidden');
    pantallaLogin.classList.remove('hidden');
}

function mostrarCrear() {
    seccionConsulta.classList.add('hidden');
    seccionCrear.classList.remove('hidden');
}

function mostrarConsulta() {
    document.getElementById('titulo-form-exp').innerText = 'Registrar Nuevo Expediente';
    seccionCrear.classList.add('hidden');
    seccionDocumentos.classList.add('hidden');
    seccionConsulta.classList.remove('hidden');
}

function verDocumentos() {
    seccionConsulta.classList.add('hidden');
    seccionDocumentos.classList.remove('hidden');
}

function guardarExpediente(e) {
    e.preventDefault();
    alert('Información guardada con éxito.');
    mostrarConsulta();
}