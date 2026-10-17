// --- CONFIGURACIÓN DE SUPABASE ---
const SUPABASE_URL = 'https://ssqnjtezauyqbsgbndpp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5f6EGOcPPqSBsc9nVF6BIA_jyxLCeZt';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let userData = null;
let currentRole = 'pasajero';
let viajeActivoId = null;
let calificacionSeleccionada = 5;
let viajeParaCalificarId = null;
let realtimeViajesChannel = null;
let realtimeChatChannel = null;

// --- CONTROL DE SESIÓN ---
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    const loadingScreen = document.getElementById('loading-screen');
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const userInfo = document.getElementById('user-info');
    const userEmailDisplay = document.getElementById('user-email-display');
    const userRepBadge = document.getElementById('user-reputation-badge');
    const adminBadge = document.getElementById('admin-badge');
    
    if (loadingScreen) loadingScreen.classList.add('hidden');

    if (session && session.user) {
        currentUser = session.user;
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userInfo.classList.remove('hidden');
        userEmailDisplay.textContent = currentUser.email;

        const { data: userDoc } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (userDoc) {
            userData = userDoc;
            currentRole = userData.role || 'pasajero';
            const repPromedio = userData.reputacion_cantidad > 0 
                ? (userData.reputacion_suma / userData.reputacion_cantidad).toFixed(1) 
                : '5.0';
            userRepBadge.textContent = `★ ${repPromedio} (${userData.reputacion_cantidad || 0})`;

            if (currentRole === 'admin') {
                adminBadge.classList.remove('hidden');
            } else {
                adminBadge.classList.add('hidden');
            }
        }
        renderPaneles();
    } else {
        currentUser = null;
        userData = null;
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        userInfo.classList.add('hidden');
        if (realtimeViajesChannel) supabaseClient.removeChannel(realtimeViajesChannel);
        if (realtimeChatChannel) supabaseClient.removeChannel(realtimeChatChannel);
    }
});

// --- TOGGLE CONTRASEÑA ---
function togglePassword(idInput, idBtn) {
    const input = document.getElementById(idInput);
    const btn = document.getElementById(idBtn);
    if (!input || !btn) return;

    if (input.type === "password") {
        input.type = "text";
        btn.className = "absolute right-3.5 text-appYellow drop-shadow-[0_0_8px_rgba(255,230,0,0.8)] focus:outline-none transition-all duration-200";
        btn.innerHTML = `
            <svg class="${idInput === 'login-password' ? 'w-5 h-5' : 'w-4 h-4'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.02 10.02 0 013.122-.563c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" />
            </svg>
        `;
    } else {
        input.type = "password";
        btn.className = "absolute right-3.5 text-gray-500 hover:text-appYellow focus:outline-none transition-all duration-200";
        btn.innerHTML = `
            <svg class="${idInput === 'login-password' ? 'w-5 h-5' : 'w-4 h-4'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        `;
    }
}

// --- UI HELPERS ---
function toggleHistorial(rol) {
    const contenedor = document.getElementById(`contenedor-historial-${rol}`);
    const btnTexto = document.getElementById(`btn-toggle-historial-${rol}`);
    
    if (contenedor.classList.contains('hidden')) {
        contenedor.classList.remove('hidden');
        btnTexto.textContent = "Ocultar historial de viajes";
    } else {
        contenedor.classList.add('hidden');
        btnTexto.textContent = rol === 'pasajero' ? "Ver mi historial de viajes" : "Ver historial de viajes realizados";
    }
}

function toggleCamposConductor() {
    const rol = document.getElementById('reg-role').value;
    const camposConductor = document.getElementById('campos-conductor');
    const vehiculoInput = document.getElementById('reg-vehiculo');
    const patenteInput = document.getElementById('reg-patente');

    if (rol === 'conductor') {
        camposConductor.classList.remove('hidden');
        vehiculoInput.required = true;
        patenteInput.required = true;
    } else {
        camposConductor.classList.add('hidden');
        vehiculoInput.required = false;
        patenteInput.required = false;
    }
}

