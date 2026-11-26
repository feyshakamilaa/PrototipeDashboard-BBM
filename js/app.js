(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const BLN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const BLN_P = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const nf = (v, d = 0) => new Intl.NumberFormat('id-ID', {minimumFractionDigits: d, maximumFractionDigits: d}).format(v);
const kl = v => v >= 1e6 ? nf(v / 1e6, 2) + ' juta KL' : nf(v) + ' KL';
const rp = v => v >= 1e12 ? 'Rp ' + nf(v / 1e12, 2) + ' triliun' : v >= 1e9 ? 'Rp ' + nf(v / 1e9, 2) + ' miliar' : 'Rp ' + nf(v);
const pct = (v, d = 2) => nf(v, d) + '%';
const sum = (r, k) => r.reduce((a, x) => a + x[k], 0);
const per = r => BLN[r.bulan - 1] + ' ' + r.tahun;
const lab = r => BLN[r.bulan - 1] + ' ' + String(r.tahun).slice(2);
const C = {navy: '#1e3a8a', blue: '#3b82f6', sky: '#93c5fd', teal: '#14b8a6', amber: '#f59e0b', red: '#ef4444'};
const PAL = [C.navy, C.blue, C.sky, C.teal, C.amber];
const PROD = [['biosolar','Biosolar'],['pertalite','Pertalite'],['pertamax','Pertamax'],['dexlite','Dexlite'],['avtur','Avtur']];
const PROV = [['jawa_timur','Jawa Timur'],['bali','Bali'],['ntb','NTB'],['ntt','NTT']];
const TITLES = {
  overview: ['Overview', 'Ringkasan operasional BBM Regional Jatimbalinus'],
  stok: ['Stok & Penerimaan', 'Pergerakan penerimaan, stok, dan kuota BBM'],
  penyaluran: ['Analisis Penyaluran', 'Penyaluran menurut produk, provinsi, dan target'],
  biaya: ['Susut & Biaya', 'Susut BBM dan biaya logistik distribusi']
};
let DATA, S = {y: 'all', m: 'all', p: 'overview'};
const CH = {};

Chart.defaults.font.family = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.color = '#64748b';

const rows = () => DATA.rows.filter(r => (S.y === 'all' || r.tahun == S.y) && (S.m === 'all' || r.bulan == S.m));
const bar = (l, d, c) => ({label: l, data: d, backgroundColor: c, borderRadius: 4, maxBarThickness: 34});
const ln = (l, d, c, x = {}) => ({type: 'line', label: l, data: d, borderColor: c, backgroundColor: c + '22', tension: .35, borderWidth: 2, pointRadius: d.length > 24 ? 0 : 3, pointHoverRadius: 5, ...x});
const yax = (t, yt, x = {}) => ({beginAtZero: true, grid: {color: '#eef0f5'}, border: {display: false}, ticks: {callback: t}, title: {display: true, text: yt}, ...x});
const xax = (st) => ({stacked: !!st, grid: {display: false}, ticks: {maxTicksLimit: 12, maxRotation: 0, autoSkip: true}});

function mk(id, type, labels, sets, o = {}) {
  CH[id]?.destroy();
  const pie = type === 'doughnut', f = o.f || nf;
  CH[id] = new Chart($('#' + id), {
    type, data: {labels, datasets: sets},
    options: {
      responsive: true, maintainAspectRatio: false, animation: {duration: 450}, cutout: pie ? '62%' : undefined,
      interaction: {mode: pie ? 'nearest' : 'index', intersect: pie},
      plugins: {
        legend: {position: 'bottom', labels: {usePointStyle: true, boxWidth: 8, padding: 16}},
        tooltip: {backgroundColor: '#0f172a', padding: 10, cornerRadius: 8, boxPadding: 4,
          callbacks: {label: c => ` ${pie ? c.label : c.dataset.label}: ${(c.dataset.f || f)(pie ? c.parsed : c.parsed.y)}`}}
      },
      scales: pie ? {} : o.sc || {x: xax(o.st), y: yax(o.t || (v => nf(v / 1e3)), o.yt || 'Ribu KL', {stacked: !!o.st})}
    }
  });
}

const kpiHTML = a => a.map(([l, v, s]) => `<div class="kpi"><div class="kl">${l}</div><div class="kv">${v}</div><div class="ks">${s}</div></div>`).join('');
const tbl = (h, r) => `<table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${r.map(x => `<tr>${x.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const pill = s => `<span class="pill ${s}">${s}</span>`;
const share = (v, t) => pct(v / t * 100, 1);
const byYear = rs => [...new Set(rs.map(r => r.tahun))].map(y => [y, rs.filter(r => r.tahun === y)]);

function ctx(rs) {
  const L = rs.at(-1), t = {
    pn: sum(rs, 'total_penerimaan_kl'), py: sum(rs, 'total_penyaluran_kl'), su: sum(rs, 'total_susut_kl'), bi: sum(rs, 'total_biaya_logistik_rp')};
  t.cov = L.stok_akhir_kl / (L.total_penyaluran_kl / L.hari);
  t.bpl = t.bi / (t.py * 1000);
  t.rng = rs.length > 1 ? per(rs[0]) + ' – ' + per(L) : per(L);
  return {L, t};
}

const PAGES = {
  overview(rs) {
    const {L, t} = ctx(rs);
    $('#k-ov').innerHTML = kpiHTML([
      ['Total Penerimaan BBM', kl(t.pn), t.rng],
      ['Total Penyaluran BBM', kl(t.py), t.rng],
      ['Stok Akhir', kl(L.stok_akhir_kl), `Posisi ${per(L)} · ${pill(L.status_stok)}`],
      ['Ketahanan Stok (Coverage Days)', nf(t.cov, 1) + ' hari', 'Stok akhir ÷ rata-rata penyaluran harian bulan terakhir'],
      ['Persentase Susut', pct(t.su / t.pn * 100, 3), `${nf(t.su)} KL dari total penerimaan`],
      ['Total Biaya Logistik', rp(t.bi), t.rng]]);
    mk('c-ov', 'line', rs.map(lab), [ln('Penerimaan', rs.map(r => r.total_penerimaan_kl), C.navy, {fill: true}), ln('Penyaluran', rs.map(r => r.total_penyaluran_kl), C.blue)], {f: kl});
  },
  stok(rs) {
    mk('c-terima', 'bar', rs.map(lab), [bar('Penerimaan', rs.map(r => r.total_penerimaan_kl), C.navy), bar('Penyaluran', rs.map(r => r.total_penyaluran_kl), C.sky)], {f: kl});
    mk('c-stok', 'line', rs.map(lab), [
      ln('Stok akhir', rs.map(r => r.stok_akhir_kl), C.navy, {fill: true, f: kl, yAxisID: 'y'}),
      ln('Ketahanan stok', rs.map(r => r.stok_akhir_kl / (r.total_penyaluran_kl / r.hari)), C.amber, {yAxisID: 'y1', borderDash: [5, 4], f: v => nf(v, 1) + ' hari'})],
      {sc: {x: xax(), y: yax(v => nf(v / 1e3), 'Ribu KL'), y1: yax(v => nf(v), 'Hari', {position: 'right', grid: {display: false}})}});
    mk('c-komp', 'doughnut', PROD.map(p => p[1]), [{data: PROD.map(p => sum(rs, `penerimaan_${p[0]}_kl`)), backgroundColor: PAL, borderWidth: 2, f: kl}]);
    const cnt = s => rs.filter(r => r.status_stok === s).length, L = rs.at(-1);
    $('#st').innerHTML = `<span class="m">Status terakhir (${per(L)}): ${pill(L.status_stok)}</span>` +
      ['Aman', 'Siaga', 'Kritis'].map(s => `<span class="pill ${s}">${s}: ${cnt(s)} bulan</span>`).join('');
    const q = (n, k, q1, r1) => { const a = sum(rs, q1), b = sum(rs, r1); return [n, kl(a), kl(b), pct(b / a * 100, 1)]; };
    $('#t-kuota').innerHTML = tbl(['Jenis', 'Kuota', 'Realisasi', 'Pemakaian'], [
      q('Biosolar (JBT)', 0, 'kuota_biosolar_jbt_kl', 'realisasi_biosolar_jbt_kl'),
      q('Pertalite (JBKP)', 0, 'kuota_pertalite_jbkp_kl', 'realisasi_pertalite_jbkp_kl')]);
  },
  penyaluran(rs) {
    const py = sum(rs, 'total_penyaluran_kl');
    mk('c-prod', 'bar', PROD.map(p => p[1]), [{...bar('Penyaluran', PROD.map(p => sum(rs, `penyaluran_${p[0]}_kl`)), PAL), f: kl}], {t: v => nf(v / 1e3), yt: 'Ribu KL', f: kl});
    mk('c-prov', 'bar', PROV.map(p => p[1]), [{...bar('Penyaluran', PROV.map(p => sum(rs, `penyaluran_${p[0]}_kl`)), PAL), f: kl}], {f: kl});
    const ys = byYear(rs);
    mk('c-thn', 'bar', ys.map(y => y[0]), [bar('Realisasi', ys.map(y => sum(y[1], 'total_penyaluran_kl')), C.navy), bar('Target', ys.map(y => sum(y[1], 'target_penyaluran_kl')), C.slate || '#cbd5e1')],
      {t: v => nf(v / 1e6, 1), yt: 'Juta KL', f: kl});
    mk('c-tgt', 'line', rs.map(lab), [ln('Realisasi', rs.map(r => r.total_penyaluran_kl), C.navy, {fill: true}), ln('Target', rs.map(r => r.target_penyaluran_kl), C.amber, {borderDash: [5, 4]})], {f: kl});
    const pr = PROD.map(p => { const v = sum(rs, `penyaluran_${p[0]}_kl`); return ['Produk', p[1], kl(v), share(v, py)]; });
    const pv = PROV.map(p => { const v = sum(rs, `penyaluran_${p[0]}_kl`); return ['Provinsi', p[1], kl(v), share(v, py)]; });
    const tg = sum(rs, 'target_penyaluran_kl');
    $('#t-dist').innerHTML = tbl(['Kelompok', 'Nama', 'Volume', 'Pangsa'], [...pr, ...pv, ['<b>Total</b>', `Capaian target ${pct(py / tg * 100, 1)}`, `<b>${kl(py)}</b>`, '100%']]);
  },
  biaya(rs) {
    const {t} = ctx(rs), b = k => sum(rs, k);
    $('#k-bi').innerHTML = kpiHTML([
      ['Total Susut BBM', kl(t.su), t.rng],
      ['Persentase Susut', pct(t.su / t.pn * 100, 3), 'Total susut ÷ total penerimaan'],
      ['Biaya Distribusi per Liter', 'Rp ' + nf(t.bpl, 1), 'Total biaya logistik ÷ total penyaluran']]);
    const SU = [['r1', 'R1', C.navy], ['r3', 'R3', C.blue], ['r4', 'R4', C.sky]];
    mk('c-susut', 'bar', rs.map(lab), SU.map(s => bar('Susut ' + s[1], rs.map(r => r['susut_' + s[0] + '_kl']), s[2])), {st: 1, t: v => nf(v), yt: 'KL', f: v => nf(v) + ' KL'});
    mk('c-susutp', 'doughnut', SU.map(s => 'Susut ' + s[1]), [{data: SU.map(s => b('susut_' + s[0] + '_kl')), backgroundColor: SU.map(s => s[2]), borderWidth: 2, f: v => nf(v) + ' KL'}]);
    const BI = [['handling', 'Handling', C.navy], ['transport', 'Transportasi', C.blue], ['pelabuhan', 'Pelabuhan', C.sky]];
    mk('c-biaya', 'bar', rs.map(lab), BI.map(s => bar(s[1], rs.map(r => r['biaya_' + s[0] + '_rp']), s[2])), {st: 1, t: v => nf(v / 1e9), yt: 'Miliar Rp', f: rp});
    mk('c-biayap', 'doughnut', BI.map(s => s[1]), [{data: BI.map(s => b('biaya_' + s[0] + '_rp')), backgroundColor: BI.map(s => s[2]), borderWidth: 2, f: rp}]);
    mk('c-bpl', 'line', rs.map(lab), [ln('Biaya per liter', rs.map(r => r.total_biaya_logistik_rp / (r.total_penyaluran_kl * 1000)), C.navy, {fill: true})], {t: v => nf(v), yt: 'Rp per liter', f: v => 'Rp ' + nf(v, 1) + ' / liter'});
    const m = v => nf(v / 1e9, 1);
    $('#t-biaya').innerHTML = tbl(['Tahun', 'Handling', 'Transportasi', 'Pelabuhan', 'Total', 'Rp/liter'], byYear(rs).map(([y, r]) => {
      const tot = sum(r, 'total_biaya_logistik_rp');
      return [y, m(sum(r, 'biaya_handling_rp')), m(sum(r, 'biaya_transport_rp')), m(sum(r, 'biaya_pelabuhan_rp')), `<b>${m(tot)}</b>`, nf(tot / (sum(r, 'total_penyaluran_kl') * 1000), 1)];
    }));
  }
};

function render() {
  $$('.page').forEach(e => e.classList.toggle('on', e.id === 'p-' + S.p));
  $$('.nav a').forEach(a => a.classList.toggle('on', a.dataset.p === S.p));
  $('#ttl').textContent = TITLES[S.p][0]; $('#stl').textContent = TITLES[S.p][1];
  PAGES[S.p](rows());
}
function go(p) { S.p = PAGES[p] ? p : 'overview'; document.body.classList.remove('open'); render(); }

function init(d) {
  DATA = d;
  const ys = [...new Set(d.rows.map(r => r.tahun))];
  $('#fy').innerHTML = '<option value="all">Semua tahun</option>' + ys.map(y => `<option>${y}</option>`).join('');
  $('#fm').innerHTML = '<option value="all">Semua bulan</option>' + BLN_P.map((b, i) => `<option value="${i + 1}">${b}</option>`).join('');
  $('#fy').onchange = e => { S.y = e.target.value; render(); };
  $('#fm').onchange = e => { S.m = e.target.value; render(); };
  $('#burger').onclick = () => document.body.classList.add('open');
  $('#scrim').onclick = () => document.body.classList.remove('open');
  window.addEventListener('hashchange', () => go(location.hash.slice(1)));
  go(location.hash.slice(1));
}

fetch('data/data.json').then(r => r.json()).catch(() => window.DATA_BBM).then(init);
})();
