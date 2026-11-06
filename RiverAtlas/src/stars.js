/* A quiet, pointer-driven field. It does not advance slides or run an idle animation. */
const RiverAtlasStars = (() => {
  'use strict';
  function create() {
    const canvas=document.createElement('canvas');canvas.id='starfield';canvas.setAttribute('aria-hidden','true');
    document.body.prepend(canvas);
    const ctx=canvas.getContext('2d');
    if(!ctx){canvas.remove();return {setState(){}};}
    let seed=81247,w=0,h=0,x=0,y=0,targetX=0,targetY=0,request=0,paused=false,staticMode=false;
    const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    const stars=Array.from({length:207},(_,i)=>({x:random(),y:random(),depth:i<150?.3:i<195?.65:1,r:i<150?.45+random()*.35:i<195?.7+random()*.4:1+random()*.35}));
    function draw() {
      ctx.clearRect(0,0,w,h);
      const mist=ctx.createRadialGradient(w*.73,h*.24,0,w*.73,h*.24,w*.55);
      mist.addColorStop(0,'rgba(45,105,148,.06)');mist.addColorStop(1,'rgba(45,105,148,0)');
      ctx.fillStyle=mist;ctx.fillRect(0,0,w,h);
      for(const star of stars) {
        const px=star.x*(w+40)-20+x*star.depth,py=star.y*(h+30)-15+y*star.depth;
        ctx.fillStyle='rgba(185,218,237,'+(.16+star.depth*.18)+')';
        ctx.beginPath();ctx.arc(px,py,star.r,0,Math.PI*2);ctx.fill();
        if(star.depth===1){ctx.strokeStyle='rgba(145,198,224,.12)';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(px-3,py);ctx.lineTo(px+3,py);ctx.moveTo(px,py-3);ctx.lineTo(px,py+3);ctx.stroke();}
      }
    }
    function tick() {
      request=0;if(paused||staticMode||document.hidden)return;
      x+=(targetX-x)*.15;y+=(targetY-y)*.15;draw();
      if(Math.abs(targetX-x)+Math.abs(targetY-y)>.035)request=requestAnimationFrame(tick);
      else {x=targetX;y=targetY;draw();}
    }
    function start(){if(!request&&!paused&&!staticMode&&!document.hidden)request=requestAnimationFrame(tick);}
    function resize(){
      w=window.innerWidth;h=window.innerHeight;const ratio=Math.min(1,1920/Math.max(w,1));
      canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);draw();
    }
    function setState(next){
      const wasStatic=staticMode;paused=next.paused;staticMode=next.staticMode;
      if(paused||staticMode){cancelAnimationFrame(request);request=0;}
      if(staticMode&&!wasStatic){x=y=targetX=targetY=0;draw();}
      if(!paused&&!staticMode&&Math.abs(targetX-x)+Math.abs(targetY-y)>.035)start();
    }
    window.addEventListener('pointermove',event=>{
      if(paused||staticMode||document.hidden)return;
      targetX=(event.clientX/Math.max(w,1)-.5)*28;targetY=(event.clientY/Math.max(h,1)-.5)*20;start();
    },{passive:true});
    window.addEventListener('resize',resize);
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(request);request=0;});
    resize();return {setState};
  }
  return {create};
})();
