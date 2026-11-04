

/* Visual-only depth rasteriser and monochrome edge treatment.
   The game already supplies projected 2D faces with camera-space depth. This
   module resolves visibility per pixel; it never changes the simulation. */
(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.ScrapVehicleRaster=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SLOT_IDS=Object.freeze({chassis:1,engine:2,tyres:3,gadget:4});
  const COLOURS=new Map();
  function rgb(hex){
    if(!COLOURS.has(hex))COLOURS.set(hex,[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
    return COLOURS.get(hex);
  }
  function createSurface(width,height){
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>2048||height>2048)throw new RangeError('Invalid vehicle raster size');
    const count=width*height,depth=new Float32Array(count);depth.fill(-Infinity);
    return {width,height,pixels:new Uint8ClampedArray(count*4),depth,owners:new Uint8Array(count)};
  }
  function put(s,x,y,z,colour,owner){
    const i=y*s.width+x;
    if(z<s.depth[i]-0.000001)return;
    s.depth[i]=z;s.owners[i]=owner;
    const j=i*4;s.pixels[j]=colour[0];s.pixels[j+1]=colour[1];s.pixels[j+2]=colour[2];s.pixels[j+3]=255;
  }
  function triangle(s,a,b,c,colour,owner){
    const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
    if(Math.abs(det)<1e-9)return;
    const left=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),right=Math.min(s.width-1,Math.ceil(Math.max(a[0],b[0],c[0])));
    const top=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),bottom=Math.min(s.height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
    const ax=(b[1]-c[1])/det,ay=(c[0]-b[0])/det,bx=(c[1]-a[1])/det,by=(a[0]-c[0])/det;
    for(let y=top;y<=bottom;y++){
      let u=ax*(left+.5-c[0])+ay*(y+.5-c[1]),v=bx*(left+.5-c[0])+by*(y+.5-c[1]);
      for(let x=left;x<=right;x++,u+=ax,v+=bx){
        const w=1-u-v;if(u<-.000001||v<-.000001||w<-.000001)continue;
        put(s,x,y,u*a[2]+v*b[2]+w*c[2],colour,owner);
      }
    }
  }
  function segment(s,a,b,width,colour,owner){
    const r=width/2,dx=b[0]-a[0],dy=b[1]-a[1],len2=dx*dx+dy*dy;
    const left=Math.max(0,Math.floor(Math.min(a[0],b[0])-r)),right=Math.min(s.width-1,Math.ceil(Math.max(a[0],b[0])+r));
    const top=Math.max(0,Math.floor(Math.min(a[1],b[1])-r)),bottom=Math.min(s.height-1,Math.ceil(Math.max(a[1],b[1])+r));
    for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
      const t=len2>1e-12?Math.max(0,Math.min(1,((x+.5-a[0])*dx+(y+.5-a[1])*dy)/len2)):0;
      const ex=x+.5-a[0]-t*dx,ey=y+.5-a[1]-t*dy;
      if(ex*ex+ey*ey<=r*r)put(s,x,y,a[2]+(b[2]-a[2])*t+.0005,colour,owner);
    }
  }
  function paint(s,faces,{scale=1,ox=0,oy=0,chunky=false}={}){
    for(const f of faces){
      if(!f.pts?.length)continue;
      const owner=f.effect?0:(SLOT_IDS[f.slot]||0);
      const points=f.pts.map(([x,y],i)=>[ox+x*scale,oy+y*scale,f.depths?.[i]??f.depth??0]);
      if(f.fill&&!f.open)for(let i=1;i<points.length-1;i++)triangle(s,points[0],points[i],points[i+1],rgb(f.fill),owner);
      if(f.stroke){
        const width=Math.max(chunky?.85:.8,(f.width||1)*s.width/600),colour=rgb(f.stroke);
        for(let i=0;i<points.length-1;i++)segment(s,points[i],points[i+1],width,colour,owner);
        if(!f.open)segment(s,points[points.length-1],points[0],width,colour,owner);
      }
    }
    return s;
  }
  function quantise(s,palette){
    const colours=palette.map(rgb),data=s.pixels;
    for(let i=0;i<data.length;i+=4){
      if(!data[i+3])continue;
      let best=0,dist=Infinity;
      for(let j=0;j<colours.length;j++){
        const p=colours[j],d=(data[i]-p[0])**2+(data[i+1]-p[1])**2+(data[i+2]-p[2])**2;
        if(d<dist){dist=d;best=j;}
      }
      data[i]=colours[best][0];data[i+1]=colours[best][1];data[i+2]=colours[best][2];
    }
    return s;
  }
  function edges(s,{ink,light,chunky=false}={}){
    // The outline is computed from the FINAL visible silhouette, not from all
    // component masks. Hidden parts cannot acquire an x-ray/glowing outline.
    // Effects (steam puffs) carry owner 0 and do not receive a hard border.
    const {width:w,height:h,owners,depth}=s,data=s.pixels,outer=chunky?1:3,inner=chunky?1:2;
    const output=new Uint8ClampedArray(data),dark=rgb(ink),pale=rgb(light);
    const rim=new Uint8Array(w*h),seam=new Uint8Array(w*h);
    const set=(i,col)=>{const j=i*4;output[j]=col[0];output[j+1]=col[1];output[j+2]=col[2];output[j+3]=255;};
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const i=y*w+x,owner=owners[i];if(!owner)continue;
      for(const offset of [-1,1,-w,w]){
        const n=i+offset;
        if(!data[n*4+3])rim[i]=1;
        else if(owners[n]&&owners[n]!==owner&&depth[i]>depth[n]+.008)seam[i]=1;
      }
    }
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      const i=y*w+x;
      if(rim[i]){
        // A narrow pale outer edge stands off the road; the existing ink edge
        // provides the opposite contrast against white stripes and pale sky.
        for(let yy=-outer;yy<=outer;yy++)for(let xx=-outer;xx<=outer;xx++){
          if(xx*xx+yy*yy>outer*outer+.1)continue;
          const nx=x+xx,ny=y+yy;if(nx<0||nx>=w||ny<0||ny>=h)continue;
          const n=ny*w+nx;if(!data[n*4+3])set(n,pale);
        }
        for(let yy=1-inner;yy<inner;yy++)for(let xx=1-inner;xx<inner;xx++){
          const n=(y+yy)*w+x+xx;if(n>=0&&n<owners.length&&owners[n]===owners[i])set(n,dark);
        }
      }
      // Only the closer component gets a separating edge. This is not an
      // outline around every facet, and it never draws through an occluder.
      if(seam[i])set(i,dark);
    }
    s.pixels=output;return s;
  }
  return Object.freeze({SLOT_IDS,createSurface,paint,quantise,edges});
});


