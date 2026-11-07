let vista = 'inicio';
const VIEWS = { inicio: viewInicio, nuevo: viewNuevo, clientes: viewClientes, garantias: viewGarantias, cobros: viewCobros,
  ventas: viewVentas, reportes: viewReportes, historial: viewHistorial, config: viewConfig, ayuda: viewAyuda };
const TITULO = { inicio: 'Mi Préstamos', nuevo: 'Nuevo Préstamo', clientes: 'Clientes', garantias: 'Garantías', cobros: 'Cobros',
  ventas: 'Ventas', reportes: 'Reportes', historial: 'Historial', config: 'Configuración', ayuda: 'Ayuda' };
const BOTTOM = [['inicio', 'house', 'Inicio'], ['historial', 'history', 'Historial'], ['config', 'settings', 'Configuración'], ['ayuda', 'circle-help', 'Ayuda']];
const SIDE = [['inicio', 'house', 'Inicio'], ['nuevo', 'circle-plus', 'Nuevo Préstamo'], ['clientes', 'users', 'Clientes'], ['garantias', 'shield-check', 'Garantías'],
  ['cobros', 'calendar-clock', 'Cobros'], ['ventas', 'shopping-cart', 'Ventas'], ['reportes', 'chart-no-axes-combined', 'Reportes'], ['config', 'settings', 'Configuración']];

function go(v) { vista = v; document.body.classList.remove('menu-open'); render(); window.scrollTo(0, 0); }

function render() {
  $('#title').textContent = TITULO[vista];
  $('#view').innerHTML = VIEWS[vista]();
  $('#bottomNav').innerHTML = BOTTOM.map(([k, i, t]) => `<button class="${vista === k ? 'on' : ''}" onclick="go('${k}')"><i data-lucide="${i}"></i>${t}</button>`).join('');
  $('#sideNav').innerHTML = SIDE.map(([k, i, t]) => `<button class="${vista === k ? 'on' : ''}" onclick="go('${k}')"><i data-lucide="${i}"></i>${t}</button>`).join('');
  if (vista === 'nuevo') calcN();
  if (window.lucide) lucide.createIcons();
}

function viewInicio() {
  const D = DB.get(), L = D.prestamos;
  const act = L.filter(l => ['activo', 'atrasado'].includes(DB.estado(l)));
  const prestado = L.reduce((s, l) => s + l.monto, 0);
  const cobradoMes = D.pagos.filter(p => (p.fecha || '').slice(0, 7) === mes()).reduce((s, p) => s + p.monto, 0);
  const pendiente = act.reduce((s, l) => s + DB.pend(l), 0);
  const gastosMes = (D.gastos || []).filter(g => (g.fecha || '').slice(0, 7) === mes()).reduce((s, g) => s + g.monto, 0);
  const prox = [...act].sort((a, b) => a.vence.localeCompare(b.vence)).slice(0, 4);
  const quick = [['nuevo', 'hand-coins', 'Nuevo Préstamo', '#0756C9'], ['clientes', 'users', 'Clientes', '#149653'], ['garantias', 'shield-check', 'Garantías', '#7650C8'],
    ['cobros', 'calendar-clock', 'Cobros', '#F28B22'], ['ventas', 'shopping-cart', 'Ventas', '#0CA99A'], ['reportes', 'chart-no-axes-combined', 'Reportes', '#2C5FB3']];
  const filas = prox.map(l => `<div class="list-item"><div class="avatar sm"><i data-lucide="user"></i></div>
    <div class="grow"><b>${esc(DB.cli(l.cliente).nombre)}</b><small>${tipoTxt(l.tipo)} · vence ${fmt(l.vence)}</small>
    <div class="row" style="margin-top:8px;flex-wrap:wrap"><button class="btn-line" onclick="detalle('${l.id}')">Ver detalle</button>
    <button class="btn-primary sm" onclick="pagar('${l.id}')">Cobrar</button>
    <a class="btn-wa" style="flex:0;padding:8px 10px;font-size:13px" href="${linkAviso(l)}" target="_blank" rel="noopener">Aviso</a></div></div>
    <div class="col-end"><span class="amt-s">${S(DB.pend(l))}</span>${badgeEst(l)}</div></div>`).join('');
  return `
  <div class="card user-card"><div class="avatar lg"><i data-lucide="user-round"></i></div>
    <div class="grow"><b>${esc(D.config.nombre)}</b><small>Mi aplicación personal</small></div><span class="badge ok">Activo</span></div>
  <div class="grid2">
    ${stat('#E5EEFF', 'wallet', '#0756C9', 'Capital prestado', S(prestado))}
    ${stat('#dff5ea', 'check-circle', '#149653', 'Cobrado', S(cobradoMes))}
    ${stat('#fff0e0', 'clock', '#F28B22', 'Pendiente', S(pendiente))}
    ${stat('#EEE8FB', 'shield-check', '#7650C8', 'Clientes', D.clientes.length)}
  </div>
  <h3>Resumen de este mes <a class="link" onclick="go('reportes')">Ver detalle →</a></h3>
  <div class="grid2"><div class="chip ok">Ingresos ${S(cobradoMes)}</div><div class="chip bad">Gastos ${S(gastosMes)}</div></div>
  <div class="grid3">${quick.map(([k, ic, t, c]) => `<button class="quick" style="background:${c}" onclick="go('${k}')"><i data-lucide="${ic}"></i><span>${t}</span></button>`).join('')}</div>
  <div class="card"><h4><i data-lucide="calendar-days"></i>Próximos vencimientos <a class="link" style="margin-left:auto" onclick="go('cobros')">Ver todos →</a></h4>
    ${filas || '<p class="muted pad">No hay préstamos activos.</p>'}</div>`;
}

