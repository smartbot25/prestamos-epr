let tipoN = 'sin', tabG = 'custodia', tabC = 'pen';

function linkAviso(l) {
  const c = DB.cli(l.cliente), p = DB.pend(l);
  const msg = encodeURIComponent(`Hola, ${c.nombre}.\n\nTe recuerdo que tu préstamo tiene un vencimiento programado para el ${fmt(l.vence)}.\n\nEl importe pendiente es de S/ ${p.toFixed(2)}.\n\nPor favor, comunícame si realizarás el pago en la fecha acordada.\n\nGracias.`);
  return `https://wa.me/${(c.tel || '').replace(/\D/g, '')}?text=${msg}`;
}

function viewNuevo() {
  const D = DB.get();
  const cs = D.clientes.map(c => `<option value="${c.id}">${esc(c.nombre)}</option>`).join('');
  const modos = [['sin', 'user', 'Sin garantía', 'Personal'], ['gar', 'shield-check', 'Con garantía', ''], ['ref', 'handshake', 'Con referencia', '']]
    .map(([k, ic, t, s]) => `<button class="mode ${tipoN === k ? 'on' : ''}" onclick="tipoN='${k}';go('nuevo')"><i data-lucide="${ic}"></i>${t}${s ? `<small>${s}</small>` : ''}</button>`).join('');
  const extra = tipoN === 'gar' ? `<div class="sec"><h4><i data-lucide="smartphone"></i>Datos del producto</h4>
      <div class="field"><label>Artículo *</label><input name="art" required placeholder="Ej: Samsung Galaxy A54"></div>
      <div class="grid2" style="margin-bottom:0"><div class="field"><label>Marca</label><input name="marca"></div><div class="field"><label>Modelo</label><input name="modelo"></div></div>
      <div class="field"><label>IMEI o serie</label><input name="serie"></div>
      <div class="field"><label>Estado</label><select name="estadoArt"><option>Buen estado</option><option>Regular</option><option>Con detalles</option></select></div>
      <div class="field"><label>Fotografía</label><input type="file" name="foto" accept="image/*" capture="environment"></div>
      <div class="grid2" style="margin-bottom:0"><div class="field"><label>Valor estimado (S/)</label><input name="valor" type="number" step="0.01" min="0" oninput="calcN()"></div>
      <div class="field"><label>% sobre el valor</label><input name="pct" type="number" value="60" oninput="calcN()"></div></div></div>`
    : tipoN === 'ref' ? `<div class="sec"><h4><i data-lucide="handshake"></i>Referencia</h4>
      <div class="field"><label>Persona que presenta o asume la obligación *</label><input name="referente" required></div>
      <div class="field"><label>Relación entre ambas personas</label><input name="relacion"></div>
      <p class="muted">Una referencia no es responsable de la deuda sin aceptación expresa y por escrito.</p></div>` : '';
  return `<div class="modes">${modos}</div>
  <form id="fNuevo" onsubmit="guardarPrestamo(event)">
    <div class="sec"><h4><i data-lucide="user"></i>Datos del cliente</h4>
      <div class="field"><label>Cliente *</label><select name="cliente" required>${cs || '<option value="">Registre un cliente primero</option>'}</select></div>
      <button type="button" class="btn-line" onclick="formCliente()"><i data-lucide="plus"></i>Registrar cliente</button></div>
    <div class="sec"><h4><i data-lucide="coins"></i>Monto y condiciones</h4>
      <div class="grid2"><div class="field"><label>Monto solicitado (S/) *</label><input name="monto" type="number" step="0.01" min="1" required oninput="calcN()"></div>
      <div class="field"><label>Tasa de interés (%)</label><input name="tasa" type="number" step="0.1" min="0" value="${D.config.tasa}" oninput="calcN()"></div></div>
      <div class="grid2"><div class="field"><label>Plazo de devolución</label><select name="dias" onchange="calcN()">${[7, 15, 30, 60].map(x => `<option value="${x}" ${x == D.config.plazo ? 'selected' : ''}>${x} días</option>`).join('')}</select></div>
      <div class="field"><label>Fecha de entrega</label><input name="entrega" type="date" value="${hoy()}" onchange="calcN()"></div></div></div>
    ${extra}
    <div class="field"><label>Observaciones (opcional)</label><textarea name="obs" rows="2" placeholder="Ej: Se compromete a pagar el lunes..."></textarea></div>
    <div class="calc" id="calc"></div>
    <div class="btn-row"><button type="button" class="btn-gray" onclick="go('inicio')">Cancelar</button><button class="btn-primary">Registrar préstamo</button></div>
  </form>`;
}

