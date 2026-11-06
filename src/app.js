/* 本地静态演示。所有来源文本均以DOM textContent显示，不解析用户HTML。 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const source = RiverAtlasSource;
  const slides = RiverAtlasSlides;
  const assets = new Map([...source.assets, ...RiverAtlasSupplement, ...RiverAtlasBiliuhe].map(a => [a.id, a]));
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pageIndex = parseHash(), currentStep = 0, timeline = null;
  let landscape = null, activeGallery = null, mediaTween = null, stepTween = null, exhibitView = null;
  let paused = false, manualStatic = false, imageId = null, zoom = 1, fittedWidth = 0, messageTimer;
  const motionOff = () => reduceQuery.matches || manualStatic || typeof gsap === 'undefined';
  const starfield=typeof RiverAtlasStars==='undefined'?null:RiverAtlasStars.create();
  const pad = n => String(n).padStart(2, '0');
  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function button(text, action, className = '') {
    const n = el('button', className, text);
    n.type = 'button'; n.addEventListener('click', action); return n;
  }
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS(svg.namespaceURI, 'path');
    p.setAttribute('d', { prev:'M14 5 7 12l7 7', next:'m10 5 7 7-7 7', help:'M9.3 8.5a3 3 0 0 1 5.7 1.3c0 2-3 2-3 4.2m0 3.5v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0' }[name]);
    svg.append(p); return svg;
  }
  function parseHash() {
    const m = /^#p(\d+)$/.exec(location.hash);
    const n = m ? Number(m[1]) : 1;
    return Number.isFinite(n) ? Math.max(0, Math.min(slides.length - 1, n - 1)) : 0;
  }
  function notify(text) {
    clearTimeout(messageTimer); $('message').textContent = text; $('message').classList.add('visible');
    messageTimer = setTimeout(() => $('message').classList.remove('visible'), 4500);
  }
  function fitStage() {
    if (window.innerWidth < 768) return;
    const scale = Math.min(window.innerWidth / 1600, window.innerHeight / 900);
    document.documentElement.style.setProperty('--stage-scale', scale);
    document.documentElement.style.setProperty('--stage-left', (window.innerWidth - 1600 * scale) / 2 + 'px');
    document.documentElement.style.setProperty('--stage-top', (window.innerHeight - 900 * scale) / 2 + 'px');
  }
  function copyPoints(points, className = 'copy-column') {
    const c = el('div', className);
    for (const [heading, text] of points || []) {
      const item = el('section', 'copy-point'); item.append(el('h2', '', heading), el('p', '', text)); c.append(item);
    }
    return c;
  }
  function assetImage(id, className = '', display = false) {
    const a = assets.get(id); if (!a) return el('p', '', '原件未找到，请核对配套资源。');
    const img = el('img', className); img.src = display && a.displayPath ? a.displayPath : a.path; img.alt = RiverAtlasCaptions[id] || a.caption || '原稿图像';
    img.decoding = 'async'; img.dataset.asset = id;
    if (a.rotation) img.style.transform = 'rotate(' + a.rotation + 'deg)';
    img.addEventListener('error', () => notify('图像加载失败，请保留完整assets配套目录并重新打开。'));
    return img;
  }
  function gallery(ids) {
    const c = el('div', 'gallery'), spread = el('div', 'gallery-spread');
    const caption = el('p', 'gallery-caption'), tabs = el('div', 'gallery-tabs');
    tabs.setAttribute('role', 'group'); tabs.setAttribute('aria-label', '选择业务图像');
    let active = ids[0];
    function fit() {
      const sheet=spread.firstElementChild,img=sheet?.firstElementChild;
      if(!img?.naturalWidth||!spread.clientHeight)return;
      const scale=Math.min(spread.clientWidth/img.naturalWidth,spread.clientHeight/img.naturalHeight);
      sheet.style.width=img.naturalWidth*scale+'px';sheet.style.height=img.naturalHeight*scale+'px';
    }
    function select(id, animate = true) {
      const direction=ids.indexOf(id)>=ids.indexOf(active)?1:-1;
      active = id;
      mediaTween?.progress(1).kill();
      spread.replaceChildren(...[id].map(asset => {
        const b = button('', () => openImage(asset), 'image-button');
        if ([24,25,26,33,34].includes(asset)) b.classList.add('photo-surface');
        b.dataset.asset = asset; b.setAttribute('aria-label', '查看原件：' + (RiverAtlasCaptions[asset] || assets.get(asset).caption));
        const img=assetImage(asset,'',true);img.addEventListener('load',fit);b.append(img);return b;
      }));
      caption.textContent = RiverAtlasCaptions[id] || assets.get(id).caption;
      for (const b of tabs.children) b.setAttribute('aria-pressed', String(Number(b.dataset.asset) === id));
      if (animate && !motionOff() && !paused) {
        mediaTween = gsap.fromTo(spread.children, { opacity:.45, x:direction*28, scale:.985, clipPath:direction>0?'inset(0 0 0 9%)':'inset(0 9% 0 0)' },
          { opacity:1, x:0, scale:1, clipPath:'inset(0 0 0 0)', duration:.28, ease:'power3.out', clearProps:'transform,opacity,clipPath' });
      }
      fit();
    }
    ids.forEach((id, i) => {
      const label = RiverAtlasCaptions[id] || assets.get(id).caption;
      const b = button('', () => { stopTimeline(); select(id); });
      b.append(assetImage(id,'gallery-thumbnail',true),el('span','gallery-tab-number',pad(i+1)));
      b.dataset.asset = id; b.title = label; b.setAttribute('aria-label', label); tabs.append(b);
    });
    const tools = el('div', 'gallery-tools');
    const focus = button('专注图件', () => {
      const layout = c.closest('.gallery-layout'); if (!layout) return;
      const on = layout.dataset.focus !== 'true'; layout.dataset.focus = String(on);
      layout.closest('.slide')?.classList.toggle('media-focus',on);
      focus.textContent = on ? '显示讲解' : '专注图件'; focus.setAttribute('aria-pressed', String(on));
      fit();
    }, 'focus-media'); focus.setAttribute('aria-pressed','false');
    const previous=button('',()=>{stopTimeline();select(ids[(ids.indexOf(active)+ids.length-1)%ids.length]);},'gallery-previous');previous.append(icon('prev'));previous.setAttribute('aria-label','上一张图件');
    const next=button('',()=>{stopTimeline();select(ids[(ids.indexOf(active)+1)%ids.length]);},'gallery-next');next.append(icon('next'));next.setAttribute('aria-label','下一张图件');
    tools.append(previous,tabs,next,focus);c.append(spread,tools,caption);select(active,false);
    activeGallery = { element:c, ids, select, refit:fit };
    return c;
  }
  function mediaLayout(s) {
    const c = el('div', 'gallery-layout'); c.dataset.focus='false';
    c.append(copyPoints(s.points), gallery(s.images)); return c;
  }
  function renderPolicyLibrary(s) {
    const layout=el('div','policy-library'), directory=el('div','policy-directory');
    const reader=el('section','policy-reader');
    const windowEl=el('div','policy-window'), footer=el('div','policy-reader-footer');
    const entries=[
      {id:7,name:'《自然资源统一确权登记暂行办法》',title:'统一确权登记暂行办法',detail:'自然资源统一确权登记工作依据'},
      {id:8,name:'《自然资源统一确权登记操作指南（试行）》',title:'操作指南（试行）',detail:'自然资源统一确权登记'},
      {id:9,name:'《自然资源确权登记规程》',title:'自然资源确权登记规程',detail:'TD/T 1112—2025'},
      {id:10,name:'《辽宁省自然资源统一确权登记工作总体方案》',title:'辽宁省总体方案',detail:'自然资源统一确权登记工作总体方案'},
      {id:11,name:'《大连市自然资源统一确权登记工作总体方案》',title:'大连市总体方案',detail:'自然资源统一确权登记工作总体方案'}
    ];
    let active=9,pinned=null,motion=null,zoomTween=null,disposed=false;
    const controls=new Map(), sheets=new Map();
    function fit() {
      const sheet=sheets.get(active); if(!sheet)return;
      const img=sheet.firstElementChild; if(!img.naturalWidth || !windowEl.clientHeight)return;
      const ratio=img.naturalWidth/img.naturalHeight;
      const width=Math.min(windowEl.clientWidth,windowEl.clientHeight*ratio);
      sheet.style.width=width+'px';sheet.style.height=width/ratio+'px';
    }
    function camera(scale) {
      const img=sheets.get(active)?.firstElementChild;if(!img)return;
      zoomTween?.kill();
      if(typeof gsap==='undefined')img.style.transform='scale('+scale+')';
      else if(motionOff()||paused)gsap.set(img,{scale});
      else zoomTween=gsap.to(img,{scale,duration:.25,ease:'power3.out',overwrite:true});
    }
    function select(id,animate=true) {
      if(disposed)return;
      motion?.kill();zoomTween?.kill();active=id;
      for(const item of entries) {
        const b=controls.get(item.id),sheet=sheets.get(item.id);sheet.hidden=item.id!==id;
        b.setAttribute('aria-current',String(item.id===id));b.setAttribute('aria-pressed',String(item.id===pinned));
        b.querySelector('.policy-pin-mark').textContent=item.id===pinned?'已固定':'';
      }
      const sheet=sheets.get(id);fit();
      if(typeof gsap!=='undefined') {
        gsap.set(sheet.firstElementChild,{scale:1});
        if(animate&&!motionOff()&&!paused)motion=gsap.fromTo(sheet,{opacity:.55,x:12},{opacity:1,x:0,duration:.28,ease:'power3.out'});
        else gsap.set(sheet,{opacity:1,x:0});
      }
    }
    for(const [title,items] of [['国家规范',entries.slice(0,3)],['省市方案',entries.slice(3)]]) {
      const group=el('section','policy-group');group.append(el('h2','',title));
      for(const item of items) {
        const b=button('',()=>{pinned=pinned===item.id?null:item.id;select(item.id);},'policy-choice');
        const text=el('span','policy-choice-text');text.append(el('span','policy-choice-name',item.name));
        if(item.id===9)text.append(el('span','policy-standard','TD/T 1112—2025'));
        b.append(text,el('span','policy-pin-mark'));b.dataset.asset=item.id;b.setAttribute('aria-label',item.name);
        b.addEventListener('pointerenter',()=>{if(pinned===null&&matchMedia('(hover: hover) and (pointer: fine)').matches)select(item.id);});
        b.addEventListener('focus',()=>{if(pinned===null)select(item.id,false);});
        controls.set(item.id,b);group.append(b);
      }
      directory.append(group);
    }
    const support=el('section','policy-support');support.append(el('h2','','配套依据'),el('p','',s.points[2][1]));directory.append(support);
    entries.forEach(item=>{
      const sheet=el('div','policy-sheet'),img=assetImage(item.id);sheet.dataset.asset=item.id;sheet.hidden=item.id!==active;
      sheet.append(img);sheets.set(item.id,sheet);windowEl.append(sheet);
      img.addEventListener('load',fit);
      sheet.addEventListener('pointerenter',()=>{if(matchMedia('(hover: hover) and (pointer: fine)').matches)camera(1.42);});
      sheet.addEventListener('pointermove',event=>{
        const rect=sheet.getBoundingClientRect();
        const x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));
        img.style.transformOrigin=(x*100)+'% '+(y*100)+'%';
      });
      sheet.addEventListener('pointerleave',()=>camera(1));
    });
    footer.append(button('查看完整政策文件',()=>openImage(active),'policy-original'));
    reader.append(windowEl,footer);
    layout.append(directory,reader);
    layout.addEventListener('pointerleave',()=>{if(pinned===null)select(9);});
    layout.addEventListener('focusout',event=>{if(!layout.contains(event.relatedTarget)&&pinned===null)select(9,false);});
    exhibitView={resetLabel:'恢复默认',reset:()=>{pinned=null;select(9);},refit:fit,pause:()=>{motion?.pause();zoomTween?.pause();},resume:()=>{motion?.resume();zoomTween?.resume();},finish:()=>{motion?.progress(1).pause();zoomTween?.progress(1).pause();},destroy:()=>{disposed=true;motion?.kill();zoomTween?.kill();}};
    select(9,false);return layout;
  }
  function renderDocumentExhibit(s) {
    const layout=el('div','exhibit-layout'), stage=el('div','document-exhibit');
    layout.append(copyPoints(s.points),stage); stage.dataset.active='';
    let active=-1, pinned=-1, motion=null, disposed=false;
    const crops=[], cards=[], toggles=[];
    const definitions=[
      {id:5,title:'中标通知书',regions:[['承接内容',[.11,.065,.78,.385]],['签章与日期',[.13,.45,.74,.22]]]},
      {id:6,title:'项目合同',regions:[['合同名称',[.045,.10,.92,.16]],['签订信息',[.045,.735,.94,.215]]]}
    ];
    function positionCrops(animate) {
      for (const crop of crops) {
        const {img,window:box,region,index}=crop;
        if (!img.naturalWidth || !box.clientWidth) continue;
        const [rx,ry,rw,rh]=region, nw=img.naturalWidth, nh=img.naturalHeight;
        const scale=Math.min(box.clientWidth/(rw*nw),box.clientHeight/(rh*nh));
        img.style.width=nw+'px'; img.style.height=nh+'px';
        const values={x:box.clientWidth/2-(rx+rw/2)*nw*scale,y:box.clientHeight/2-(ry+rh/2)*nh*scale,scale};
        if (typeof gsap==='undefined') img.style.transform='translate('+values.x+'px,'+values.y+'px) scale('+scale+')';
        else if (animate && motion) motion.to(img,{...values,duration:.35,ease:'power3.out'},0);
        else gsap.set(img,values);
      }
    }
    function select(index, animate=true) {
      if (disposed) return;
      const first=cards.map(card=>card.getBoundingClientRect());
      motion?.kill();
      if (typeof gsap!=='undefined') gsap.set(cards,{clearProps:'transform'});
      active=index; stage.dataset.active=index<0?'':String(index);
      cards.forEach((card,i)=>{
        card.classList.toggle('is-active',i===active);
        if (i!==active) delete card.dataset.reading;
        toggles[i].setAttribute('aria-pressed',String(i===pinned));
        toggles[i].querySelector('.document-pin-state').textContent=i===pinned?'已固定':'';
      });
      const moving=animate && !motionOff() && !paused;
      if (moving) {
        motion=gsap.timeline();
        cards.forEach((card,i)=>{
          const last=card.getBoundingClientRect(), before=first[i];
          const ratio=last.width ? before.width/last.width:1;
          motion.fromTo(card,{x:(before.left-last.left)/(window.innerWidth<768?1:Number(getComputedStyle(document.documentElement).getPropertyValue('--stage-scale'))||1),scaleX:ratio},
            {x:0,scaleX:1,duration:.35,ease:'power3.out'},0);
        });
      } else motion=null;
      positionCrops(moving);
    }
    function pin(index) { pinned=pinned===index?-1:index; select(pinned); }
    definitions.forEach((d,index)=>{
      const card=el('section','document-card'); card.dataset.asset=d.id;
      const toggle=button('',()=>pin(index),'document-select');
      toggle.append(el('h2','',d.title),el('span','document-pin-state'));
      toggle.setAttribute('aria-label','固定查看：'+d.title); toggle.setAttribute('aria-pressed','false');
      toggle.addEventListener('focus',()=>{if(pinned<0)select(index,false);});
      const body=el('div','document-fragments');
      d.regions.forEach(([name,region],part)=>{
        const fragment=el('div','document-fragment'), box=el('div','document-crop'), img=assetImage(d.id);
        img.classList.add('document-crop-image'); box.append(img);
        fragment.append(el('h3','',name),box); body.append(fragment);
        fragment.addEventListener('pointerenter',()=>{
          if (active===index && matchMedia('(hover: hover) and (pointer: fine)').matches) { card.dataset.reading=String(part); select(index); }
        });
        crops.push({img,window:box,region,index});
        img.addEventListener('load',()=>positionCrops(false));
      });
      const original=button('查看完整原件',()=>openImage(d.id),'document-original');
      original.setAttribute('aria-label','查看完整原件：'+d.title);
      card.append(toggle,body,original);
      card.addEventListener('pointerenter',()=>{if(matchMedia('(hover: hover) and (pointer: fine)').matches && pinned<0)select(index);});
      card.addEventListener('click',event=>{if(!event.target.closest('button'))pin(index);});
      cards.push(card);toggles.push(toggle);stage.append(card);
    });
    stage.addEventListener('pointerleave',()=>{if(pinned<0)select(-1);});
    stage.addEventListener('focusout',event=>{if(!stage.contains(event.relatedTarget) && pinned<0)select(-1,false);});
    exhibitView={
      reset:()=>{pinned=-1;select(-1);},
      refit:()=>positionCrops(false),
      pause:()=>motion?.pause(),resume:()=>motion?.resume(),finish:()=>motion?.progress(1).pause(),
      destroy:()=>{disposed=true;motion?.kill();}
    };
    return layout;
  }
  function renderProgram(s) {
    const c = el('div','program-layout'), tabs = el('div','program-tabs');
    const process = renderProcess(s), docs = mediaLayout({images:s.images,points:[
      ['适用语境','辽宁省本级自然资源统一确权登记暂行管理办法。'],
      ['审核程序','预审、内部审核、外部审核与登簿审核。'],
      ['办理方式','登簿审核依托登记信息系统线上办理；此前三类审核按文件线下进行。']
    ]}); docs.hidden = true;
    function select(showDocs) {
      stopTimeline(); process.hidden=showDocs; docs.hidden=!showDocs;
      c.classList.toggle('show-documents',showDocs);
      c.closest('.slide')?.classList.toggle('media-focus',showDocs && docs.dataset.focus==='true');
      for (const b of tabs.children) b.setAttribute('aria-pressed',String(b.dataset.documents===String(showDocs)));
    }
    for (const [name,on] of [['程序演示',false],['政策文件',true]]) {
      const b=button(name,()=>select(on)); b.dataset.documents=String(on); b.setAttribute('aria-pressed',String(!on)); tabs.append(b);
    }
    c.append(tabs,process,docs); return c;
  }
  function renderMap(s) {
    const layout=el('div','map-layout'),list=el('div','river-list'),figure=el('div','map-figure');
    const windowEl=el('div','map-window river-map'),controls=el('div','map-controls'),desc=el('span','','五河空间总览');
    windowEl.setAttribute('role','region');windowEl.setAttribute('aria-label','五河地理地图');windowEl.tabIndex=0;
    let view;
    const attributes=el('div','river-attributes');attributes.setAttribute('aria-live','polite');
    function showAttributes(index){
      attributes.replaceChildren();
      if(index===null){
        const table=renderTable({heads:['河流','长度 / km','面积 / 公顷','涉及县区'],rows:s.rivers.map((r,i)=>[r[0],s.riverAttributes[i][1],s.riverAttributes[i][2],s.riverAttributes[i][3]])},'river-attribute-table');
        attributes.append(el('h2','','五河属性 · 均为市级'),table);
      }else{
        const [level,length,area,county]=s.riverAttributes[index];attributes.append(el('h2','',s.rivers[index][0]+' · '+level));
        const values=el('dl','river-attribute-values');for(const [name,value] of [['长度 / km',length],['面积 / 公顷',area],['涉及县区',county]])values.append(el('dt','',name),el('dd','',value));attributes.append(values);
      }
    }
    function select(index){view?.select(index);}
    const all=button('',()=>select(null),'river-choice river-all');all.dataset.river='all';
    all.append(el('strong','','全部'),el('span','','五条河流总览'));list.append(all);
    s.rivers.forEach((river,index)=>{
      const choice=button('',()=>select(index),'river-choice');choice.dataset.river=String(index);
      choice.append(el('strong','',river[0]),el('span','',river[1]));list.append(choice);
    });
    function selected(index){
      for(const choice of list.children)choice.setAttribute('aria-pressed',String(choice.dataset.river===(index===null?'all':String(index))));
      desc.textContent=index===null?'五河空间总览':s.rivers[index][0]+' · '+s.rivers[index][1];
      showAttributes(index);
    }
    const original=button('查看原件',()=>openImage(12));original.dataset.asset='12';
    controls.append(desc,button('恢复全图',()=>select(null)),original);figure.append(windowEl,controls,attributes);layout.append(list,figure);selected(null);
    if(typeof RiverAtlasMap!=='undefined'&&typeof L!=='undefined'&&typeof RiverAtlasGeography!=='undefined'){
      view=RiverAtlasMap.create(windowEl,{onSelect:selected});
      exhibitView={...view,resetLabel:'显示全部',reset(){select(null);}};
    }else{
      windowEl.append(assetImage(12));desc.textContent='地图资源未加载，已保留原稿分布图';
      for(const choice of list.children)choice.disabled=true;
    }
    return layout;
  }
  function renderLayers(s) {
    const layout=el('div','atlas-layers-layout'),list=el('div','atlas-layer-list'),display=el('div','atlas-layer-display');
    const scene=el('div','atlas-layer-scene'),stack=el('div','atlas-stack'),controls=el('div','atlas-layer-controls');
    let selected=0,expanded=true,motion=null;
    const planes=[],choices=[];
    function fit(){
      const scale=Math.max(.25,Math.min(1,scene.clientWidth/(window.innerWidth<768?500:1040),scene.clientHeight/540));
      stack.style.transform='translate(-50%,-50%) scale('+scale+')';
    }
    function paint(animate=true){
      motion?.progress(1).kill();
      const moving=animate&&!motionOff()&&!paused;
      motion=moving?gsap.timeline({defaults:{duration:.28,ease:'power3.out'}}):null;
      let background=0;
      planes.forEach((plane,i)=>{
        const current=i===selected,slot=[-290,210,330][background];if(!current)background++;
        const values={x:current?0:slot,y:current?0:18,z:current?90:-20-background*10,rotationY:current?0:(slot<0?16:-16),scale:current?1:.84,opacity:current?1:expanded?.62:0};
        plane.classList.toggle('active',current);plane.inert=!current&&!expanded;
        plane.style.zIndex=String(current?10:4-background);choices[i].setAttribute('aria-pressed',String(current));
        if(typeof gsap==='undefined')plane.style.transform=`translate(-50%,-50%) translate(${values.x}px,${values.y}px) scale(${values.scale}) rotateY(${values.rotationY}deg)`;
        else if(moving)motion.to(plane,values,0);
        else gsap.set(plane,values);
      });
      expand.setAttribute('aria-pressed',String(expanded));collapse.setAttribute('aria-pressed',String(!expanded));
    }
    s.points.forEach(([title,text],i)=>{
      const choice=button('',()=>{stopTimeline();highlightStep(i);},'atlas-layer-choice');choice.setAttribute('aria-label',title);
      choice.append(el('span','atlas-layer-index',pad(i+1)),el('h2','',title),el('p','',text));choices.push(choice);list.append(choice);
      const plane=button('',()=>{if(selected===i)openImage(s.images[i]);else highlightStep(i);},'atlas-plane');plane.dataset.layer=i;
      plane.setAttribute('aria-label','查看'+title+'图件');
      const box=el('div','atlas-raster-frame'),img=assetImage(s.images[i],'atlas-raster',true);box.append(img);
      plane.append(box,el('span','atlas-plane-label',title));planes.push(plane);stack.append(plane);
      if(typeof gsap!=='undefined')gsap.set(plane,{xPercent:-50,yPercent:-50});
    });
    const expand=button('图集',()=>{expanded=true;paint();},'atlas-mode'),collapse=button('单图',()=>{expanded=false;paint();},'atlas-mode');
    controls.append(el('span','atlas-unit','大沙河 · 210200331000003'),expand,collapse,button('查看图件',()=>openImage(s.images[selected]),'atlas-open'));
    scene.append(stack);display.append(scene,controls);layout.append(list,display);
    exhibitView={resetLabel:'复位图层',reset:()=>{expanded=true;highlightStep(0);},selectStep:index=>{selected=index;paint();},refit:fit,
      pause:()=>motion?.pause(),resume:()=>motion?.resume(),finish:()=>motion?.progress(1).pause(),destroy:()=>motion?.kill()};
    paint(false);return layout;
  }
  function renderWorkflow(s){
    const layout=el('div','workflow-layout'),phases=el('div','workflow-phases');
    s.phases.forEach((phase,i)=>{
      const lane=el('section','workflow-phase');lane.dataset.workflowStep=i;
      const heading=button('',()=>{stopTimeline();highlightStep(i);},'workflow-heading');heading.append(el('span','',pad(i+1)),el('h2','',phase.name));lane.append(heading);
      phase.nodes.forEach(([title,details],index)=>{
        if(index)lane.append(el('div','workflow-vertical-link'));
        const node=el('div','workflow-node');node.append(el('h3','',title));
        if(details.length){const branches=el('div','workflow-details');details.forEach(text=>branches.append(el('span','',text)));node.append(branches);}
        lane.append(node);
      });phases.append(lane);
    });
    const loop=el('section','workflow-exceptions');loop.append(el('h2','','核实与补充调查闭环'));
    const line=el('div','workflow-exception-line');
    for(const text of ['权属不清、有争议或成果缺失','外业补充调查','争议解决或成果完善','成果上图'])line.append(el('span','',text));
    const unresolved=el('p','workflow-unresolved','争议仍无法解决：划定权属争议区，再进入成果上图。成果无异议时直接上图。');
    loop.append(line,unresolved);
    const footer=el('div','workflow-footer'),desc=el('p','step-description');desc.id='step-description';desc.setAttribute('aria-live','polite');
    footer.append(desc,button('查看流程原图',()=>openImage(111),'workflow-original'));
    layout.append(phases,loop,footer);return layout;
  }
  function renderDatabase(s){
    const layout=el('div','database-layout'),standards=el('div','database-standards');
    standards.append(el('strong','','数据建库依据'));s.standards.forEach(text=>standards.append(el('span','',text)));
    const flow=el('div','database-organization'),foundation=el('section','database-foundation');foundation.append(el('h2','','成果基础'));
    s.foundations.forEach(text=>foundation.append(el('p','',text)));
    const unit=el('section','database-unit');unit.append(el('h2','','自然资源\n登记单元'),el('p','','以单元为单位组织'));
    const contents=el('section','database-contents');contents.append(el('h2','','自然资源数据库内容'));
    s.categories.forEach((text,i)=>{const row=el('div','database-category');row.append(el('span','',pad(i+1)),el('p','',text));contents.append(row);});
    flow.append(foundation,unit,contents);layout.append(standards,flow,renderProcess(s));return layout;
  }
  function renderStaffing(s){
    const layout=el('div','staff-layout'),organization=el('section','staff-organization'),qualifications=el('section','staff-qualifications');
    organization.append(el('h2','','岗位配置'));
    const leaders=el('div','staff-leaders');s.roles.slice(0,2).forEach(([name,count])=>{const row=el('div','staff-role');row.append(el('span','',name),el('strong','',count+'人'));leaders.append(row);});organization.append(leaders);
    const branches=el('div','staff-branches');
    for(const [title,roles] of [['内业组',s.roles.slice(2,4)],['外业组',s.roles.slice(4,6)],['质量检查',s.roles.slice(6)]]){
      const branch=el('section','staff-branch');branch.append(el('h3','',title));
      roles.forEach(([name,count])=>{const row=el('div','staff-role');row.append(el('span','',name),el('strong','',count+'人'));branch.append(row);});branches.append(branch);
    }
    const temporary=el('div','staff-temporary');temporary.append(el('span','','临时抽调'),el('strong','',s.temporary+'人'),el('span','','配合项目实施'));
    const total=el('p','staff-total','岗位配置13人 + 临时抽调10人 = 项目参与23人');organization.append(branches,temporary,total);
    qualifications.append(el('h2','','职称构成'),el('p','staff-qualification-note','23名项目参与人员'));
    s.qualifications.forEach(([name,count],i)=>{
      const group=button('',()=>{stopTimeline();highlightStep(i);},'staff-qualification');group.dataset.staffStep=i;
      const label=el('div','staff-qualification-label');label.append(el('span','',name),el('strong','',count+'人'));
      const seats=el('div','staff-seats');seats.setAttribute('aria-hidden','true');
      for(let j=0;j<count;j++)seats.append(el('span','staff-seat'));
      group.append(label,seats);qualifications.append(group);
    });
    const desc=el('p','step-description sr-only');desc.id='step-description';desc.setAttribute('aria-live','polite');
    layout.append(organization,qualifications,desc);return layout;
  }
  function renderProcess(s) {
    const c = el('div', 'process-layout'), track = el('div', 'process-track'), fill = el('span');
    fill.id = 'process-fill'; track.append(fill);
    const nodes = el('div', 'process-nodes');
    s.steps.forEach(([title, text], i) => {
      const n = button('', () => { stopTimeline(); highlightStep(i); }, 'process-node');
      n.dataset.step = i;
      n.append(el('span', 'step-number', pad(i + 1)), el('h2', '', title), el('p', '', text)); nodes.append(n);
    });
    const desc = el('p', 'step-description sr-only');
    desc.id = 'step-description'; desc.setAttribute('aria-live', 'polite');
    c.append(track, nodes, desc); return c;
  }
  function renderChart(s) {
    const c = el('div', 'chart-layout'); c.append(copyPoints(s.points));
    const chart = el('div', 'area-chart'), heading = el('h2', 'chart-title', '自然资源类型构成');
    heading.append(el('span', '', '单位：公顷')); chart.append(heading);
    for (const [name, value, color] of s.chart) {
      const row = el('div', 'area-row'), label = el('div', 'area-label');
      label.append(el('span', '', name), el('span', '', value.toFixed(2)));
      const track = el('div', 'area-track'), fill = el('div', 'area-fill');
      fill.style.width = (value / 3141.83 * 100) + '%'; fill.style.backgroundColor = color;
      fill.setAttribute('aria-hidden', 'true'); track.append(fill); row.append(label, track); chart.append(row);
    }
    chart.append(el('p', 'chart-total', '合计3141.83公顷 · 大沙河公告草案'));
    c.append(chart); return c;
  }
  function renderTable(table, className) {
    const t = el('table', className);
    if (table.heads) {
      const head = el('thead'), row = el('tr');
      for (const title of table.heads) { const cell = el('th', '', title); cell.scope = 'col'; row.append(cell); }
      head.append(row); t.append(head);
    }
    const body = el('tbody');
    for (const data of table.rows) {
      const row = el('tr'); for (const text of data) row.append(el('td', '', text || '—（原稿空白）')); body.append(row);
    }
    t.append(body); return t;
  }
  function renderBody(s) {
    if (s.layout === 'workflow') return renderWorkflow(s);
    if (s.layout === 'database') return renderDatabase(s);
    if (s.layout === 'staffing') return renderStaffing(s);
    if (s.interaction === 'document-exhibit') return renderDocumentExhibit(s);
    if (s.interaction === 'policy-library') return renderPolicyLibrary(s);
    if (s.layout === 'gallery' || s.layout === 'expert') {
      return mediaLayout(s);
    }
    if (s.layout === 'boundaries') {
      const c = el('div', 'boundary-grid');
      for (const p of s.points) { const item = el('section', 'boundary-item'); item.append(el('h2', '', p[0]), el('p', '', p[1])); c.append(item); }
      return c;
    }
    if (s.layout === 'map') return renderMap(s);
    if (s.layout === 'collection') {
      const c = el('div', 'collection-layout'), lanes = el('div', 'collection-lanes');
      for (const p of s.points) { const lane = el('section', 'collection-lane'); lane.append(el('h2', '', p[0]), el('p', '', p[1])); lanes.append(lane); }
      const target = el('div', 'collection-target'); target.append(el('h2', '', '工作底图'), el('p', '', '范围\n权属\n管制'));
      c.append(lanes, target); return c;
    }
    if (s.layout === 'layers') return renderLayers(s);
    if (s.layout === 'mapping') {
      const c = el('div', 'mapping-layout'), groups = el('div', 'mapping-groups');
      for (const p of s.points) { const g = el('section', 'mapping-group'); g.append(el('h2', '', p[0]), el('p', '', p[1])); groups.append(g); }
      c.append(groups, el('p', 'mapping-result', '按统一规格整理、上图')); return c;
    }
    if (s.layout === 'process') return s.images?.length ? renderProgram(s) : renderProcess(s);
    if (s.layout === 'deliverables') {
      const c = el('div', 'deliverable-grid');
      for (const p of s.points) { const item = el('section', 'deliverable'); item.append(el('h2', '', p[0]), el('p', '', p[1])); c.append(item); }
      return c;
    }
    if (s.layout === 'audit') return renderTable(s.table, 'audit-table');
    if (s.layout === 'requirements') return copyPoints(s.points, 'requirements-grid');
    if (s.layout === 'register') return copyPoints(s.points, 'register-layout');
    if (s.layout === 'checklist') {
      const c = el('div', 'checklist');
      s.points.forEach((p, i) => { const item = el('section', 'check-item'); item.append(el('span', 'item-number', String(i + 1)), copyPoints([p])); c.append(item); }); return c;
    }
    if (s.layout === 'announcement') {
      const c = el('div', 'announcement-layout'), number = el('div', 'notice-duration');
      number.append(el('span', '', '公告期不少于'), el('strong', '', '15'), el('span', '', '个工作日'));
      c.append(number, copyPoints(s.points)); return c;
    }
    if (s.layout === 'chart') return renderChart(s);
    if (s.layout === 'status') {
      const c = el('div', 'status-layout'), conclusion = el('section', 'status-conclusion');
      conclusion.append(el('h2', '', s.points[0][0]), el('p', '', s.points[0][1]));
      c.append(conclusion, copyPoints(s.points.slice(1))); return c;
    }
    return copyPoints(s.points);
  }
  function stopTimeline() { timeline?.progress(1,true).kill(); timeline = null; mediaTween?.progress(1).kill(); mediaTween=null; stepTween?.progress(1).kill(); stepTween=null; }
  function highlightStep(n) {
    const s = slides[pageIndex], total = s.steps?.length || s.points?.length || 1;
    currentStep = Math.max(0, Math.min(total - 1, n));
    document.querySelectorAll('.process-node').forEach((node, i) => {
      node.classList.toggle('active', i === currentStep); node.setAttribute('aria-pressed', String(i === currentStep));
    });
    document.querySelectorAll('.layer-plane').forEach(node => node.classList.toggle('active', Number(node.dataset.layer) === currentStep));
    if (!motionOff() && !paused) {
      stepTween?.progress(1).kill(); stepTween=gsap.timeline();
      const node=document.querySelector('.process-node.active');
      if (node) stepTween.fromTo(node,{y:9},{y:0,duration:.55,ease:'power3.out'});
      document.querySelectorAll('.layer-plane').forEach(plane=> {
        const selected=Number(plane.dataset.layer)===currentStep;
        stepTween.to(plane,{x:selected ? -22:0,scale:selected ? 1.045:1,duration:.7,ease:'power3.out'},0);
      });
    }
    exhibitView?.selectStep?.(currentStep);
    document.querySelectorAll('[data-workflow-step]').forEach((node,i)=>{node.classList.toggle('is-current',i===currentStep);node.querySelector('button').setAttribute('aria-pressed',String(i===currentStep));});
    document.querySelectorAll('[data-staff-step]').forEach((node,i)=>{node.classList.toggle('is-current',i===currentStep);node.setAttribute('aria-pressed',String(i===currentStep));});
    if(stepTween){
      const workflowNodes=document.querySelectorAll('.workflow-phase.is-current .workflow-node');
      if(workflowNodes.length)stepTween.fromTo(workflowNodes,{opacity:.45,x:9},{opacity:1,x:0,duration:.28,stagger:.06,clearProps:'transform,opacity'},0);
      const staffSeats=document.querySelectorAll('.staff-qualification.is-current .staff-seat');
      if(staffSeats.length)stepTween.fromTo(staffSeats,{opacity:.4},{opacity:1,duration:.25,stagger:.035},0);
    }
    const desc = $('step-description');
    if (desc && s.steps) desc.textContent = '当前讲解第' + (currentStep + 1) + '步：' + s.steps[currentStep][0] + '。';
    const fill = $('process-fill'); if (fill) {
      const progress=currentStep / Math.max(1,total-1);
      if (!motionOff() && !paused && stepTween) stepTween.to(fill,{scaleX:progress,duration:.85,ease:'power3.inOut'},0);
      else fill.style.transform='scaleX('+progress+')';
    }
  }
  function updateControls() {
    $('pause-button').textContent = paused ? '继续' : '暂停';
    $('pause-button').setAttribute('aria-pressed', String(paused));
    $('static-button').setAttribute('aria-pressed', String(motionOff()));
    $('static-button').disabled = reduceQuery.matches;
    $('play-button').disabled = motionOff() || Boolean(exhibitView);
    $('play-button').title = exhibitView ? '本页由鼠标或点击控制，不自动播放' : '';
    $('skip-button').disabled = Boolean(exhibitView);
    $('replay-button').textContent = exhibitView ? (exhibitView.resetLabel || '恢复全览') : '重播';
    $('pause-button').disabled = motionOff();
    $('replay-button').disabled = !exhibitView && motionOff();
    $('static-button').title = reduceQuery.matches ? '系统已启用减少动态效果，当前静态显示' : '切换静态模式（A）';
    document.body.classList.toggle('static-mode', motionOff());
    starfield?.setState({paused,staticMode:motionOff()});
    exhibitView?.setState?.({paused,staticMode:motionOff()});
    $('stage').dataset.paused = String(paused);
  }
  function intro(animate, direction = 1) {
    if (motionOff() || paused || !animate || typeof gsap === 'undefined') return;
    timeline = gsap.timeline({ paused, defaults: { ease:'power3.out' } });
    const cover = document.querySelector('.cover-content');
    if (cover) {
      timeline.fromTo(cover.children, { y:32, opacity:0 }, { y:0, opacity:1, duration:1.1, stagger:.18 });
      timeline.fromTo('.cover-rule', { scaleX:0 }, { scaleX:1, duration:1.2 },.5);
      return;
    }
    timeline.fromTo('.slide-heading, .slide-lead', { y:18, opacity:0 }, { y:0, opacity:1, duration:.65, stagger:.12 });
    const selectors = '.copy-point, .boundary-item, .collection-lane, .collection-target, .mapping-group, .mapping-result, .process-node, .deliverable, .requirements-grid > section, .check-item, .notice-duration, .area-row, .status-conclusion, .audit-table tbody tr';
    const nodes = [...document.querySelectorAll(selectors)].filter(n=>n.getClientRects().length && !n.parentElement.closest('.copy-point'));
    if (nodes.length) timeline.fromTo(nodes, { y:26, opacity:0 }, { y:0, opacity:1, duration:.7, stagger:.09 },.17);
    const media = document.querySelector('.gallery-spread, .map-window');
    if (media) timeline.fromTo(media,{ y:30, scale:.965, opacity:0 },{ y:0, scale:1, opacity:1, duration:1.05 },.2);
    const planes = document.querySelectorAll('.layer-plane');
    if (planes.length) timeline.fromTo(planes,{ opacity:0, x:90 },{ opacity:1, x:0, duration:1.2, stagger:.18 },.25);
    if (document.querySelector('.area-fill')) timeline.fromTo('.area-fill',{scaleX:0},{scaleX:1,duration:1.4,stagger:.16,ease:'power2.inOut'},.25);
    const workflow=document.querySelector('.workflow-phases');
    if(workflow)timeline.fromTo(workflow.children,{opacity:.45,x:18},{opacity:1,x:0,duration:.65,stagger:.12},.15);
    const seats=document.querySelectorAll('.staff-seat');
    if(seats.length)timeline.fromTo(seats,{opacity:.2,scale:.9},{opacity:1,scale:1,duration:.45,stagger:.035},.25);
  }
  function showPage(index, { animate = true, keyboard = false } = {}) {
    const next = Math.max(0, Math.min(slides.length - 1, Math.trunc(index)));
    const direction = next >= pageIndex ? 1 : -1;
    stopTimeline(); landscape?.destroy(); exhibitView?.destroy(); exhibitView=null; landscape=null; activeGallery=null; pageIndex = next; currentStep = 0;
    const s = slides[pageIndex], slide = el('article', 'slide');
    if (s.layout === 'cover' || s.layout === 'closing') {
      slide.classList.add('cover-slide'); if (s.layout === 'closing') slide.classList.add('closing-slide');
      const cover = assetImage(4, 'cover-image'), shade = el('div', 'cover-shade'), copy = el('div', 'cover-content');
      const title = el('h1', '', s.title); title.id = 'slide-title'; title.tabIndex = -1;
      copy.append(title, el('p', 'cover-subtitle', s.subtitle), el('div', 'cover-rule'), el('p', 'cover-date', s.lead));
      slide.append(cover, shade, copy);
    } else {
      const heading = el('div', 'slide-heading'), title = el('h1', '', s.title); title.id = 'slide-title'; title.tabIndex = -1;
      heading.append(title); if (s.status) heading.append(el('span', 'status-label', s.status));
      const content = el('div', 'slide-content'); content.append(renderBody(s));
      slide.append(heading, el('p', 'slide-lead', s.lead), content);
      if (['gallery','expert'].includes(s.layout)) slide.classList.add('media-slide');
      if (s.interaction==='document-exhibit') slide.classList.add('exhibit-slide');
      if (s.interaction==='policy-library') slide.classList.add('policy-slide');
      if (['layers','workflow','database','staffing'].includes(s.layout)) slide.classList.add('technical-slide');
      if (s.note && s.layout==='boundaries') slide.append(el('p','slide-note',s.note));
    }
    $('presentation').replaceChildren(slide);
    if (slide.classList.contains('cover-slide')) landscape=RiverAtlasLandscape.create(slide,{staticMode:motionOff(),paused});
    $('page-count').textContent = pad(pageIndex + 1) + ' / ' + slides.length;
    $('stage').dataset.page = String(pageIndex + 1);
    $('prev-button').disabled = pageIndex === 0; $('next-button').disabled = pageIndex === slides.length - 1;
    $('step-button').disabled = !['process', 'layers','workflow','database','staffing'].includes(s.layout);
    document.querySelectorAll('.chapter-button').forEach((b, i) => b.setAttribute('aria-current', String(i === s.chapter)));
    $('page-progress-fill').style.transform = 'scaleX(' + (pageIndex + 1) / slides.length + ')';
    try { history.replaceState(null, '', '#p' + (pageIndex + 1)); } catch { location.hash = 'p' + (pageIndex + 1); }
    updateControls(); highlightStep(0); fitStage(); exhibitView?.refit(); activeGallery?.refit(); intro(animate, direction);
    if (keyboard) $('slide-title').focus({ preventScroll: true });
    if (window.innerWidth < 768) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function playDemonstration() {
    if (exhibitView) { exhibitView.reset(); return; }
    stopTimeline(); paused = false; updateControls();
    if (motionOff()) { notify('静态模式下可用“下一步”直接切换讲解位置。'); return; }
    const s = slides[pageIndex];
    landscape?.restart();
    if (activeGallery?.element.getClientRects().length) {
      const g=activeGallery; g.select(g.ids[0], false);
      timeline=gsap.timeline();
      g.ids.slice(1).forEach((id,i)=>timeline.call(()=>g.select(id),[],(i+1)*3.2));
      timeline.to({}, {duration:3.2}, (g.ids.length-1)*3.2);
    } else if (['process','layers','workflow','database','staffing'].includes(s.layout)) {
      const count = s.steps?.length || s.points.length;
      highlightStep(0);
      timeline = gsap.timeline({ onComplete: () => highlightStep(count - 1) });
      for (let i = 1; i < count; i++) timeline.call(() => highlightStep(i), [], i * 1.5);
      timeline.to({}, { duration: 1.5 }, (count - 1) * 1.5);
    } else if (s.layout === 'chart') {
      timeline = gsap.timeline(); timeline.fromTo('.area-fill', { scaleX: 0 }, { scaleX: 1, duration: .9, ease: 'power3.out' });
    } else intro(true);
  }
  function togglePause() {
    if (motionOff()) return;
    paused = !paused;
    if (paused) { timeline?.pause(); landscape?.pause(); mediaTween?.pause(); stepTween?.pause(); exhibitView?.pause(); }
    else { timeline?.resume(); landscape?.resume(); mediaTween?.resume(); stepTween?.resume(); exhibitView?.resume(); }
    updateControls();
  }
  function pauseAll() { paused = true; timeline?.pause(); landscape?.pause(); mediaTween?.pause(); stepTween?.pause(); exhibitView?.pause(); updateControls(); }
  function skipAnimation() {
    timeline?.progress(1).pause(); landscape?.pause(); mediaTween?.progress(1).pause(); stepTween?.progress(1).pause(); exhibitView?.finish?.();
    const s = slides[pageIndex];
    if (['process','workflow','database','staffing'].includes(s.layout) || (s.layout === 'layers' && !exhibitView)) highlightStep((s.steps || s.points).length - 1);
  }
  function openDialog(id) { pauseAll(); const d = $(id); if (!d.open) d.showModal(); }
  function renderContents() {
    const q = $('contents-search').value.trim().toLocaleLowerCase();
    const nodes = slides.flatMap((s, i) => {
      if (!s.title.toLocaleLowerCase().includes(q)) return [];
      const b = button('', () => { $('contents-dialog').close(); showPage(i, { animate:false, keyboard:true }); }, 'contents-entry');
      b.append(el('span', '', pad(i + 1)), el('strong', '', s.title.replaceAll('\n', '')));
      b.setAttribute('aria-current', String(i === pageIndex)); return [b];
    });
    $('contents-list').replaceChildren(...(nodes.length ? nodes : [el('p', 'contents-empty', '没有匹配页面，请尝试其他关键词。')]));
  }
  function fitOriginal() {
    const img = $('original-image');
    if (!img.naturalWidth || !img.naturalHeight) return;
    const box = $('image-scroll');
    const ratio = Math.min((box.clientWidth - 28) / img.naturalWidth, (box.clientHeight - 28) / img.naturalHeight, 1);
    fittedWidth = Math.max(30, ratio * img.naturalWidth);
    img.style.width = (fittedWidth * zoom) + 'px';
    $('zoom-level').textContent = zoom === 1 ? '适应窗口' : Math.round(zoom * 100) + '%';
  }
  function openImage(id) {
    const a = assets.get(id); if (!a) { notify('原件不存在。'); return; }
    pauseAll(); imageId = id; zoom = 1;
    const img = $('original-image'); img.hidden = true;
    $('image-title').textContent = RiverAtlasCaptions[id] || a.caption; img.alt = RiverAtlasCaptions[id] || a.caption;
    img.onload = () => { img.hidden = false; fitOriginal(); $('image-scroll').scrollTo(0, 0); };
    img.onerror = () => { notify('原件加载失败，请确认assets/originals目录完整。'); };
    img.style.transform = a.rotation ? 'rotate(' + a.rotation + 'deg)' : 'none';
    if (!$('image-dialog').open) $('image-dialog').showModal();
    img.src = a.path;
    if (img.complete && img.naturalWidth) { img.hidden = false; fitOriginal(); $('image-scroll').scrollTo(0, 0); }
  }
  function changeZoom(multiplier) { zoom = Math.max(.5, Math.min(8, zoom * multiplier)); fitOriginal(); }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { notify('浏览器未允许页面全屏。可使用浏览器F11进入会议展示。'); }
  }
  $('prev-button').append(icon('prev')); $('next-button').append(icon('next')); $('help-button').append(icon('help'));
  RiverAtlasChapters.forEach((name, chapter) => {
    const b = button(name, () => showPage(slides.findIndex(s => s.chapter === chapter)), 'chapter-button'); $('chapter-nav').append(b);
  });
  $('prev-button').addEventListener('click', () => showPage(pageIndex - 1));
  $('next-button').addEventListener('click', () => showPage(pageIndex + 1));
  $('contents-button').addEventListener('click', () => { $('contents-search').value = ''; renderContents(); openDialog('contents-dialog'); });
  $('contents-search').addEventListener('input', renderContents);
  $('help-button').addEventListener('click', () => openDialog('help-dialog'));
  $('fullscreen-button').addEventListener('click', toggleFullscreen);
  $('play-button').addEventListener('click', playDemonstration);
  $('pause-button').addEventListener('click', togglePause);
  $('replay-button').addEventListener('click', playDemonstration);
  $('skip-button').addEventListener('click', skipAnimation);
  $('step-button').addEventListener('click', () => {
    stopTimeline(); const s = slides[pageIndex]; highlightStep((currentStep + 1) % (s.steps || s.points).length);
  });
  $('static-button').addEventListener('click', () => { manualStatic = !manualStatic; skipAnimation(); updateControls(); if (!motionOff() && !paused) { landscape?.resume(); mediaTween?.resume(); stepTween?.resume(); exhibitView?.resume(); } });
  $('zoom-in').addEventListener('click', () => changeZoom(1.5));
  $('zoom-out').addEventListener('click', () => changeZoom(1 / 1.5));
  $('zoom-reset').addEventListener('click', () => { zoom = 1; fitOriginal(); $('image-scroll').scrollTo(0, 0); });
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => $(b.dataset.close).close()));
  window.addEventListener('hashchange', () => { const n = parseHash(); if (n !== pageIndex) showPage(n, { animate:false }); });
  window.addEventListener('resize', () => { fitStage(); landscape?.resize(); exhibitView?.refit(); activeGallery?.refit(); if ($('image-dialog').open) fitOriginal(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAll(); });
  document.addEventListener('fullscreenchange', () => {
    $('fullscreen-button').setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
    $('fullscreen-button').textContent = document.fullscreenElement ? '退出全屏' : '全屏'; fitStage();
  });
  reduceQuery.addEventListener('change', () => { skipAnimation(); updateControls(); });
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if ($('image-dialog').open) {
      if (e.key === '+' || e.key === '=') { changeZoom(1.5); e.preventDefault(); }
      if (e.key === '-') { changeZoom(1 / 1.5); e.preventDefault(); }
      return;
    }
    if (document.querySelector('dialog[open]') || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if(e.target.closest?.('.leaflet-container')&&['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','+','-','='].includes(e.key))return;
    if (['ArrowRight','PageDown','ArrowLeft','PageUp','Home','End'].includes(e.key)) {
      e.preventDefault();
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? slides.length - 1 : pageIndex + (['ArrowRight','PageDown'].includes(e.key) ? 1 : -1);
      showPage(n, { keyboard:true }); return;
    }
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    if (key === 'f') { e.preventDefault(); toggleFullscreen(); }
    if (key === 'p' || (key === ' ' && e.target.tagName !== 'BUTTON')) { e.preventDefault(); togglePause(); }
    if (key === 'r') playDemonstration();
    if (key === 'a' && !reduceQuery.matches) $('static-button').click();
    if (key === 's' && !$('step-button').disabled) $('step-button').click();
    if (key === '?') openDialog('help-dialog');
  });
  if (typeof gsap === 'undefined') notify('动画库未能加载，内容仍可阅读；请检查assets/vendor目录。');
  showPage(pageIndex); fitStage();
})();