function cambiarTabAuth(tab) {
    const loginForm = document.getElementById('form-login');
    const regForm = document.getElementById('form-register');
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');
    document.getElementById('auth-mensaje').textContent = '';

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        tabLogin.className = "flex-1 py-3 text-center rounded-xl transition-all duration-300 bg-appYellow text-black shadow-neon-sm font-bold";
        tabReg.className = "flex-1 py-3 text-center rounded-xl transition-all duration-300 text-gray-400 hover:text-white font-semibold";
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        tabReg.className = "flex-1 py-3 text-center rounded-xl transition-all duration-300 bg-appYellow text-black shadow-neon-sm font-bold";
        tabLogin.className = "flex-1 py-3 text-center rounded-xl transition-all duration-300 text-gray-400 hover:text-white font-semibold";
    }
}

// --- REGISTRO Y LOGIN ---
async function handleRegister(e) {
    e.preventDefault();
    const nombre = document.getElementById('reg-nombre').value.trim();
    const apellido = document.getElementById('reg-apellido').value.trim();
    const telefono = document.getElementById('reg-telefono').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const vehiculo = document.getElementById('reg-vehiculo').value.trim();
    const patente = document.getElementById('reg-patente').value.trim().toUpperCase();
    const msg = document.getElementById('auth-mensaje');
    msg.textContent = '';

    try {
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({ email, password });
        if (authError) throw authError;

        const datosUsuario = {
            id: authData.user.id,
            nombre,
            apellido,
            telefono,
            email,
            role,
            reputacion_suma: 0,
            reputacion_cantidad: 0
        };

        if (role === 'conductor') {
            datosUsuario.vehiculo = vehiculo;
            datosUsuario.patente = patente;
        }

        const { error: profileError } = await supabaseClient.from('usuarios').insert([datosUsuario]);
        if (profileError) throw profileError;
    } catch (error) {
        msg.textContent = error.message;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const msg = document.getElementById('auth-mensaje');

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
    } catch (error) {
        msg.textContent = error.message;
    }
}

function recuperarPassword() {
    const email = document.getElementById('login-email').value;
    if (!email) {
        alert("Ingresá tu correo electrónico primero.");
        return;
    }
    supabaseClient.auth.resetPasswordForEmail(email)
        .then(() => alert("Te enviamos un correo para restablecer tu contraseña."))
        .catch(err => alert(err.message));
}

function cerrarSesion() { 
    supabaseClient.auth.signOut(); 
}

function renderPaneles() {
    const panelPasajero = document.getElementById('panel-pasajero');
    const panelConductor = document.getElementById('panel-conductor');

    panelPasajero.classList.add('hidden');
    panelConductor.classList.add('hidden');

    if (currentRole === 'conductor') {
        panelConductor.classList.remove('hidden');
        iniciarEscuchaViajesConductor();
        cargarHistorialConductor();
    } else {
        panelPasajero.classList.remove('hidden');
        iniciarEscuchaViajesPasajero();
        cargarHistorialPasajero();
    }
}

// --- PASAJERO ---
async function solicitarViaje(e) {
    e.preventDefault();
    const origen = document.getElementById('origen').value;
    const destino = document.getElementById('destino').value;

    const repPasajero = (userData && userData.reputacion_cantidad > 0)
        ? (userData.reputacion_suma / userData.reputacion_cantidad).toFixed(1) 
        : '5.0';

    try {
        const { data, error } = await supabaseClient.from('viajes').insert([{
            pasajero_id: currentUser.id,
            pasajero_email: currentUser.email,
            pasajero_nombre: userData ? `${userData.nombre} ${userData.apellido}` : currentUser.email,
            pasajero_reputacion: repPasajero,
            pasajero_viajes_count: userData ? (userData.reputacion_cantidad || 0) : 0,
            origen,
            destino,
            estado: 'buscando',
            postulaciones: []
        }]).select();

        if (error) throw error;
        if (data && data.length > 0) {
            viajeActivoId = data[0].id;
        }
        document.getElementById('form-viaje').reset();
    } catch (error) {
        alert("Error al solicitar viaje: " + error.message);
    }
}

