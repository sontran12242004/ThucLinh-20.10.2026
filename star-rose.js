// A rose blossom made entirely from tiny heart-shaped stars, without stem or leaves.
window.StarRose=(()=>{
 let canvas,frameId=0,epoch=0;
 const tau=Math.PI*2;
 function stop(){epoch++;cancelAnimationFrame(frameId);canvas?.remove();canvas=null}
 function heart(c,x,y,s){c.beginPath();c.moveTo(x,y+s*.34);c.bezierCurveTo(x-s*.7,y-s*.12,x-s*.45,y-s*.64,x,y-s*.28);c.bezierCurveTo(x+s*.45,y-s*.64,x+s*.7,y-s*.12,x,y+s*.34);c.closePath()}
 function sprite(color){const el=document.createElement('canvas');el.width=40;el.height=40;const c=el.getContext('2d');c.shadowColor=color;c.shadowBlur=2;c.fillStyle=color;heart(c,20,21,22);c.fill();return el}
 let surfacePromise;
 function loadSurface(){
  if(!surfacePromise)surfacePromise=Promise.all(['assets/rose-surface.bin','assets/rose-normals.bin'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('Cannot load rose');return r.arrayBuffer()}).then(buffer=>new Float32Array(buffer)))).catch(error=>{surfacePromise=null;throw error});
  return surfacePromise;
 }
 function build([surface,normals]){
  const points=[];
  for(let i=0;i<surface.length;i+=3){
   const z=surface[i+2],edge=Math.random()<.16;
   points.push({x:surface[i],y:surface[i+1],z,nx:normals[i],ny:normals[i+1],nz:normals[i+2],phase:Math.random()*tau,rate:.001+Math.random()*.002,size:edge?1.1+Math.random()*.45:.7+Math.random()*.5,edge,color:z>.2?3:Math.random()<.5?0:1});
  }
  return points;
 }
 async function start(stage,reduced){
  stop();const token=epoch;let surface;
  try{surface=await loadSurface()}catch{return}
  if(token!==epoch)return;
  canvas=document.createElement('canvas');canvas.className='star-rose';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Đóa hoa hồng ba chiều kết từ những ngôi sao trái tim hồng lấp lánh');stage.append(canvas);
  const c=canvas.getContext('2d'),points=build(surface),sprites=['#742442','#a73560','#d84d83','#f783b1','#ffb2d2','#ffe3ef'].map(sprite),began=performance.now();let width=0,height=0,lastDraw=-Infinity;
  function frame(now){
   if(token!==epoch||!canvas)return;
   if(!reduced&&now-lastDraw<30){frameId=requestAnimationFrame(frame);return}lastDraw=now;
   const w=stage.clientWidth,h=stage.clientHeight,dpr=Math.min(2,devicePixelRatio||1);
   if(w!==width||h!==height){canvas.width=w*dpr;canvas.height=h*dpr;width=w;height=h}
   c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
   const time=reduced?3000:now-began,reveal=reduced?1:Math.min(1,time/2200),opening=1-Math.pow(1-reveal,3),scale=Math.min(w*.38,h*.35,335),spin=reduced?0:(time%45000)/45000*tau,tilt=Math.PI/4,sway=0;
   const glow=c.createRadialGradient(w/2,h*.47,0,w/2,h*.47,scale*1.3);glow.addColorStop(0,'#e04e8910');glow.addColorStop(1,'#e04e8900');c.fillStyle=glow;c.fillRect(0,0,w,h);
   const depthGrid=new Map();
   const projected=points.map(p=>{
    const xx=p.x*Math.cos(spin)-p.y*Math.sin(spin),yy=p.x*Math.sin(spin)+p.y*Math.cos(spin),y=yy*Math.cos(tilt)-p.z*Math.sin(tilt),zz=yy*Math.sin(tilt)+p.z*Math.cos(tilt),x=xx*Math.cos(sway)+zz*Math.sin(sway),z=zz*Math.cos(sway)-xx*Math.sin(sway),perspective=4/(4-z);
    const nx=p.nx*Math.cos(spin)-p.ny*Math.sin(spin),ny0=p.nx*Math.sin(spin)+p.ny*Math.cos(spin),ny=ny0*Math.cos(tilt)-p.nz*Math.sin(tilt),nz=ny0*Math.sin(tilt)+p.nz*Math.cos(tilt);
    const light=Math.min(1,Math.abs(-.36*nx-.48*ny+.8*nz)),color=Math.min(5,Math.floor(light*5.9));
    const sx=w/2+x*scale*perspective*(.75+.25*opening),sy=h*.52+y*scale*perspective*(.75+.25*opening),key=Math.floor(sx/3)+Math.floor(sy/3)*Math.ceil(w/3);
    depthGrid.set(key,Math.max(depthGrid.get(key)??-Infinity,z));
    return {...p,sx,sy,depth:z,perspective,color,key};
   }).sort((a,b)=>a.depth-b.depth);
   for(const p of projected){
    const twinkle=reduced?.9:.72+.28*Math.pow((1+Math.sin(time*p.rate+p.phase))/2,3),size=p.size*Math.max(.85,scale/230)*p.perspective*3.2;
    const obscured=(depthGrid.get(p.key)-p.depth)>.055;
    c.globalAlpha=opening*twinkle*(obscured?.12:.96);c.drawImage(sprites[p.color],p.sx-size/2,p.sy-size/2,size,size);
    if(!obscured&&p.edge&&twinkle>.998){c.globalAlpha=opening*.8;c.fillStyle='#fff0f8';c.fillRect(p.sx-.45,p.sy-4,.9,8);c.fillRect(p.sx-4,p.sy-.45,8,.9)}
   }
   c.globalAlpha=1;if(!reduced)frameId=requestAnimationFrame(frame);
  }
  frameId=requestAnimationFrame(frame);
 }
 return {start,stop};
})();