function calcN() {
  const f = $('#fNuevo'); if (!f || !f.monto) return;
  const m = +f.monto.value || 0, t = +f.tasa.value || 0, i = m * t / 100, dias = +f.dias.value;
  let extra = '';
  if (tipoN === 'gar' && f.valor) {
    const v = +f.valor.value || 0, p = +f.pct.value || 0;
    extra = `<div class="muted">Préstamo sugerido: <b>${S(v * p / 100)}</b> (${p}% de ${S(v)})</div>`;
  }
  $('#calc').innerHTML = `${extra}<div class="calc-total">Total a devolver</div><div class="calc-big">${S(m + i)}</div>
    <div class="muted">${S(m)} + ${S(i)} de interés · Vence el ${fmt(addDays(f.entrega.value, dias))}</div>`;
}

function guardarPrestamo(e) {
  e.preventDefault();
  const f = e.target;
  if (!f.cliente.value) return toast('Registre primero un cliente');
  const m = +f.monto.value;
  if (!(m > 0)) return toast('Monto no válido');
  const dias = +f.dias.value;
  const l = { id: uid(), cliente: f.cliente.value, tipo: tipoN, monto: m, tasa: +f.tasa.value || 0, dias,
    entrega: f.entrega.value, vence: addDays(f.entrega.value, dias), obs: f.obs.value.trim(), foto: null };
  const save = () => { DB.get().prestamos.push(l); DB.save(); tipoN = 'sin'; toast('Préstamo registrado'); go('inicio'); };
  if (tipoN === 'gar') {
    Object.assign(l, { art: f.art.value.trim(), marca: f.marca.value.trim(), modelo: f.modelo.value.trim(), serie: f.serie.value.trim(),
      estadoArt: f.estadoArt.value, valor: +f.valor.value || 0, gar: 'custodia' });
    const file = f.foto.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = () => { l.foto = r.result; save(); };
      r.readAsDataURL(file);
      return;
    }
  }
  if (tipoN === 'ref') Object.assign(l, { referente: f.referente.value.trim(), relacion: f.relacion.value.trim() });
  save();
}

function viewGarantias() {
  const g = DB.get().prestamos.filter(l => l.tipo === 'gar');
  const grupos = {
    custodia: g.filter(l => l.gar === 'custodia' && DB.estado(l) !== 'atrasado'),
    vencidas: g.filter(l => l.gar === 'custodia' && DB.estado(l) === 'atrasado'),
    devueltas: g.filter(l => l.gar === 'devuelto' || l.gar === 'vendido')
  };
  const tab = (k, t) => `<button class="tab ${tabG === k ? 'on' : ''}" onclick="tabG='${k}';go('garantias')">${t} (${grupos[k].length})</button>`;
  const items = grupos[tabG].map(l => `<div class="item-card"><div class="thumb">${l.foto ? `<img src="${l.foto}" alt="">` : '<i data-lucide="smartphone"></i>'}</div>
    <div class="grow"><b>${esc(l.art)}</b><small>Cliente: ${esc(DB.cli(l.cliente).nombre)}</small><small>Préstamo: ${S(l.monto)} · Vence ${fmt(l.vence)}</small></div>
    <div class="col-end">${badgeEst(l)}<button class="btn-line" onclick="accionGar('${l.id}')">Ver detalle</button></div></div>`).join('');
  return `<button class="btn-primary" style="margin-bottom:12px" onclick="tipoN='gar';go('nuevo')"><i data-lucide="circle-plus"></i>Registrar garantía (préstamo con artículo)</button>
    <div class="tabs">${tab('custodia', 'En custodia')}${tab('devueltas', 'Devueltas')}${tab('vencidas', 'Vencidas')}</div>
    ${items || '<p class="muted pad">No hay artículos en esta lista. Use el botón de arriba para registrar una garantía.</p>'}`;
}