function iniciarEscuchaViajesPasajero() {
    if (realtimeViajesChannel) supabaseClient.removeChannel(realtimeViajesChannel);

    fetchViajesPasajero();

    realtimeViajesChannel = supabaseClient
        .channel('public:viajes:pasajero')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'viajes' }, () => {
            fetchViajesPasajero();
        })
        .subscribe();
}

async function fetchViajesPasajero() {
    const { data: viajes, error } = await supabaseClient
        .from('viajes')
        .select('*')
        .eq('pasajero_id', currentUser.id);

    if (error) return;

    const statusTitulo = document.getElementById('status-titulo');
    const statusDetalle = document.getElementById('status-detalle');
    const cajaEstado = document.getElementById('estado-viaje-pasajero');
    const accionesDiv = document.getElementById('acciones-viaje-pasajero');
    const contenedorChat = document.getElementById('contenedor-chat-pasajero');
    const listaVehiculos = document.getElementById('lista-vehiculos-postulados');

    let viajeActivo = null;
    let viajePorCalificar = null;

    viajes.forEach(v => {
        if (['buscando', 'aceptado', 'en_curso'].includes(v.estado)) {
            viajeActivo = v;
        }
        if (v.estado === 'finalizado' && v.calificacion_pasajero === null) {
            viajePorCalificar = v;
        }
    });

    if (!viajeActivo) {
        cajaEstado.classList.add('hidden');
        contenedorChat.classList.add('hidden');
        listaVehiculos.innerHTML = '';
        if (realtimeChatChannel) { supabaseClient.removeChannel(realtimeChatChannel); realtimeChatChannel = null; }
    } else {
        cajaEstado.classList.remove('hidden');
        viajeActivoId = viajeActivo.id;

        if (viajeActivo.estado === 'buscando') {
            statusTitulo.innerHTML = `<span class="w-3 h-3 rounded-full bg-appYellow animate-ping"></span> Esperando ofertas de conductores...`;
            statusDetalle.textContent = `Ruta: ${viajeActivo.origen} ➔ ${viajeActivo.destino}`;
            accionesDiv.innerHTML = `<button onclick="cancelarViaje('${viajeActivoId}')" class="w-full bg-red-500/10 text-red-400 border border-red-500/30 font-black py-3 rounded-xl text-xs hover:bg-red-500 hover:text-white transition uppercase tracking-wider">Cancelar Solicitud</button>`;
            contenedorChat.classList.add('hidden');

            renderPostulacionesPasajero(viajeActivo);
        } else if (['aceptado', 'en_curso'].includes(viajeActivo.estado)) {
            listaVehiculos.innerHTML = '';
            statusTitulo.innerHTML = `<span class="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span> ${viajeActivo.estado === 'aceptado' ? "¡Conductor asignado!" : "¡Viaje en curso!"}`;
            statusDetalle.innerHTML = `
                Conductor: <b class="text-white font-mono">${viajeActivo.conductor_nombre || viajeActivo.conductor_email}</b> (★ ${viajeActivo.conductor_reputacion || '5.0'})<br>
                Vehículo: <span class="text-appYellow font-bold">${viajeActivo.conductor_vehiculo}</span> [${viajeActivo.conductor_patente}]<br>
                Precio acordado: <b class="text-green-400 font-mono text-sm">$${viajeActivo.precio_acordado}</b><br>
                Ruta: ${viajeActivo.origen} ➔ ${viajeActivo.destino}
            `;
            accionesDiv.innerHTML = "";
            contenedorChat.classList.remove('hidden');
            activarEscuchaChat(viajeActivoId);
        }
    }

    if (viajePorCalificar && !viajeParaCalificarId) {
        viajeParaCalificarId = viajePorCalificar.id;
        document.getElementById('modal-titulo-calificacion').textContent = "Calificar al Conductor";
        document.getElementById('modal-sub-calificacion').textContent = "¿Cómo fue la atención y el viaje?";
        document.getElementById('modal-calificacion').classList.remove('hidden');
    }
}

