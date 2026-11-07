function viewConfig() {
  const D = DB.get(), c = D.config;
  return `<div class="card"><div class="field"><label>Nombre del prestamista</label><input value="${esc(c.nombre)}" onchange="cfg('nombre',this.value)"></div>
    <div class="grid2" style="margin-bottom:0"><div class="field"><label>Tasa por defecto (%)</label><input type="number" step="0.1" min="0" value="${c.tasa}" onchange="cfg('tasa',+this.value||0)"></div>
    <div class="field"><label>Plazo por defecto (días)</label><input type="number" min="1" value="${c.plazo}" onchange="cfg('plazo',+this.value||7)"></div></div>
    <p class="muted">Verifique que la tasa esté dentro del límite legal aplicable.</p></div>
    <div class="card"><h4><i data-lucide="database-backup"></i>Copias de seguridad</h4>
    <p class="muted">Última copia: ${D.ultimaCopia ? fmt(D.ultimaCopia.slice(0, 10)) : 'nunca'}</p>
    <button class="btn-primary" onclick="exportarJSON()"><i data-lucide="cloud-download"></i>Exportar copia (JSON)</button>
    <div class="field" style="margin-top:14px"><label>Restaurar desde archivo (reemplaza los datos actuales)</label><input type="file" accept=".json,application/json" onchange="importarJSON(event)"></div></div>`;
}
function cfg(k, v) { DB.get().config[k] = v; DB.save(); toast('Guardado'); }
function descargar(nombre, tipo, contenido) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
}
function exportarJSON() {
  DB.get().ultimaCopia = new Date().toISOString(); DB.save();
  const D = DB.get();
  descargar('mis-prestamos-' + hoy() + '.json', 'application/json',
    JSON.stringify({ app: 'mis-prestamos', version: 1, clientes: D.clientes, prestamos: D.prestamos, pagos: D.pagos, gastos: D.gastos, config: D.config, ultimaCopia: D.ultimaCopia }, null, 2));
  go('config');
}
function importarJSON(ev) {
  const f = ev.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    let d; try { d = JSON.parse(r.result); } catch (e) { return toast('El archivo no es válido'); }
    if (d.app !== 'mis-prestamos' || !Array.isArray(d.clientes) || !Array.isArray(d.prestamos) || !Array.isArray(d.pagos)) return toast('La copia no tiene el formato esperado');
    if (!confirm('Esto reemplazará los datos actuales. ¿Continuar?')) return;
    DB.replace(d); toast('Datos restaurados'); go('inicio');
  };
  r.readAsText(f);
}
function exportarCSV() {
  const D = DB.get();
  const filas = [['cliente', 'tipo', 'monto', 'tasa', 'vence', 'pagado', 'pendiente', 'estado']]
    .concat(D.prestamos.map(l => [DB.cli(l.cliente).nombre, tipoTxt(l.tipo), l.monto, l.tasa, l.vence, DB.pag(l).toFixed(2), DB.pend(l).toFixed(2), DB.estado(l)]));
  const csv = filas.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  descargar('prestamos-' + hoy() + '.csv', 'text/csv', '\ufeff' + csv);
}
