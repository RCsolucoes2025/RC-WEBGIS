window.COA = window.COA || {};
COA.createMap = function(project) {
  if (window.pmtiles && !COA.pmtilesProtocol) {
    COA.pmtilesProtocol = new pmtiles.Protocol();
    maplibregl.addProtocol('pmtiles', COA.pmtilesProtocol.tile);
  }
  const style = {version: 8, sources: {}, layers: [{id:'background',type:'background',paint:{'background-color':'#dfe6e8'}}]};
  if (project.basemap === 'osm') {
    style.sources.osm = {type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'};
    style.layers.push({id:'osm',type:'raster',source:'osm'});
  }
  const center = project.bounds ? [(project.bounds[0]+project.bounds[2])/2,(project.bounds[1]+project.bounds[3])/2] : [-47.9,-15.7];
  const map = new maplibregl.Map({container:'map',style,center,zoom:project.bounds?13:4,attributionControl:true});
  map.on('error', event => console.error('[COA MapLibre]', event.error || event));
  map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-right');
  map.addControl(new maplibregl.FullscreenControl(),'top-right');
  map.addControl(new maplibregl.ScaleControl({maxWidth:130,unit:'metric'}),'bottom-right');
  map.on('mousemove',e=>document.getElementById('coordinates').textContent=`${e.lngLat.lat.toFixed(6)}, ${e.lngLat.lng.toFixed(6)}`);
  return map;
};
COA.fitProject = function(map, project) {
  if (project.bounds) map.fitBounds([[project.bounds[0],project.bounds[1]],[project.bounds[2],project.bounds[3]]],{padding:40,maxZoom:19});
};
