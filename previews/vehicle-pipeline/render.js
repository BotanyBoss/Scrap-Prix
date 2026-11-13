// Orthographic framing is fixed in donor units across loadouts and both renderers.
const frameSize=[164,113], scale=25, baseline=84;
function softwareFrame(assembly,angles,wear){
  const canvas=document.createElement('canvas');
  [canvas.width,canvas.height]=frameSize;
  const surface=ScrapVehicleRaster.createSurface(...frameSize),faces=[];
  for(const [slot,group] of Object.entries(assembly.groups))for(const f of group){
    const pts=f.pts.map(v=>Pipeline.project(v,angles));
    faces.push({...f,fill:Pipeline.wearColour(f.fill,wear===slot),stroke:Pipeline.wearColour(f.stroke,wear===slot),
      pts,depths:pts.map(v=>v[2])});
  }
  ScrapVehicleRaster.paint(surface,faces,{scale,ox:82,oy:baseline,chunky:true});
  ScrapVehicleRaster.edges(surface,{ink:'#17282e',light:'#d4e1df',chunky:true});
  canvas.getContext('2d').putImageData(new ImageData(surface.pixels,...frameSize),0,0);
  return canvas;
}
function gpuView(canvas){
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true});
  if(!gl)throw Error('WebGL unavailable. Enable browser graphics acceleration to inspect this proof.');
  function shader(type,code){
    const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;
  }
  const program=gl.createProgram();
  gl.attachShader(program,shader(gl.VERTEX_SHADER,`attribute vec3 pos,col; uniform vec4 rot; uniform vec3 frame;
  varying lowp vec3 tint; void main(){float d=pos.x*rot.x+pos.z*rot.y;
  float x=pos.x*rot.y-pos.z*rot.x; float y=pos.y*rot.w-d*rot.z;
  gl_Position=vec4(x*frame.x,y*frame.y+frame.z,-(d*rot.w+pos.y*rot.z)*.08,1.);tint=col;}`));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float; varying lowp vec3 tint;
  uniform float worn; void main(){gl_FragColor=vec4(mix(tint,vec3(.471,.302,.212),worn),1.);}`));
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  const pos=gl.getAttribLocation(program,'pos'),col=gl.getAttribLocation(program,'col');
  gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(col);
  const uniform=n=>gl.getUniformLocation(program,n),rot=uniform('rot'),frame=uniform('frame'),worn=uniform('worn');
  const slots=new Map();let bytes=0;
  function upload(group){
    const triangles=[],lines=[];
    function vertex(out,p,hex){out.push(...p,...[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255))}
    for(const f of group){
      if(f.fill)for(let i=1;i<f.pts.length-1;i++)for(const p of [f.pts[0],f.pts[i],f.pts[i+1]])vertex(triangles,p,f.fill);
      if(f.stroke)for(let i=0;i<f.pts.length-(f.open?1:0);i++){
        vertex(lines,f.pts[i],f.stroke);vertex(lines,f.pts[(i+1)%f.pts.length],f.stroke);
      }
    }
    const data=new Float32Array([...triangles,...lines]),buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);bytes+=data.byteLength;
    return {group,buffer,bytes:data.byteLength,triangles:triangles.length/6,lines:lines.length/6};
  }
  function update(assembly){
    let count=0;
    for(const [slot,group] of Object.entries(assembly.groups)){
      const old=slots.get(slot);if(old?.group===group)continue;
      if(old){gl.deleteBuffer(old.buffer);bytes-=old.bytes}
      slots.set(slot,upload(group));count++;
    }
    return count;
  }
  function draw(angles,wear){
    const [yaw,pitch]=angles;
    gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform4f(rot,Math.sin(yaw),Math.cos(yaw),Math.sin(pitch),Math.cos(pitch));
    gl.uniform3f(frame,2*scale/164,2*scale/113,1-2*baseline/113);
    for(const [slot,b] of slots){
      gl.uniform1f(worn,wear===slot?.37:0);
      gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(col,3,gl.FLOAT,false,24,12);
      gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);gl.drawArrays(gl.TRIANGLES,0,b.triangles);gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.drawArrays(gl.LINES,b.triangles,b.lines);
    }
  }
  function snapshot(angles,wear){
    draw(angles,wear);
    const copy=document.createElement('canvas');[copy.width,copy.height]=frameSize;
    copy.getContext('2d').drawImage(canvas,0,0,...frameSize);return copy;
  }
  return {update,draw,snapshot,bytes:()=>bytes};
}
