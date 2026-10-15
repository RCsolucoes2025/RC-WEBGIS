// RC WebGIS · Levantamento de daninhas
// Pintura das camadas (reboleiras, área de aplicação, grade de infestação) e painel de indicadores.
window.COA = window.COA || {};

COA.WEED_CLASSES = [
  {name: '< 5 m²', color: '#f4d03f'},
  {name: '5–25 m²', color: '#f39c12'},
  {name: '25–100 m²', color: '#e8590c'},
  {name: '>= 100 m²', color: '#c0392b'}
];
COA.GRID_RAMP = [[0, '#fff3b0'], [5, '#ffd166'], [15, '#f4a261'], [30, '#e76f51'], [60, '#9d0208']];

COA.isWeedProject = project => (project.statistics || {}).weed_count != null;

COA.weedClasses = project =>
  (project.weed_classes && project.weed_classes.length ? project.weed_classes : COA.WEED_CLASSES);

// Camadas de polígono com pintura própria: devolve {fill, line} ou null.
COA.weedPolygonPaint = function(role, style, project) {
  if (role === 'weeds') {
    const match = ['match', ['get', '_coa_class']];
    COA.weedClasses(project).forEach(c => match.push(c.name, c.color));
    match.push('#e8590c');
    return {
      fill: {'fill-color': match, 'fill-opacity': style['fill-opacity'] ?? .78},
      line: {'line-color': '#3a0d06', 'line-width': .8, 'line-opacity': .85}
    };
  }
  if (role === 'spray') {
    return {
      fill: {'fill-color': style['fill-color'] || '#6dd5ed', 'fill-opacity': style['fill-opacity'] ?? .12},
      line: {'line-color': style['line-color'] || '#6dd5ed', 'line-width': style['line-width'] || 1.5,
             'line-dasharray': [2, 1.5], 'line-opacity': .95}
    };
  }
  if (role === 'grid') {
    const ramp = ['interpolate', ['linear'], ['coalesce', ['get', '_coa_pct'], 0]];
    COA.GRID_RAMP.forEach(([v, c]) => ramp.push(v, c));
    return {
      fill: {'fill-color': ramp, 'fill-opacity': style['fill-opacity'] ?? .55},
      line: {'line-color': '#102a2b', 'line-width': .4, 'line-opacity': .6}
    };
  }
  return null;
};

COA.fmt = (v, d = 2) => Number(v).toLocaleString('pt-BR', {minimumFractionDigits: d, maximumFractionDigits: d});

COA.weedMetrics = function(s) {
  return [
    ['Área do talhão', s.area_ha != null ? `${COA.fmt(s.area_ha)} ha` : null],
    ['Infestação', s.weed_percentage != null ? `${COA.fmt(s.weed_percentage)}%` : null, 'hot'],
    ['Área infestada', s.weed_area_m2 != null ? `${COA.fmt(s.weed_area_m2, 0)} m²` : null],
    ['Reboleiras', s.weed_count != null ? `${s.weed_count} (${COA.fmt(s.weed_per_ha, 1)}/ha)` : null],
    ['Aplicação', s.spray_area_ha != null ? `${COA.fmt(s.spray_area_ha)} ha` : null],
    ['Economia', s.spray_savings_percentage != null ? `${COA.fmt(s.spray_savings_percentage, 1)}%` : null, 'good']
  ];
};