function accionGar(id) {
  const l = DB.get().prestamos.find(x => x.id === id);
  const opts = [['custodia', 'En custodia'], ['ejecutada', 'En proceso de ejecución legal'], ['devuelto', 'Devuelto al cliente'], ['vendido', 'Vendido']]
    .map(([k, t]) => `<option value="${k}" ${l.gar === k ? 'selected' : ''}>${t}</option>`).join('');
  openModal(`<h2>${esc(l.art)}</h2><p class="muted">Préstamo ${S(l.monto)} · Vence ${fmt(l.vence)}</p>
    <form onsubmit="guardarGar(event,'${id}')">
      <div class="field"><label>Estado del artículo</label><select name="st">${opts}</select></div>
      <div class="field"><label>Precio de venta (S/), solo si se vendió</label><input name="pv" type="number" step="0.01" min="0" value="${l.pv || ''}"></div>
      <p class="muted">Marque "Vendido" solo después de completar la ejecución legal correspondiente.</p>
      <div class="btn-row"><button type="button" class="btn-gray" onclick="closeModal()">Cerrar</button><button class="btn-primary">Guardar</button></div>
    </form>`);
}
function guardarGar(e, id) {
  e.preventDefault();
  const l = DB.get().prestamos.find(x => x.id === id);
  l.gar = e.target.st.value; l.pv = +e.target.pv.value || 0;
  DB.save(); closeModal(); toast('Estado actualizado'); go(vista);
}

function viewCobros() {
  const L = DB.get().prestamos;
  const pe = L.filter(l => ['activo', 'atrasado'].includes(DB.estado(l))).sort((a, b) => a.vence.localeCompare(b.vence));
  const pa = L.filter(l => DB.estado(l) === 'pagado');
  const lista = tabC === 'pen' ? pe : pa;
  const totalP = pe.reduce((s, l) => s + DB.pend(l), 0);
  const cards = lista.map(l => {
    const c = DB.cli(l.cliente), at = DB.estado(l) === 'atrasado';
    const etiqueta = at ? '<span class="badge bad">Atrasado</span>' : DB.estado(l) === 'pagado' ? '<span class="badge ok">Pagado</span>' : '<span class="badge warn">Por vencer</span>';
    return `<div class="pay-card ${at ? 'late' : ''}">
      <div class="row"><div class="avatar sm"><i data-lucide="user"></i></div>
        <div class="grow"><b>${esc(c.nombre)}</b><small>Vence ${fmt(l.vence)} · Pagado ${S(DB.pag(l))} de ${S(DB.tot(l))}</small></div>
        <div class="col-end"><span class="amt-s">${S(DB.pend(l))}</span>${etiqueta}</div></div>
      ${tabC === 'pen' ? `<div class="btn-row"><a class="btn-wa" href="${linkAviso(l)}" target="_blank" rel="noopener"><i data-lucide="message-circle"></i>Enviar aviso</a>
        <button class="btn-primary sm" onclick="pagar('${l.id}')"><i data-lucide="check"></i>Registrar pago</button></div>` : ''}
    </div>`;
  }).join('');
  return `<div class="tabs"><button class="tab ${tabC === 'pen' ? 'on' : ''}" onclick="tabC='pen';go('cobros')">Pendientes (${pe.length})</button>
    <button class="tab ${tabC === 'pag' ? 'on' : ''}" onclick="tabC='pag';go('cobros')">Pagados (${pa.length})</button></div>
    ${cards || '<p class="muted pad">Nada que mostrar.</p>'}
    ${tabC === 'pen' ? `<div class="total-bar"><span>Total pendiente</span><b>${S(totalP)}</b></div>` : ''}`;
}

