// Render complete shaped lines before sampling: Vietnamese marks and cursive joins stay intact.
window.HeartWish=(()=>{
 let canvas,raf=0,generation=0;
 const message='Chúc em một ngày 20/10 thật ngọt ngào. Cảm ơn em đã là điều dịu dàng nhất trong cuộc sống của anh';
 function stop(){generation++;cancelAnimationFrame(raf);canvas?.remove();canvas=null}
 function heart(c,x,y,s){c.beginPath();c.moveTo(x,y+s*.4);c.bezierCurveTo(x-s*.7,y-s*.15,x-s*.4,y-s*.65,x,y-s*.25);c.bezierCurveTo(x+s*.4,y-s*.65,x+s*.7,y-s*.15,x,y+s*.4);c.closePath();c.fill()}
 async function start(stage,reduced){
  stop();const token=generation;await document.fonts.load('40px "Great Vibes"',message);if(token!==generation)return;
  canvas=document.createElement('canvas');canvas.className='heart-wish-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',message);stage.append(canvas);
  const ctx=canvas.getContext('2d'),stamp=document.createElement('canvas');stamp.width=24;stamp.height=24;const sc=stamp.getContext('2d');sc.fillStyle='#ffb7d6';heart(sc,12,12,19);
  let width=0,height=0,points=[],last=-Infinity;const began=performance.now();
  function layout(w,h){
   const lines=w<600?['Chúc em một ngày 20/10','thật ngọt ngào.','Cảm ơn em đã là điều','dịu dàng nhất','trong cuộc sống của anh']:['Chúc em một ngày 20/10 thật ngọt ngào.','Cảm ơn em đã là điều dịu dàng nhất','trong cuộc sống của anh'];
   const scratch=document.createElement('canvas'),c=scratch.getContext('2d');let size=Math.min(w<600?42:64,h/(lines.length*1.65+3));c.font=`${size}px "Great Vibes"`;
   const widest=Math.max(...lines.map(line=>c.measureText(line).width));size*=Math.min(1,(w-44)/widest);const lineHeight=size*1.6,totalHeight=lines.length*lineHeight,top=(h-totalHeight)/2;
   points=[];let delay=1900;
   for(let row=0;row<lines.length;row++){
    const text=lines[row].normalize('NFC');scratch.width=Math.ceil(w*2);scratch.height=Math.ceil(lineHeight*2+size*2);c.setTransform(2,0,0,2,0,0);c.font=`${size}px "Great Vibes"`;c.textBaseline='alphabetic';c.fillStyle='#fff';c.strokeStyle='#fff';c.lineWidth=.35;
    const textWidth=c.measureText(text).width,x=(w-textWidth)/2,baseline=size*1.12;c.fillText(text,x,baseline);c.strokeText(text,x,baseline);
    const pixels=c.getImageData(0,0,scratch.width,scratch.height).data,letters=Array.from(text),bounds=[];let prefix='';
    for(const ch of letters){prefix+=ch;bounds.push({end:c.measureText(prefix).width,time:delay});delay+=ch===' '?35:65;if(ch==='.')delay+=350}
    const step=w<600?2.7:3.2;
    for(let py=0;py<scratch.height;py+=step)for(let px=0;px<scratch.width;px+=step){const alpha=pixels[(Math.floor(py)*scratch.width+Math.floor(px))*4+3];if(alpha<80)continue;const localX=px/2-x,bound=bounds.find(b=>b.end>=localX)||bounds[bounds.length-1];points.push({x:px/2,y:top+row*lineHeight+py/2,time:bound.time,size:w<600?2.15:2.6,alpha:.8+alpha/255*.2})}
    delay+=130;
   }
  }
  function frame(now){
   if(token!==generation||!canvas)return;if(!reduced&&now-last<40){raf=requestAnimationFrame(frame);return}last=now;
   const w=stage.clientWidth,h=stage.clientHeight,dpr=Math.min(devicePixelRatio||1,2);if(w!==width||h!==height){width=w;height=h;canvas.width=w*dpr;canvas.height=h*dpr;layout(w,h)}
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const elapsed=reduced?1e6:now-began;
   for(const p of points){if(elapsed<p.time)continue;ctx.globalAlpha=p.alpha*Math.min(1,(elapsed-p.time)/150);ctx.drawImage(stamp,p.x-p.size/2,p.y-p.size/2,p.size,p.size)}
   ctx.globalAlpha=1;if(!reduced)raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
 }
 return {start,stop};
})();