// Seções extras do painel lateral (inseridas depois de "Indicadores").
COA.renderWeedPanel = function(project, options = {}) {
  const s = project.statistics || {};
  const after = document.getElementById('indicators').closest('section');
  const total = Object.values(s.weed_class_area_m2 || {}).reduce((a, b) => a + b, 0) || 1;
  const classes = COA.weedClasses(project).map(c => {
    const n = (s.weed_classes || {})[c.name] || 0, a = (s.weed_class_area_m2 || {})[c.name] || 0;
    return `<div class="weed-row"><i style="background:${c.color}"></i><span>${COA.escape(c.name)}</span>
      <b>${n}</b><em>${COA.fmt(a, 0)} m²</em><div class="weed-bar"><s style="width:${(100 * a / total).toFixed(1)}%;background:${c.color}"></s></div></div>`;
  }).join('');
  let html = `<section class="weed-section"><h2>Reboleiras por tamanho</h2>
    <div class="weed-head"><span>Classe</span><b>Nº</b><em>Área</em></div>${classes}
    <p class="weed-note">Barra = parte da área infestada. Maior reboleira: ${COA.fmt(s.weed_max_m2 || 0, 0)} m² · média ${COA.fmt(s.weed_mean_m2 || 0, 1)} m².</p></section>`;
  if (s.weed_species && Object.keys(s.weed_species).length) {
    const max = Math.max(...Object.values(s.weed_species).map(v => v.area_m2)) || 1;
    html += `<section class="weed-section"><h2>Espécies</h2>${Object.entries(s.weed_species).map(([k, v]) =>
      `<div class="species-row"><span>${COA.escape(k)}</span><em>${v.count} · ${COA.fmt(v.area_m2, 0)} m²</em>
       <div class="weed-bar"><s style="width:${(100 * v.area_m2 / max).toFixed(1)}%"></s></div></div>`).join('')}</section>`;
  }
  html += `<section class="weed-section"><h2>Aplicação localizada</h2>
    <div class="spray-box"><div><span>Área a aplicar</span><strong>${COA.fmt(s.spray_area_ha || 0)} ha</strong></div>
    <div><span>do talhão</span><strong>${COA.fmt(s.spray_percentage || 0, 1)}%</strong></div></div>
    <p class="weed-note">Reboleiras + margem de segurança de ${COA.fmt(s.spray_margin_m || 0, 1)} m, recortadas no talhão.
    Em área total seriam ${COA.fmt(s.area_ha || 0)} ha.</p>
    ${options.downloads === false ? '' : `<div class="tool-grid"><button id="sprayKml">Baixar KML</button><button id="sprayJson">Baixar GeoJSON</button></div>`}
    <div class="grid-legend"><span>Grade de infestação (${COA.fmt(s.grid_size_m || 25, 0)} m)</span>
    <div class="ramp" style="background:linear-gradient(90deg,${COA.GRID_RAMP.map(([v, c]) => `${c} ${100 * v / 60}%`).join(',')})"></div>
    <div class="ramp-ticks"><span>0%</span><span>15%</span><span>30%</span><span>60%+</span></div></div></section>`;
  after.insertAdjacentHTML('afterend', html);
  if (options.downloads !== false) {
    const url = COA.projectUrl((project.layer_files || {}).spray || 'spray.geojson');
    const nome = `aplicacao_${(project.publication_slug || project.company || 'talhao').replace(/[^\w-]+/g, '_')}`;
    document.getElementById('sprayJson').onclick = () => COA.download(url, `${nome}.geojson`);
    document.getElementById('sprayKml').onclick = async () => {
      const gj = await (await fetch(url)).json();
      COA.saveText(COA.toKml(gj, 'Aplicação localizada'), `${nome}.kml`, 'application/vnd.google-earth.kml+xml');
    };
  }
};

COA.download = async function(url, name) {
  const blob = await (await fetch(url)).blob();
  const a = Object.assign(document.createElement('a'), {href: URL.createObjectURL(blob), download: name});
  document.body.append(a); a.click(); a.remove();
};
COA.saveText = function(text, name, type) {
  const a = Object.assign(document.createElement('a'), {href: URL.createObjectURL(new Blob([text], {type})), download: name});
  document.body.append(a); a.click(); a.remove();
};
COA.toKml = function(gj, title) {
  const ring = r => r.map(([x, y]) => `${x},${y},0`).join(' ');
  const poly = p => `<Polygon><outerBoundaryIs><LinearRing><coordinates>${ring(p[0])}</coordinates></LinearRing></outerBoundaryIs>${
    p.slice(1).map(h => `<innerBoundaryIs><LinearRing><coordinates>${ring(h)}</coordinates></LinearRing></innerBoundaryIs>`).join('')}</Polygon>`;
  const marks = (gj.features || []).map((f, i) => {
    const g = f.geometry, ps = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    return `<Placemark><name>Zona ${f.properties?.zona ?? i + 1}</name><styleUrl>#z</styleUrl><MultiGeometry>${ps.map(poly).join('')}</MultiGeometry></Placemark>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${COA.escape(title)}</name>
<Style id="z"><LineStyle><color>ffedd56d</color><width>2</width></LineStyle><PolyStyle><color>5fedd56d</color></PolyStyle></Style>${marks}</Document></kml>`;
};