function renderPostulacionesPasajero(viaje) {
    const listaDiv = document.getElementById('lista-vehiculos-postulados');
    listaDiv.innerHTML = '';

    const postulaciones = viaje.postulaciones || [];
    if (postulaciones.length === 0) {
        listaDiv.innerHTML = `<p class="text-xs text-gray-500 font-mono text-center py-2">Aún no hay ofertas de conductores. Aguardá unos instantes...</p>`;
        return;
    }

    listaDiv.innerHTML = `<p class="text-[10px] font-mono font-bold uppercase tracking-widest text-appYellow mb-2">🚗 Ofertas recibidas para tu viaje:</p>`;

    postulaciones.forEach(post => {
        const card = document.createElement('div');
        card.className = "bg-appDark border border-appBorder hover:border-appYellow p-4 rounded-2xl flex justify-between items-center transition";
        card.innerHTML = `
            <div class="font-mono text-xs">
                <p class="font-bold text-white">${post.conductorVehiculo} <span class="text-gray-400 text-[10px]">[${post.conductorPatente}]</span></p>
                <p class="text-gray-300 text-[11px]">Conductor: ${post.conductorNombre}</p>
                <p class="text-appYellow text-[11px]">★ Reputación: <b>${post.conductorReputacion}</b> (${post.conductorViajesCount} viajes)</p>
                <p class="text-green-400 font-bold text-sm mt-1">Precio ofrecido: $${post.precioOferta}</p>
            </div>
            <button onclick="aceptarVehiculo('${viaje.id}', '${post.conductorId}', '${post.conductorEmail}', '${post.conductorNombre}', '${post.conductorVehiculo}', '${post.conductorPatente}', '${post.conductorReputacion}', ${post.precioOferta})" class="bg-appYellow text-black font-black px-3.5 py-2.5 rounded-xl text-xs hover:bg-yellow-400 shadow transition uppercase tracking-wider">
                Aceptar Oferta
            </button>
        `;
        listaDiv.appendChild(card);
    });
}

async function aceptarVehiculo(viajeId, cId, cEmail, cNombre, cVehiculo, cPatente, cRep, precio) {
    try {
        const { error } = await supabaseClient.from('viajes').update({
            estado: 'aceptado',
            conductor_id: cId,
            conductor_email: cEmail,
            conductor_nombre: cNombre,
            conductor_vehiculo: cVehiculo,
            conductor_patente: cPatente,
            conductor_reputacion: cRep,
            precio_acordado: precio
        }).eq('id', viajeId);

        if (error) throw error;
    } catch (error) {
        alert("Error al confirmar el viaje: " + error.message);
    }
}

async function cancelarViaje(id) {
    await supabaseClient.from('viajes').delete().eq('id', id);
    document.getElementById('estado-viaje-pasajero').classList.add('hidden');
}

async function cargarHistorialPasajero() {
    const { data: viajes, error } = await supabaseClient
        .from('viajes')
        .select('*')
        .eq('pasajero_id', currentUser.id)
        .eq('estado', 'finalizado');

    const historialDiv = document.getElementById('historial-pasajero');
    historialDiv.innerHTML = '';

    if (error || !viajes || viajes.length === 0) {
        historialDiv.innerHTML = `<p class="text-xs text-gray-500 font-mono">No tenés viajes registrados aún.</p>`;
        return;
    }

    viajes.forEach(v => {
        const card = document.createElement('div');
        card.className = "bg-appDark p-3.5 rounded-2xl border border-appBorder text-xs flex justify-between items-center font-mono";
        card.innerHTML = `<div><p class="font-bold text-gray-200">📍 ${v.origen} ➔ ${v.destino}</p><span class="text-appYellow">★ Tu calificación: ${v.calificacion_pasajero || 'Pendiente'}</span></div><span class="font-bold text-green-400">$${v.precio_acordado || '-'}</span>`;
        historialDiv.appendChild(card);
    });
}

// --- CONDUCTOR ---
function iniciarEscuchaViajesConductor() {
    if (realtimeViajesChannel) supabaseClient.removeChannel(realtimeViajesChannel);

    fetchViajesConductor();

    realtimeViajesChannel = supabaseClient
        .channel('public:viajes:conductor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'viajes' }, () => {
            fetchViajesConductor();
        })
        .subscribe();
}