function pagar(id) {
  const l = DB.get().prestamos.find(x => x.id === id); if (!l) return;
  const p = DB.pend(l);
  openModal(`<h2>Registrar pago</h2><p class="muted">${esc(DB.cli(l.cliente).nombre)} · Pendiente ${S(p)}</p>
    <form onsubmit="guardarPago(event,'${id}')">
      <div class="field"><label>Importe recibido (S/) *</label><input name="m" type="number" step="0.01" min="0.01" value="${p.toFixed(2)}" required></div>
      <div class="field"><label>Fecha</label><input name="f" type="date" value="${hoy()}"></div>
      <div class="field"><label>Método de pago</label><select name="via"><option>Efectivo</option><option>Yape</option><option>Plin</option><option>Transferencia</option></select></div>
      <div class="field"><label>Observaciones</label><input name="obs"></div>
      <div class="btn-row"><button type="button" class="btn-gray" onclick="closeModal()">Cancelar</button><button class="btn-primary">Guardar pago</button></div>
    </form>`);
}
function guardarPago(e, id) {
  e.preventDefault();
  const f = e.target, l = DB.get().prestamos.find(x => x.id === id);
  const m = Math.round((+f.m.value) * 100) / 100;
  if (!(m > 0) || m > DB.pend(l) + 0.001) return toast('Importe no válido');
  DB.get().pagos.push({ id: uid(), prest: id, monto: m, fecha: f.f.value, via: f.via.value, obs: f.obs.value.trim() });
  DB.save(); closeModal(); toast('Pago registrado'); go(vista);
}

function viewVentas() {
  const g = DB.get().prestamos.filter(l => l.tipo === 'gar');
  const disp = g.filter(l => l.gar === 'ejecutada'), vend = g.filter(l => l.gar === 'vendido');
  const tv = vend.reduce((s, l) => s + (l.pv || 0), 0);
  const res = vend.reduce((s, l) => s + ((l.pv || 0) - l.monto), 0);
  const item = l => `<div class="item-card"><div class="thumb">${l.foto ? `<img src="${l.foto}" alt="">` : '<i data-lucide="smartphone"></i>'}</div>
    <div class="grow"><b>${esc(l.art)}</b><small>Préstamo ${S(l.monto)}${l.pv ? ` · Venta ${S(l.pv)}` : ''}</small></div>
    <button class="btn-line" onclick="accionGar('${l.id}')">Actualizar</button></div>`;
  return `<div class="grid2">${stat('#E5EEFF', 'package', '#0756C9', 'Disponibles', disp.length)}${stat('#E3F7F5', 'shopping-cart', '#0CA99A', 'Total vendido', S(tv))}</div>
    <div class="card-note">Resultado registrado: <b>${S(res)}</b>. Es el precio de venta menos el capital prestado. No incluye gastos.</div>
    <h3>Disponibles para venta</h3>${disp.map(item).join('') || '<p class="muted pad">Ningún artículo ejecutado.</p>'}
    <h3>Vendidos</h3>${vend.map(item).join('') || '<p class="muted pad">Sin ventas registradas.</p>'}`;
}

function viewReportes() {
  const D = DB.get(), L = D.prestamos;
  const prest = L.reduce((s, l) => s + l.monto, 0);
  const cobr = D.pagos.reduce((s, p) => s + p.monto, 0);
  const int = L.reduce((s, l) => s + l.monto * l.tasa / 100, 0);
  const venc = L.filter(l => DB.estado(l) === 'atrasado').length;
  const act = L.filter(l => ['activo', 'atrasado'].includes(DB.estado(l))).length;
  const pend = L.reduce((s, l) => s + DB.pend(l), 0);
  return `<div class="grid2">${stat('#E5EEFF', 'wallet', '#0756C9', 'Capital prestado', S(prest))}${stat('#dff5ea', 'check', '#149653', 'Cobrado', S(cobr))}
      ${stat('#fff0e0', 'percent', '#F28B22', 'Intereses pactados', S(int))}${stat('#fde3e6', 'alert-triangle', '#DC3545', 'Préstamos vencidos', venc)}</div>
    <div class="card"><div class="row-line"><span>Préstamos activos</span><b>${act}</b></div>
      <div class="row-line"><span>Total pendiente</span><b>${S(pend)}</b></div>
      <div class="row-line" style="border:0"><span>Clientes registrados</span><b>${D.clientes.length}</b></div></div>
    <button class="btn-primary" onclick="exportarCSV()"><i data-lucide="file-spreadsheet"></i>Exportar préstamos (CSV)</button>`;
}
