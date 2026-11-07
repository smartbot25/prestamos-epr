const DB = (() => {
  const KEY = 'mis-prestamos-v1';
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  d = d || { clientes: [], prestamos: [], pagos: [], gastos: [], config: { nombre: 'Edgar', tasa: 10, plazo: 7 }, ultimaCopia: null };
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(d)); return true; }
    catch (e) { toast('No se pudo guardar. Exporte una copia de seguridad.'); return false; }
  }
  return {
    get: () => d,
    save,
    replace(n) {
      d = { clientes: n.clientes, prestamos: n.prestamos, pagos: n.pagos, gastos: n.gastos || [], config: n.config || d.config, ultimaCopia: n.ultimaCopia || null };
      save();
    },
    tot: l => l.monto * (1 + l.tasa / 100),
    pag: l => d.pagos.filter(p => p.prest === l.id).reduce((s, p) => s + p.monto, 0),
    pend(l) { return Math.max(0, this.tot(l) - this.pag(l)); },
    estado(l) {
      if (l.gar === 'devuelto' || l.gar === 'vendido') return 'cerrado';
      if (this.pend(l) < 0.005) return 'pagado';
      return l.vence < hoy() ? 'atrasado' : 'activo';
    },
    cli: id => d.clientes.find(c => c.id === id) || { nombre: '(eliminado)', tel: '' }
  };
})();