async function fetchViajesConductor() {
    const { data: viajes, error } = await supabaseClient.from('viajes').select('*');
    if (error) return;

    const listaViajes = document.getElementById('lista-viajes');
    listaViajes.innerHTML = '';

    let viajeActivoConductor = null;
    let viajesDisponibles = [];
    let viajePorCalificar = null;

    viajes.forEach(v => {
        if (v.conductor_id === currentUser.id && ['aceptado', 'en_curso'].includes(v.estado)) {
            viajeActivoConductor = v;
        } else if (v.estado === 'buscando') {
            viajesDisponibles.push(v);
        }

        if (v.conductor_id === currentUser.id && v.estado === 'finalizado' && v.calificacion_conductor === null) {
            viajePorCalificar = v;
        }
    });

    if (viajeActivoConductor) {
        viajeActivoId = viajeActivoConductor.id;
        const v = viajeActivoConductor;
        const cardActiva = document.createElement('div');
        cardActiva.id = 'contenedor-viaje-activo-conductor';
        cardActiva.className = "bg-appCard border border-appYellow p-6 rounded-3xl shadow-2xl space-y-4 mb-4 shadow-neon-sm";
        cardActiva.innerHTML = `
            <h3 class="font-black text-appYellow text-sm flex items-center gap-2 font-mono uppercase tracking-wider">
                <span class="w-2.5 h-2.5 rounded-full bg-appYellow animate-pulse"></span> Viaje Aceptado (${v.estado === 'aceptado' ? 'En camino a buscar al pasajero' : 'En trayecto'})
            </h3>
            <p class="text-xs text-gray-300 font-mono leading-relaxed">
                Pasajero: <span class="text-white font-bold">${v.pasajero_nombre || v.pasajero_email}</span> (★ ${v.pasajero_reputacion || '5.0'})<br>
                Tarifa Acordada: <b class="text-green-400 font-mono text-sm">$${v.precio_acordado}</b><br>
                Ruta: ${v.origen} ➔ ${v.destino}
            </p>
            <div class="flex space-x-2">
                ${v.estado === 'aceptado' ? `<button onclick="actualizarEstadoViaje('${v.id}', 'en_curso')" class="flex-1 bg-appYellow text-black font-black py-3 rounded-xl text-xs hover:bg-yellow-400 shadow transition uppercase tracking-wider">Iniciar Trayecto</button>` : ''}
                <button onclick="actualizarEstadoViaje('${v.id}', 'finalizado')" class="flex-1 bg-green-500 text-black font-black py-3 rounded-xl text-xs hover:bg-green-400 shadow transition uppercase tracking-wider">Finalizar Viaje</button>
            </div>
            <div class="border-t border-appBorder pt-3.5 space-y-2">
                <h4 class="text-[11px] font-mono font-bold uppercase tracking-widest text-gray-400">💬 Chat con el Pasajero</h4>
                <div id="chat-mensajes-conductor" class="bg-appDark h-36 overflow-y-auto p-3 rounded-2xl border border-appBorder text-xs space-y-1 font-mono"></div>
                <form onsubmit="enviarMensajeChat(event, 'conductor')" class="flex space-x-2">
                    <input type="text" id="input-chat-conductor" placeholder="Escribir mensaje..." required class="flex-1 bg-appDark border border-appBorder rounded-xl p-3 text-xs focus:outline-none focus:border-appYellow text-white font-mono">
                    <button type="submit" class="bg-appYellow text-black font-black px-4 py-2.5 rounded-xl text-xs shadow transition uppercase tracking-wider">Enviar</button>
                </form>
            </div>
        `;
        listaViajes.appendChild(cardActiva);
        activarEscuchaChat(v.id);
    }

    if (viajesDisponibles.length === 0 && !viajeActivoConductor) {
        listaViajes.innerHTML = `<p class="text-center text-sm text-gray-500 py-6 font-mono">No hay pedidos de viaje pendientes en Crespo.</p>`;
    } else if (!viajeActivoConductor) {
        viajesDisponibles.forEach(viaje => {
            const postulacionPropia = (viaje.postulaciones || []).find(p => p.conductorId === currentUser.id);
            const yaPostulado = !!postulacionPropia;

            const card = document.createElement('div');
            card.className = "bg-appCard border border-appBorder p-5 rounded-3xl shadow-xl space-y-3";
            card.innerHTML = `
                <div class="font-mono">
                    <p class="text-xs text-gray-300">Pasajero: <b class="text-white">${viaje.pasajero_nombre || viaje.pasajero_email}</b></p>
                    <p class="text-xs text-appYellow font-bold mt-0.5">★ Reputación: ${viaje.pasajero_reputacion || '5.0'} (${viaje.pasajero_viajes_count || 0} viajes)</p>
                    <p class="text-sm font-bold mt-2 text-gray-200">📍 ${viaje.origen}</p>
                    <p class="text-sm font-bold text-appYellow mt-0.5">🏁 ${viaje.destino}</p>
                </div>

                ${!yaPostulado ? `
                    <div class="flex gap-2 pt-2">
                        <div class="relative flex-1">
                            <span class="absolute left-3 top-3 text-gray-400 text-xs font-mono">$</span>
                            <input type="number" id="precio-oferta-${viaje.id}" placeholder="Tu tarifa" min="100" step="50" class="w-full bg-appDark border border-appBorder rounded-xl p-2.5 pl-7 text-xs focus:outline-none focus:border-appYellow text-white font-mono">
                        </div>
                        <button onclick="postularseAViaje('${viaje.id}')" class="bg-appYellow text-black font-black px-4 py-2.5 rounded-xl text-xs hover:bg-yellow-400 transition uppercase tracking-widest shadow-neon-sm">
                            Ofrecer Tarifa
                        </button>
                    </div>
                ` : `
                    <div class="bg-appDark p-3 rounded-xl border border-appBorder text-xs font-mono text-gray-300 flex justify-between items-center">
                        <span>Oferta enviada: <b class="text-green-400">$${postulacionPropia.precioOferta}</b></span>
                        <span class="text-[10px] text-appYellow italic">Esperando respuesta del pasajero</span>
                    </div>
                `}
            `;
            listaViajes.appendChild(card);
        });
    }

    if (viajePorCalificar && !viajeParaCalificarId) {
        viajeParaCalificarId = viajePorCalificar.id;
        document.getElementById('modal-titulo-calificacion').textContent = "Calificar al Pasajero";
        document.getElementById('modal-sub-calificacion').textContent = "¿Cómo fue la conducta del pasajero durante el trayecto?";
        document.getElementById('modal-calificacion').classList.remove('hidden');
    }
}