function detalle(id) {
  const l = DB.get().prestamos.find(x => x.id === id), c = DB.cli(l.cliente);
  openModal(`<h2>${esc(c.nombre)}</h2><p class="muted">${tipoTxt(l.tipo)}${l.art ? ' · ' + esc(l.art) : ''}</p>
    <div class="row-line"><span>Capital</span><b>${S(l.monto)}</b></div>
    <div class="row-line"><span>Interés (${l.tasa}%)</span><b>${S(l.monto * l.tasa / 100)}</b></div>
    <div class="row-line"><span>Total a devolver</span><b>${S(DB.tot(l))}</b></div>
    <div class="row-line"><span>Pagado</span><b>${S(DB.pag(l))}</b></div>
    <div class="row-line"><span>Pendiente</span><b>${S(DB.pend(l))}</b></div>
    <div class="row-line" style="border:0"><span>Vence</span><b>${fmt(l.vence)}</b></div>
    ${l.obs ? `<p class="muted">${esc(l.obs)}</p>` : ''}
    <div class="btn-row"><button class="btn-gray" onclick="closeModal()">Cerrar</button><button class="btn-primary" onclick="closeModal();pagar('${id}')">Registrar pago</button></div>`);
}

function viewHistorial() {
  const D = DB.get();
  const filas = [...D.pagos].reverse().map(p => {
    const l = D.prestamos.find(x => x.id === p.prest), nombre = l ? DB.cli(l.cliente).nombre : '(eliminado)';
    return `<div class="list-item"><div class="avatar sm"><i data-lucide="check"></i></div>
      <div class="grow"><b>${esc(nombre)}</b><small>${fmt(p.fecha)} · ${esc(p.via || '')}</small></div><span class="amt-s good">${S(p.monto)}</span></div>`;
  }).join('');
  return `<div class="card list">${filas || '<p class="muted pad">Sin pagos registrados.</p>'}</div>`;
}

function viewAyuda() {
  return `<div class="card"><h4><i data-lucide="circle-help"></i>Cómo usar la aplicación</h4>
    <p>1. Registre primero sus clientes en la sección Clientes.</p>
    <p>2. En Nuevo Préstamo elija la modalidad, ingrese el monto y revise el total a devolver.</p>
    <p>3. En Cobros registre cada pago o envíe un aviso por WhatsApp.</p>
    <p>4. En Configuración exporte una copia de seguridad con frecuencia.</p>
    <p class="muted">Sus datos se guardan en este navegador. Si borra los datos del navegador, se pierden si no tiene una copia.</p></div>`;
}

render();
