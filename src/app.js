/* 本地静态演示。所有来源文本均以DOM textContent显示，不解析用户HTML。 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const source = RiverAtlasSource;
  const slides = RiverAtlasSlides;
  const assets = new Map(source.assets.map(a => [a.id, a]));
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let pageIndex = parseHash(), currentStep = 0, timeline = null, mapTween = null;
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
  function assetImage(id, className = '') {
    const a = assets.get(id); if (!a) return el('p', '', '原件未找到，请核对配套资源。');
    const img = el('img', className); img.src = a.path; img.alt = RiverAtlasCaptions[id] || '原稿图像';
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
    const portraits = new Set([5,6,7,8,9,10,11,15,16,20,21,22,23,27,31,32,35,36,37,38,39,40,41,42]);
    function select(id, animate = true) {
      active = id;
      const partner = ids.find(other => other !== id && portraits.has(other));
      const shown = portraits.has(id) && partner ? [id, partner] : [id];
      spread.classList.toggle('paired', shown.length === 2);
      spread.replaceChildren(...shown.map(asset => {
        const b = button('', () => openImage(asset), 'image-button');
        if ([24,25,26,33,34].includes(asset)) b.classList.add('photo-surface');
        b.dataset.asset = asset; b.setAttribute('aria-label', '查看原件：' + RiverAtlasCaptions[asset]);
        b.append(assetImage(asset)); return b;
      }));
      caption.textContent = RiverAtlasCaptions[id];
      for (const b of tabs.children) b.setAttribute('aria-pressed', String(Number(b.dataset.asset) === id));
      if (animate && !motionOff() && !paused) {
        mediaTween?.kill(); mediaTween = gsap.fromTo(spread.children, { opacity:0, y:24, rotationY:7, scale:.96 },
          { opacity:1, y:0, rotationY:0, scale:1, duration:.85, stagger:.12, ease:'power3.out' });
      }
    }
    ids.forEach((id, i) => {
      const label = RiverAtlasCaptions[id];
      const b = button(pad(i+1), () => { stopTimeline(); select(id); });
      b.dataset.asset = id; b.title = label; b.setAttribute('aria-label', label); tabs.append(b);
    });
    const tools = el('div', 'gallery-tools');
    const focus = button('专注图件', () => {
      const layout = c.closest('.gallery-layout'); if (!layout) return;
      const on = layout.dataset.focus !== 'true'; layout.dataset.focus = String(on);
      layout.closest('.slide')?.classList.toggle('media-focus',on);
      focus.textContent = on ? '显示讲解' : '专注图件'; focus.setAttribute('aria-pressed', String(on));
    }, 'focus-media'); focus.setAttribute('aria-pressed','false');
    tools.append(tabs, focus); c.append(spread, tools, caption); select(active, false);
    activeGallery = { element:c, ids, select };
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
    const c = el('div', 'map-layout'), list = el('div', 'river-list'), figure = el('div', 'map-figure');
    const windowEl = el('div', 'map-window'), img = assetImage(12); windowEl.append(img);
    function select(i) {
      const r = s.rivers[i];
      for (const b of list.children) b.setAttribute('aria-pressed', String(Number(b.dataset.river) === i));
      img.style.transformOrigin = (r[2] * 100) + '% ' + (r[3] * 100) + '%';
      mapTween?.kill();
      if (motionOff() || paused) img.style.transform = 'scale(1.75)';
      else mapTween = gsap.to(img, { scale: 1.75, duration: .35, ease:'power3.out', overwrite:true });
      desc.textContent = r[0] + ' · ' + r[1];
    }
    s.rivers.forEach((r, i) => {
      const b = button('', () => select(i), 'river-choice'); b.dataset.river = i;
      b.append(el('strong', '', r[0]), el('span', '', r[1])); b.setAttribute('aria-pressed', 'false'); list.append(b);
    });
    const controls = el('div', 'map-controls'), desc = el('span', '', '五河空间分布图');
    controls.append(desc, button('恢复全图', () => {
      mapTween?.kill(); img.style.transform = 'none';
      for (const b of list.children) b.setAttribute('aria-pressed', 'false');
      desc.textContent = '五河空间分布图';
    }), button('查看原件', () => openImage(12)));
    figure.append(windowEl, controls); c.append(list, figure); return c;
  }
  function renderLayers(s) {
    const layout=el('div','atlas-layers-layout'), list=el('div','atlas-layer-list'), display=el('div','atlas-layer-display');
    const scene=el('div','atlas-layer-scene'), stack=el('div','atlas-stack'), controls=el('div','atlas-layer-controls');
    const textures=[
      {id:19,region:[.62,.18,.32,.18],label:'卫星 / 正射影像'},
      {id:17,region:[.04,.18,.92,.57],label:'范围与现势'},
      {id:18,region:[.03,.20,.94,.55],label:'权属成果'},
      {id:19,region:[.10,.30,.84,.55],label:'管制与保护'}
    ];
    let selected=0,expanded=true,motion=null,orbit=null,disposed=false;
    const planes=[],choices=[],crops=[];
    function fit() {
      if(disposed)return;
      for(const crop of crops){
        const {img,box,region}=crop;if(!img.naturalWidth||!box.clientWidth)continue;
        const [rx,ry,rw,rh]=region,nw=img.naturalWidth,nh=img.naturalHeight;
        const scale=Math.max(box.clientWidth/(rw*nw),box.clientHeight/(rh*nh));
        img.style.width=nw+'px';img.style.height=nh+'px';
        img.style.transform='translate3d('+(box.clientWidth/2-(rx+rw/2)*nw*scale)+'px,'+(box.clientHeight/2-(ry+rh/2)*nh*scale)+'px,0) scale('+scale+')';
      }
      const scale=Math.min(1,(scene.clientWidth-24)/960,(scene.clientHeight-18)/565);
      if(typeof gsap!=='undefined')gsap.set(stack,{scale:Math.max(.32,scale)});
      else stack.style.transform='translate(-50%,-50%) scale('+Math.max(.32,scale)+') rotateX(50deg) rotateZ(-18deg)';
    }
    function paint(animate=true){
      if(disposed)return;
      motion?.kill();const moving=animate&&!motionOff()&&!paused;
      motion=moving?gsap.timeline():null;
      planes.forEach((plane,i)=>{
        const values={z:expanded?i*64+(i===selected?18:0):(i===selected?6:i*1.2),x:expanded?(i-1.5)*18+(i===selected?-32:0):0};
        plane.classList.toggle('active',i===selected);choices[i].setAttribute('aria-pressed',String(i===selected));
        if(typeof gsap==='undefined')plane.style.transform='translate3d('+values.x+'px,0,'+values.z+'px)';
        else if(moving)motion.to(plane,{...values,duration:.55,ease:'power3.out'},0);
        else gsap.set(plane,values);
      });
      expandButton.setAttribute('aria-pressed',String(expanded));collapseButton.setAttribute('aria-pressed',String(!expanded));
    }
    s.points.forEach(([title,text],i)=>{
      const choice=button('',()=>highlightStep(i),'atlas-layer-choice');choice.setAttribute('aria-label',title);
      choice.append(el('h2','',title),el('p','',text));
      choice.addEventListener('pointerenter',()=>{if(matchMedia('(hover: hover) and (pointer: fine)').matches)highlightStep(i);});
      choices.push(choice);list.append(choice);
      const plane=button('',()=>openImage(textures[i].id),'atlas-plane');plane.dataset.layer=i;
      plane.setAttribute('aria-label','查看'+title+'图件');
      const box=el('div','atlas-raster-frame'),img=assetImage(textures[i].id,'atlas-raster');box.append(img);
      plane.append(box,el('span','atlas-plane-label',textures[i].label));planes.push(plane);stack.append(plane);
      crops.push({img,box,region:textures[i].region});img.addEventListener('load',fit);
    });
    const expandButton=button('分层',()=>{expanded=true;paint();},'atlas-mode');
    const collapseButton=button('合拢',()=>{expanded=false;paint();},'atlas-mode');
    controls.append(expandButton,collapseButton,button('查看图件',()=>openImage(textures[selected].id),'atlas-open'));
    scene.append(stack,el('span','atlas-scene-label','分层示意'));display.append(scene,controls);layout.append(list,display);
    if(typeof gsap!=='undefined')gsap.set(stack,{x:0,y:0,xPercent:-50,yPercent:-50,rotationX:50,rotationZ:-18});
    scene.addEventListener('pointermove',event=>{
      if(motionOff()||paused||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
      const rect=scene.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;
      orbit?.kill();orbit=gsap.to(stack,{rotationX:50-y*5,rotationZ:-18+x*5,duration:.3,ease:'power3.out',overwrite:'auto'});
    });
    scene.addEventListener('pointerleave',()=>{if(!motionOff()&&!paused){orbit?.kill();orbit=gsap.to(stack,{rotationX:50,rotationZ:-18,duration:.3,ease:'power3.out'});}});
    exhibitView={resetLabel:'复位图层',reset:()=>{expanded=true;orbit?.kill();if(typeof gsap!=='undefined')gsap.set(stack,{rotationX:50,rotationZ:-18});highlightStep(0);},
      selectStep:index=>{selected=index;paint();},refit:fit,pause:()=>{motion?.pause();orbit?.pause();},resume:()=>{motion?.resume();orbit?.resume();},
      finish:()=>{motion?.progress(1).pause();orbit?.progress(1).pause();},destroy:()=>{disposed=true;motion?.kill();orbit?.kill();}};
    paint(false);return layout;
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
  function stopTimeline() { timeline?.kill(); timeline = null; mapTween?.kill(); mapTween = null; mediaTween?.kill(); mediaTween=null; stepTween?.kill(); stepTween=null; }
  function highlightStep(n) {
    const s = slides[pageIndex], total = s.steps?.length || s.points?.length || 1;
    currentStep = Math.max(0, Math.min(total - 1, n));
    document.querySelectorAll('.process-node').forEach((node, i) => {
      node.classList.toggle('active', i === currentStep); node.setAttribute('aria-pressed', String(i === currentStep));
    });
    document.querySelectorAll('.layer-plane').forEach(node => node.classList.toggle('active', Number(node.dataset.layer) === currentStep));
    if (!motionOff() && !paused) {
      stepTween?.kill(); stepTween=gsap.timeline();
      const node=document.querySelector('.process-node.active');
      if (node) stepTween.fromTo(node,{y:9},{y:0,duration:.55,ease:'power3.out'});
      document.querySelectorAll('.layer-plane').forEach(plane=> {
        const selected=Number(plane.dataset.layer)===currentStep;
        stepTween.to(plane,{x:selected ? -22:0,scale:selected ? 1.045:1,duration:.7,ease:'power3.out'},0);
      });
    }
    exhibitView?.selectStep?.(currentStep);
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
      if (s.note && s.layout==='boundaries') slide.append(el('p','slide-note',s.note));
    }
    $('presentation').replaceChildren(slide);
    if (slide.classList.contains('cover-slide')) landscape=RiverAtlasLandscape.create(slide,{staticMode:motionOff(),paused});
    $('page-count').textContent = pad(pageIndex + 1) + ' / ' + slides.length;
    $('stage').dataset.page = String(pageIndex + 1);
    $('prev-button').disabled = pageIndex === 0; $('next-button').disabled = pageIndex === slides.length - 1;
    $('step-button').disabled = !['process', 'layers'].includes(s.layout);
    document.querySelectorAll('.chapter-button').forEach((b, i) => b.setAttribute('aria-current', String(i === s.chapter)));
    $('page-progress-fill').style.transform = 'scaleX(' + (pageIndex + 1) / slides.length + ')';
    try { history.replaceState(null, '', '#p' + (pageIndex + 1)); } catch { location.hash = 'p' + (pageIndex + 1); }
    updateControls(); highlightStep(0); fitStage(); exhibitView?.refit(); intro(animate, direction);
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
    } else if (s.layout === 'process' || s.layout === 'layers') {
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
    if (paused) { timeline?.pause(); mapTween?.pause(); landscape?.pause(); mediaTween?.pause(); stepTween?.pause(); exhibitView?.pause(); }
    else { timeline?.resume(); mapTween?.resume(); landscape?.resume(); mediaTween?.resume(); stepTween?.resume(); exhibitView?.resume(); }
    updateControls();
  }
  function pauseAll() { paused = true; timeline?.pause(); mapTween?.pause(); landscape?.pause(); mediaTween?.pause(); stepTween?.pause(); exhibitView?.pause(); updateControls(); }
  function skipAnimation() {
    timeline?.progress(1).pause(); mapTween?.progress(1).pause(); landscape?.pause(); mediaTween?.progress(1).pause(); stepTween?.progress(1).pause(); exhibitView?.finish?.();
    const s = slides[pageIndex];
    if (s.layout === 'process' || (s.layout === 'layers' && !exhibitView)) highlightStep((s.steps || s.points).length - 1);
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
    $('contents-list').replaceChildren(...(nodes.length ? nodes : [el('p', 'source-empty', '没有匹配页面，请尝试其他关键词。')]));
  }
  function imageGrid(ids) {
    const c = el('div', 'source-image-grid');
    for (const id of ids) {
      const b = button('', () => openImage(id), 'source-image'); b.setAttribute('aria-label', '查看原件：' + RiverAtlasCaptions[id]);
      const img = assetImage(id); img.loading = 'lazy';
      b.append(img, el('span', '', RiverAtlasCaptions[id])); c.append(b);
    }
    return c;
  }
  function renderSources(mode = 'current') {
    for (const [id, value] of [['current-sources','current'],['all-sources','all'],['all-images','images']]) $(id).setAttribute('aria-pressed', String(mode === value));
    const content = $('sources-content'); content.replaceChildren();
    if (mode==='current' && slides[pageIndex].note) content.append(el('p','source-explanation',slides[pageIndex].note));
    if (mode === 'images') {
      content.append(imageGrid(source.assets.filter(a => a.business).map(a => a.id))); return;
    }
    const pages = mode === 'all' ? source.slides : source.slides.filter(s => slides[pageIndex].sources.includes(s.page));
    for (const s of pages) {
      const section = el('section', 'source-page'); section.dataset.sourcePage = s.page;
      section.append(el('h3', '', '原稿第' + s.page + '页'));
      if (!s.paragraphs.length && !s.tables.length) section.append(el('p', 'source-empty', '本页信息主要由原始图像表达。'));
      for (const p of s.paragraphs) section.append(el('p', 'source-paragraph', p));
      for (const rows of s.tables) { const wrap = el('div', 'source-table-wrap'); wrap.append(renderTable({ rows }, 'source-table')); section.append(wrap); }
      if (s.images.length) section.append(imageGrid(s.images));
      content.append(section);
    }
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
    $('image-title').textContent = RiverAtlasCaptions[id]; img.alt = RiverAtlasCaptions[id];
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
  $('sources-button').addEventListener('click', () => { renderSources(); openDialog('sources-dialog'); });
  $('current-sources').addEventListener('click', () => renderSources());
  $('all-sources').addEventListener('click', () => renderSources('all'));
  $('all-images').addEventListener('click', () => renderSources('images'));
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
  window.addEventListener('resize', () => { fitStage(); landscape?.resize(); exhibitView?.refit(); if ($('image-dialog').open) fitOriginal(); });
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