async function postularseAViaje(viajeId) {
    if (!userData || !userData.vehiculo) {
        alert("Atención: Por favor completá los datos de tu vehículo.");
        return;
    }

    const inputPrecio = document.getElementById(`precio-oferta-${viajeId}`);
    const precio = inputPrecio ? parseFloat(inputPrecio.value) : 0;

    if (!precio || precio <= 0) {
        alert("Ingresá un precio válido para tu oferta de viaje.");
        return;
    }

    const repConductor = (userData.reputacion_cantidad > 0)
        ? (userData.reputacion_suma / userData.reputacion_cantidad).toFixed(1) 
        : '5.0';

    const nuevaPostulacion = {
        conductorId: currentUser.id,
        conductorEmail: currentUser.email,
        conductorNombre: `${userData.nombre} ${userData.apellido}`,
        conductorVehiculo: userData.vehiculo,
        conductorPatente: userData.patente,
        conductorReputacion: repConductor,
        conductorViajesCount: userData.reputacion_cantidad || 0,
        precioOferta: precio
    };

    try {
        const { data: viajeActual } = await supabaseClient.from('viajes').select('postulaciones').eq('id', viajeId).single();
        const postulacionesActuales = viajeActual?.postulaciones || [];
        postulacionesActuales.push(nuevaPostulacion);

        const { error } = await supabaseClient.from('viajes').update({
            postulaciones: postulacionesActuales
        }).eq('id', viajeId);

        if (error) throw error;
    } catch (error) {
        alert("Error al enviar oferta: " + error.message);
    }
}

async function actualizarEstadoViaje(viajeId, nuevoEstado) {
    try {
        const { error } = await supabaseClient.from('viajes').update({ estado: nuevoEstado }).eq('id', viajeId);
        if (error) throw error;
    } catch (error) {
        alert("Error al actualizar el viaje: " + error.message);
    }
}

