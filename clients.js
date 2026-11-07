function viewClientes() {
  const D = DB.get();
  const rows = D.clientes.map(c => {
    const ls = D.prestamos.filter(l => l.cliente === c.id);
    const p = ls.reduce((s, l) => s + DB.pend(l), 0);
    const [k, t] = ls.some(l => DB.estado(l) === 'atrasado') ? ['bad', 'Atrasado'] : p > 0 ? ['warn', 'Pendiente'] : ls.length ? ['ok', 'Cumplido'] : ['info', 'Sin historial'];
    return `<div class="list-item" data-n="${esc(c.nombre.toLowerCase())}"><div class="avatar"><i data-lucide="user"></i></div>
      <div class="grow"><b>${esc(c.nombre)}</b><small>${esc(c.tel || 'Sin teléfono')} · Saldo ${S(p)}</small></div>
      <div class="col-end"><span class="badge ${k}">${t}</span><button class="btn-line" onclick="borrarCliente('${c.id}')">Eliminar</button></div></div>`;
  }).join('');
  return `<div class="search"><i data-lucide="search"></i><input placeholder="Buscar cliente..." oninput="filtrarClientes(this.value)"></div>
    <div class="row" style="justify-content:flex-end;margin-bottom:10px"><button class="btn-primary sm" onclick="formCliente()"><i data-lucide="plus"></i>Nuevo cliente</button></div>
    <div class="card list" id="listaClientes">${rows || '<p class="muted pad">Sin clientes todavía.</p>'}</div>`;
}
function filtrarClientes(q) {
  document.querySelectorAll('#listaClientes .list-item').forEach(el => {
    el.style.display = el.dataset.n.includes(q.trim().toLowerCase()) ? '' : 'none';
  });
}
function formCliente() {
  openModal(`<h2>Nuevo cliente</h2>
    <form onsubmit="guardarCliente(event)">
      <div class="field"><label>Nombre completo *</label><input name="n" required></div>
      <div class="field"><label>DNI</label><input name="dni" inputmode="numeric" maxlength="8"></div>
      <div class="field"><label>Teléfono</label><input name="tel" inputmode="tel"></div>
      <div class="field"><label>Tipo de cliente</label><select name="tipo"><option>Personal</option><option>Compañero de trabajo</option><option>Amigo o conocido</option></select></div>
      <div class="field"><label>Observaciones</label><textarea name="obs" rows="2"></textarea></div>
      <button class="btn-primary">Guardar cliente</button>
    </form>`);
}
function guardarCliente(e) {
  e.preventDefault();
  const f = e.target;
  const nombre = f.n.value.trim();
  if (!nombre) return toast('Ingrese el nombre');
  DB.get().clientes.push({ id: uid(), nombre, dni: f.dni.value.trim(), tel: f.tel.value.trim(), tipo: f.tipo.value, obs: f.obs.value.trim() });
  DB.save(); closeModal(); toast('Cliente registrado'); go('clientes');
}
function borrarCliente(id) {
  if (DB.get().prestamos.some(l => l.cliente === id)) return toast('El cliente tiene préstamos y no puede eliminarse');
  if (!confirm('¿Eliminar este cliente?')) return;
  DB.get().clientes = DB.get().clientes.filter(c => c.id !== id);
  DB.save(); go('clientes');
}
