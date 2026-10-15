window.COA = window.COA || {};
COA.enablePopups = function(map, layerIds) {
  if(!layerIds.length)return;
  map.on('click',e=>{const features=map.queryRenderedFeatures(e.point,{layers:layerIds});if(!features.length)return;const f=features[0], props=f.properties||{};const L={reboleira:'Reboleira',area_m2:'Área (m²)',classe:'Classe',especie:'Espécie',zona:'Zona de aplicação',area_ha:'Área (ha)',margem_m:'Margem (m)',infestacao_pct:'Infestação (%)',daninha_m2:'Daninha (m²)',talhao:'Talhão'};const allowed=Object.entries(props).filter(([key])=>!key.startsWith('_coa_')||((key==='_coa_length_m'||key==='_coa_class')&&!('classe' in props))).filter(([,v])=>v!==null&&v!=='').slice(0,12);const rows=allowed.map(([k,v])=>`<tr><td>${COA.escape(L[k]||k)}</td><td>${COA.escape(v)}</td></tr>`).join('');new maplibregl.Popup().setLngLat(e.lngLat).setHTML(`<table class="popup-table">${rows}</table>`).addTo(map);});
  map.on('mousemove',e=>{map.getCanvas().style.cursor=map.queryRenderedFeatures(e.point,{layers:layerIds}).length?'pointer':'';});
};
COA.escape = value => String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