async function cargarHistorialConductor() {
    const { data: viajes, error } = await supabaseClient
        .from('viajes')
        .select('*')
        .eq('conductor_id', currentUser.id)
        .eq('estado', 'finalizado');

    const historialDiv = document.getElementById('historial-conductor');
    historialDiv.innerHTML = '';

    if (error || !viajes || viajes.length === 0) {
        historialDiv.innerHTML = `<p class="text-xs text-gray-500 font-mono">Aún no completaste ningún viaje.</p>`;
        return;
    }

    viajes.forEach(v => {
        const card = document.createElement('div');
        card.className = "bg-appDark p-3.5 rounded-2xl border border-appBorder text-xs flex justify-between items-center font-mono";
        card.innerHTML = `<div><p class="font-bold text-gray-200">📍 ${v.origen} ➔ ${v.destino}</p><span class="text-appYellow">Evaluación: ★ ${v.calificacion_conductor || 'Pendiente'}</span></div><span class="font-bold text-green-400">+$${v.precio_acordado || '-'}</span>`;
        historialDiv.appendChild(card);
    });
}

// --- CHAT EN TIEMPO REAL ---
async function activarEscuchaChat(viajeId) {
    if (realtimeChatChannel) { supabaseClient.removeChannel(realtimeChatChannel); realtimeChatChannel = null; }

    const { data: mensajesIniciales } = await supabaseClient
        .from('mensajes')
        .select('*')
        .eq('viaje_id', viajeId)
        .order('created_at', { ascending: true });

    renderMensajesChat(mensajesIniciales || []);

    realtimeChatChannel = supabaseClient
        .channel('chat-viaje-' + viajeId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `viaje_id=eq.${viajeId}` }, payload => {
            renderMensajesChatAppend(payload.new);
        })
        .subscribe();
}

function renderMensajesChat(mensajes) {
    const chatPasajero = document.getElementById('chat-mensajes-pasajero');
    const chatConductor = document.getElementById('chat-mensajes-conductor');
    
    let html = '';
    mensajes.forEach(m => {
        const esMio = m.sender_id === currentUser.id;
        html += `<div class="${esMio ? 'text-right' : 'text-left'}"><span class="inline-block bg-appGray/90 border border-appBorder px-3 py-1.5 rounded-xl text-[11px] my-1"><b class="text-appYellow">${m.sender_email ? m.sender_email.split('@')[0] : 'Usuario'}:</b> ${m.texto}</span></div>`;
    });

    if (chatPasajero) { chatPasajero.innerHTML = html; chatPasajero.scrollTop = chatPasajero.scrollHeight; }
    if (chatConductor) { chatConductor.innerHTML = html; chatConductor.scrollTop = chatConductor.scrollHeight; }
}

function renderMensajesChatAppend(m) {
    const chatPasajero = document.getElementById('chat-mensajes-pasajero');
    const chatConductor = document.getElementById('chat-mensajes-conductor');
    
    const esMio = m.sender_id === currentUser.id;
    const html = `<div class="${esMio ? 'text-right' : 'text-left'}"><span class="inline-block bg-appGray/90 border border-appBorder px-3 py-1.5 rounded-xl text-[11px] my-1"><b class="text-appYellow">${m.sender_email ? m.sender_email.split('@')[0] : 'Usuario'}:</b> ${m.texto}</span></div>`;

    if (chatPasajero) { chatPasajero.innerHTML += html; chatPasajero.scrollTop = chatPasajero.scrollHeight; }
    if (chatConductor) { chatConductor.innerHTML += html; chatConductor.scrollTop = chatConductor.scrollHeight; }
}

async function enviarMensajeChat(e, rol) {
    e.preventDefault();
    const inputId = rol === 'pasajero' ? 'input-chat-pasajero' : 'input-chat-conductor';
    const input = document.getElementById(inputId);
    const texto = input ? input.value.trim() : '';
    
    if (!texto || !viajeActivoId) return;

    try {
        await supabaseClient.from('mensajes').insert([{
            viaje_id: viajeActivoId,
            sender_id: currentUser.id,
            sender_email: currentUser.email,
            texto
        }]);
        if (input) input.value = '';
    } catch (error) {
        alert("Fallo al enviar el mensaje.");
    }
}

