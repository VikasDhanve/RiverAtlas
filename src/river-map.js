/* Local WGS84 vectors; no network tiles, inferred registration boundaries or water simulation. */
const RiverAtlasMap=(()=>{
  'use strict';
  function create(container,{onSelect}){
    let map=null,selected=null,paused=false,staticMode=false,destroyed=false;
    const groups=[],labels=[],data=RiverAtlasGeography;
    const allBounds=L.geoJSON(data.rivers).getBounds();
    const text=(value,className)=>{const n=document.createElement('span');n.className=className;n.textContent=value;return n;};
    function paint(){
      container.classList.toggle('map-frozen',paused);container.classList.toggle('map-static',staticMode);
      groups.forEach((group,index)=>{
        const dim=selected!==null&&selected!==index;
        group.eachLayer(collection=>collection.eachLayer(layer=>layer.getElement()?.classList.toggle('river-dimmed',dim)));
      });
      labels.forEach((label,index)=>label.getElement()?.classList.toggle('river-label-dimmed',selected!==null&&selected!==index));
      container.setAttribute('aria-label',selected===null?'五河地理地图':data.rivers.features[selected].properties.name+'地理地图');
    }
    function fit(animate){
      if(!map)return;
      const bounds=selected===null?allBounds:L.geoJSON(data.rivers.features[selected]).getBounds();
      const options={padding:[36,30],maxZoom:12,animate:animate&&!paused&&!staticMode,duration:.85};
      map.stop();if(options.animate)map.flyToBounds(bounds,options);else map.fitBounds(bounds,options);
    }
    function select(index,animate=true){
      if(index!==null&&(!Number.isInteger(index)||index<0||index>=5))return;
      selected=index;paint();onSelect(index);fit(animate);
    }
    function init(){
      if(map||destroyed||!container.isConnected)return;
      map=L.map(container,{zoomControl:false,attributionControl:true,zoomSnap:.25,zoomDelta:.5,minZoom:8,maxZoom:12.5,
        maxBounds:[[38.8,121],[40.5,123.7]],maxBoundsViscosity:1,inertia:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false});
      map.fitBounds(allBounds,{padding:[36,30],animate:false});
      L.control.zoom({position:'topright',zoomInTitle:'放大地图',zoomOutTitle:'缩小地图'}).addTo(map);
      map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>');
      map.attributionControl.addAttribution('<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors · ODbL</a> · <a href="https://www.naturalearthdata.com" target="_blank" rel="noopener noreferrer">Natural Earth</a>');
      L.control.scale({imperial:false,position:'bottomleft',maxWidth:120}).addTo(map);
      L.geoJSON(data.land,{interactive:false,style:{color:'#456676',weight:1.1,fillColor:'#183b47',fillOpacity:1}}).addTo(map);
      L.geoJSON(data.regions,{interactive:false,style:{color:'#6a8a92',weight:1,dashArray:'4 7',fillOpacity:0,opacity:.5}}).addTo(map);
      L.geoJSON(data.water,{interactive:false,style:{color:'#39738a',weight:1,fillColor:'#0c2a3c',fillOpacity:1}}).addTo(map);
      for(const region of data.labels){
        L.marker(region.position,{interactive:false,keyboard:false,icon:L.divIcon({html:text(region.name,'map-place-text'),className:'map-place',iconSize:[120,24],iconAnchor:[60,12]})}).addTo(map);
      }
      data.rivers.features.forEach((feature,index)=>{
        const group=L.featureGroup().addTo(map);groups.push(group);
        for(const options of [
          {className:'river-bank',color:'#46bed8',weight:10,opacity:.13,interactive:false},
          {className:'river-channel',color:'#64d8ed',weight:3.6,opacity:.92,interactive:true},
          {className:'river-flow',color:'#d5faff',weight:1.8,opacity:.95,dashArray:'8 23',interactive:false}
        ]){
          L.geoJSON(feature,{style:{lineCap:'round',lineJoin:'round',...options},interactive:options.interactive,
            onEachFeature:(_,layer)=>layer.on('click',()=>select(index))}).addTo(group);
        }
        group.eachLayer(collection=>collection.eachLayer(layer=>{const path=layer.getElement();if(path)path.dataset.river=String(index);}));
        const line=feature.geometry.coordinates.reduce((a,b)=>a.length>b.length?a:b);
        const point=line[Math.floor(line.length*.55)];
        const label=L.marker([point[1],point[0]],{interactive:false,keyboard:false,icon:L.divIcon({html:text(feature.properties.name,'map-river-text'),className:'map-river-label',iconSize:[100,24],iconAnchor:[-10,12]})}).addTo(map);
        labels.push(label);
      });
      select(selected,false);
    }
    function setState(next){paused=next.paused;staticMode=next.staticMode;if(paused||staticMode)map?.stop();paint();}
    return {
      select,setState,
      refit(){init();map?.invalidateSize({pan:false,animate:false});},
      pause(){paused=true;map?.stop();paint();},
      resume(){paused=false;paint();},
      finish(){map?.stop();},
      destroy(){destroyed=true;map?.remove();map=null;}
    };
  }
  return {create};
})();
