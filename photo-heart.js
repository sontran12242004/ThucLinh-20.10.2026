// Curved photo mosaic. The manifest is populated with the user's own photos.
window.PhotoHeart=(()=>{
 let canvas,ctx,raf=0,run=0;
 const outline=Array.from({length:240},(_,i)=>{const t=i/240*Math.PI*2;return {x:Math.pow(Math.sin(t),3),y:-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16}});
 const ymin=Math.min(...outline.map(p=>p.y)),ymax=Math.max(...outline.map(p=>p.y));
 function stop(){run++;cancelAnimationFrame(raf);canvas?.remove();canvas=null}
 function path(c){c.beginPath();outline.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath()}
 function depth(x,y){let d=Infinity;for(const p of outline)d=Math.min(d,Math.hypot(x-p.x,y-p.y));return .20+.39*Math.sqrt(Math.min(1,d/.48))}
 function makePanel(img,index,x0,y0,width,height){
  const texture=document.createElement('canvas');texture.width=512;texture.height=512;const c=texture.getContext('2d');
  c.save();c.scale(512/width,512/height);c.translate(-x0,-y0);path(c);c.restore();c.clip();
  c.beginPath();c.roundRect(0,0,512,512,14);c.clip();
  // Fill every tile; favour the upper portrait area when cropping is necessary.
  const aspect=width/height,iw=img.naturalWidth,ih=img.naturalHeight;
  let sw=iw,sh=iw/aspect;if(sh>ih){sh=ih;sw=ih*aspect}
  c.drawImage(img,(iw-sw)/2,(ih-sh)*.28,sw,sh,0,0,512,512);
  const shade=c.createLinearGradient(0,0,512,512);shade.addColorStop(0,'#fff1');shade.addColorStop(.45,'#fff0');shade.addColorStop(1,'#16001520');c.fillStyle=shade;c.fillRect(0,0,512,512);
  const vertices=[],n=4;
  for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){const px=x0+x/n*width,py=y0+y/n*height;vertices.push({x:px,y:py,z:depth(px,py),u:x/n*512,v:y/n*512})}
  return {texture,vertices,n,index,cx:x0+width/2,cy:y0+height/2,delay:index*85,duration:2200+Math.random()*500,spin:(index%2?1:-1)*(.25+Math.random()*.3)};
 }
 function triangle(tex,a,b,c){
  const det=(b.u-a.u)*(c.v-a.v)-(c.u-a.u)*(b.v-a.v);if(Math.abs(det)<.001)return;
  const m0=((b.x-a.x)*(c.v-a.v)-(c.x-a.x)*(b.v-a.v))/det,m2=((c.x-a.x)*(b.u-a.u)-(b.x-a.x)*(c.u-a.u))/det;
  const m1=((b.y-a.y)*(c.v-a.v)-(c.y-a.y)*(b.v-a.v))/det,m3=((c.y-a.y)*(b.u-a.u)-(b.y-a.y)*(c.u-a.u))/det;
  ctx.save();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();ctx.clip();ctx.transform(m0,m1,m2,m3,a.x-m0*a.u-m2*a.v,a.y-m1*a.u-m3*a.v);ctx.drawImage(tex,0,0);ctx.restore();
 }
 async function start(stage,reduced){
  stop();const token=run;let sources;
  try{const response=await fetch('assets/photos.json');if(!response.ok)return;sources=await response.json()}catch{return}
  if(!Array.isArray(sources)||!sources.length||run!==token)return;
  const photos=(await Promise.all(sources.map(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src})))).filter(Boolean);
  if(!photos.length||run!==token)return;
  canvas=document.createElement('canvas');canvas.className='photo-heart';canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Những bức ảnh của em ghép thành trái tim ba chiều');stage.append(canvas);ctx=canvas.getContext('2d');
  const panels=[];let index=0;
  [4,7,7,6,4,2].forEach((cols,row)=>{
   const y0=ymin+row*(ymax-ymin)/6,height=(ymax-ymin)/6;
   const band=outline.filter(p=>p.y>=y0&&p.y<=y0+height);
   const halfWidth=Math.max(...band.map(p=>Math.abs(p.x)));
   const width=halfWidth*2/cols,gap=.010;
   for(let col=0;col<cols;col++){
    panels.push(makePanel(photos[index%photos.length],index,-halfWidth+col*width+gap/2,y0+gap/2,width-gap,height-gap));index++;
   }
  });
  // The back uses the same photos, facing outward, so a complete turn stays filled.
  for(const panel of [...panels])panels.push({...panel,vertices:panel.vertices.map(p=>({...p,x:-p.x,z:-p.z}))});
  // A continuous photo belt closes the side between the two curved faces.
  // Its edges tuck slightly inside the faces so no black seam opens during rotation.
  const rimCount=16;
  const rimY=t=>-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16;
  for(let segment=0;segment<rimCount;segment++)for(let column=0;column<2;column++){
   const img=photos[(segment*2+column+9)%photos.length],texture=document.createElement('canvas');texture.width=512;texture.height=512;
   const c=texture.getContext('2d'),iw=img.naturalWidth,ih=img.naturalHeight,aspect=.62;
   let sw=iw,sh=iw/aspect;if(sh>ih){sh=ih;sw=ih*aspect}
   c.drawImage(img,(iw-sw)/2,(ih-sh)*.28,sw,sh,0,0,512,512);
   const vertices=[],n=4,mid=(segment+.5)/rimCount*Math.PI*2;
   const downward=rimY((segment+1)/rimCount*Math.PI*2)>=rimY(segment/rimCount*Math.PI*2),right=Math.sin(mid)>0;
   for(let v=0;v<=n;v++)for(let u=0;u<=n;u++){
    const t=(segment+u/n)/rimCount*Math.PI*2,b=(column+v/n)/2;
    const swell=.985+.045*Math.sin(b*Math.PI),x=Math.pow(Math.sin(t),3)*swell,y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/16*swell;
    vertices.push({x,y,z:(b-.5)*.64,u:(right?1-v/n:v/n)*512,v:(downward?u/n:1-u/n)*512});
   }
   panels.push({texture,vertices,n,index:segment,delay:segment*65,duration:2400,spin:(segment%2?1:-1)*.3});
  }
  const began=performance.now();let previousW=0,previousH=0;
  function frame(now){
   if(token!==run||!canvas)return;const w=stage.clientWidth,h=stage.clientHeight,dpr=Math.min(2,devicePixelRatio||1);
   if(w!==previousW||h!==previousH){canvas.width=w*dpr;canvas.height=h*dpr;previousW=w;previousH=h}
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
   const elapsed=reduced?10000:now-began,unit=Math.min(w*.40,h*.37,365),idle=Math.max(0,elapsed-5400),yaw=reduced?0:idle*Math.PI*2/55000,pitch=reduced?0:Math.sin(idle*.00028)*.065;
   const glow=ctx.createRadialGradient(w/2,h*.47,unit*.1,w/2,h*.47,unit*1.4);glow.addColorStop(0,'#df387319');glow.addColorStop(1,'#df387300');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
   const triangles=[];
   for(const panel of panels){
    const t=Math.max(0,Math.min(1,(elapsed-panel.delay)/panel.duration));if(!t)continue;const e=1-Math.pow(1-t,3),corner=panel.index%4,sx=(corner%2?1:-1)*(w/2+unit*.6),sy=(corner<2?-1:1)*(h/2+unit*.6),angle=panel.spin*(1-e),ca=Math.cos(angle),sa=Math.sin(angle);
    const verts=panel.vertices.map(p=>{
     let x=p.x*Math.cos(yaw)+p.z*Math.sin(yaw),z=p.z*Math.cos(yaw)-p.x*Math.sin(yaw),y=p.y*Math.cos(pitch)-z*Math.sin(pitch);z=z*Math.cos(pitch)+p.y*Math.sin(pitch);
     const perspective=4/(4-z),scale=.68+.32*e,px=x*unit*perspective*scale,py=y*unit*perspective*scale;
     return {x:w/2+px*ca-py*sa+sx*(1-e),y:h*.46+px*sa+py*ca+sy*(1-e)+Math.sin(t*Math.PI)*panel.spin*unit*.3,z,u:p.u,v:p.v};
    });
    const alpha=Math.min(1,t*5);
    for(let y=0;y<panel.n;y++)for(let x=0;x<panel.n;x++){const i=y*(panel.n+1)+x,a=verts[i],b=verts[i+1],c=verts[i+panel.n+1],d=verts[i+panel.n+2];for(const points of [[a,b,c],[b,d,c]]){
     const [v0,v1,v2]=points,area=(v1.x-v0.x)*(v2.y-v0.y)-(v1.y-v0.y)*(v2.x-v0.x);
     if(area>.001)triangles.push({texture:panel.texture,points,alpha,z:(v0.z+v1.z+v2.z)/3});
    }}
   }
   triangles.sort((a,b)=>a.z-b.z);
   for(const face of triangles){ctx.globalAlpha=face.alpha;triangle(face.texture,...face.points)}
   ctx.globalAlpha=1;if(!reduced)raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
 }
 return {start,stop};
})();
