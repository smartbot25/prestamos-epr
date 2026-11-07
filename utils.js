const $ = s => document.querySelector(s);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const S = n => 'S/ ' + (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hoy = () => new Date().toLocaleDateString('en-CA');
const mes = () => hoy().slice(0, 7);
const addDays = (d, n) => { const x = new Date(d + 'T00:00'); x.setDate(x.getDate() + n); return x.toLocaleDateString('en-CA'); };
const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tipoTxt = t => t === 'gar' ? 'Con garantía' : t === 'ref' ? 'Con referencia' : 'Sin garantía';
const ESTADO = { pagado: ['ok', 'Pagado'], atrasado: ['bad', 'Atrasado'], activo: ['info', 'Vigente'], cerrado: ['info', 'Cerrado'] };
const badgeEst = l => { const [k, t] = ESTADO[DB.estado(l)]; return `<span class="badge ${k}">${t}</span>`; };
const stat = (bg, icon, color, label, value) => `<div class="stat" style="background:${bg}"><i data-lucide="${icon}" style="color:${color}"></i><b>${value}</b><span>${label}</span></div>`;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); }
function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`; m.classList.add('show'); if (window.lucide) lucide.createIcons(); }
function closeModal() { $('#modal').classList.remove('show'); }