// --- CALIFICACIÓN Y REPUTACIÓN ---
function seleccionarEstrellas(val) {
    calificacionSeleccionada = val;
    const stars = document.querySelectorAll('#estrellas-container span');
    stars.forEach((s, idx) => {
        s.className = idx < val 
            ? "text-appYellow drop-shadow-[0_0_12px_rgba(255,230,0,0.6)]"
            : "text-gray-600";
    });
}

async function enviarCalificacion() {
    if (!viajeParaCalificarId) return;
    try {
        const { data: viajeData } = await supabaseClient.from('viajes').select('*').eq('id', viajeParaCalificarId).single();

        const campoAActualizar = currentRole === 'pasajero' 
            ? { calificacion_pasajero: calificacionSeleccionada } 
            : { calificacion_conductor: calificacionSeleccionada };
        
        await supabaseClient.from('viajes').update(campoAActualizar).eq('id', viajeParaCalificarId);

        const targetUserId = currentRole === 'pasajero' ? viajeData.conductor_id : viajeData.pasajero_id;
        
        if (targetUserId) {
            const { data: targetUser } = await supabaseClient.from('usuarios').select('*').eq('id', targetUserId).single();
            if (targetUser) {
                await supabaseClient.from('usuarios').update({
                    reputacion_suma: (targetUser.reputacion_suma || 0) + calificacionSeleccionada,
                    reputacion_cantidad: (targetUser.reputacion_cantidad || 0) + 1
                }).eq('id', targetUserId);
            }
        }
        
        document.getElementById('modal-calificacion').classList.add('hidden');
        viajeParaCalificarId = null;
        alert("¡Muchas gracias por calificar!");
    } catch (error) {
        alert("Error al guardar la calificación: " + error.message);
    }
}

// --- LÓGICA DE MAPAS CON LEAFLET ---
let map = null;
let marker = null;
let tipoUbicacionActual = null;
let latSeleccionada = null;
let lngSeleccionada = null;

function abrirMapa(tipo) {
    tipoUbicacionActual = tipo;
    const modal = document.getElementById('modal-mapa');
    const titulo = document.getElementById('titulo-modal-mapa');
    titulo.textContent = tipo === 'origen' ? 'Seleccionar Punto de Salida' : 'Seleccionar Destino Final';
    
    modal.classList.remove('hidden');

    const crespoCoords = [-31.7456, -60.3078];

    setTimeout(() => {
        if (!map) {
            map = L.map('map').setView(crespoCoords, 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            map.on('click', function(e) {
                latSeleccionada = e.latlng.lat;
                lngSeleccionada = e.latlng.lng;

                if (marker) {
                    marker.setLatLng(e.latlng);
                } else {
                    marker = L.marker(e.latlng).addTo(map);
                }
            });
        } else {
            map.invalidateSize();
            if (!marker) {
                map.setView(crespoCoords, 14);
            }
        }
    }, 200);
}

function cerrarMapa() {
    document.getElementById('modal-mapa').classList.add('hidden');
    latSeleccionada = null;
    lngSeleccionada = null;
}

async function confirmarUbicacionMapa() {
    if (!latSeleccionada || !lngSeleccionada) {
        alert("Por favor, hacé clic en el mapa para marcar una ubicación en Crespo.");
        return;
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latSeleccionada}&lon=${lngSeleccionada}&zoom=18&addressdetails=1`);
        const data = await response.json();
        
        let direccionTexto = data.display_name ? data.display_name.split(',')[0] : `Coordenadas: ${latSeleccionada.toFixed(4)}, ${lngSeleccionada.toFixed(4)}`;
        if (data.address && data.address.road) {
            direccionTexto = data.address.road + (data.address.house_number ? ' ' + data.address.house_number : '');
        }

        document.getElementById(tipoUbicacionActual).value = direccionTexto;
    } catch (err) {
        document.getElementById(tipoUbicacionActual).value = `Crespo (CP 3116) - [${latSeleccionada.toFixed(4)}, ${lngSeleccionada.toFixed(4)}]`;
    }

    cerrarMapa();
}
