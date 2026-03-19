import { useState, useEffect, useRef, useCallback } from "react";

const EN = {
  "role playing game":"lalarilona","thank you":"tasalu",
  "chronic suffering":"dewanasorel","non-binary":"aloirosi","non binary":"aloirosi",
  "trans man":"alotril","trans woman":"alotrol","it's":"bana","i'm":"kauela",
  "a":"yak","air":"ril","am":"ela","an":"yak","and":"lor","are":"ral",
  "at":"ryba","binary":"rosi","book":"lirea","breath":"siona","but":"lulo",
  "crazy":"dewana","cool":"gob","depression":"sorel","dice":"poda",
  "disease":"ionelara","do":"bax","dragon":"golana","dungeon":"kapasak",
  "dust":"kethrava","earth":"rak","fire":"ravi","fun":"qento","game":"ona",
  "goodbye":"alorela","have":"xely","he":"nu","hell":"xaqavi","hello":"rela",
  "help":"goma","her":"ku","him":"yu","i":"kaune","is":"na","it":"ba",
  "late":"gyplo","least":"colna","lung":"velara","magic":"jadu","man":"trol",
  "maybe":"xena","me":"arel","my":"aryl","no":"alo","non":"aloi",
  "nonbinarysexual":"stragaydt","not":"aloa","on":"le","or":"e","paper":"lisi",
  "periodt":"selino","place":"xaq","playing":"aril","read":"lerandan",
  "role":"lal","sadness":"sorel","say":"lakol","sentence":"leroa","she":"mi",
  "shit":"sta","stone":"morika","stupid":"beakel","thanks":"tas","the":"re",
  "them":"si","they":"mag","too":"kenda","type":"ot","use":"gol",
  "volcano":"ravikethra","water":"rau","welcome":"gafa","with":"o",
  "woman":"tril","word":"lero","yes":"ne","you":"talu","your":"talurin",
};
const NUMS = {
  "0":"nil","1":"yak","2":"duul","3":"va","4":"chaar","5":"sanq",
  "6":"sash","7":"saat","8":"aath","9":"non","10":"da","11":"dayak",
  "12":"duduul","13":"dava","14":"dachaar","15":"dasanq","16":"dasash",
  "17":"dasaat","18":"daath","19":"danon","20":"dau","30":"vada",
  "40":"chada","50":"sanda","60":"sashda","70":"saatda","80":"aathda",
  "90":"nonda","100":"dada",
};
const CU = {};
for (const [en,cu] of Object.entries(EN)) { if (!CU[cu]) CU[cu]=en; }
for (const [n,cu] of Object.entries(NUMS)) { if (!CU[cu]) CU[cu]=n; }
const sortEN=Object.keys(EN).sort((a,b)=>b.split(" ").length-a.split(" ").length);
const sortCU=Object.keys(CU).sort((a,b)=>b.split(" ").length-a.split(" ").length);

function extractParts(token) {
  const m=token.match(/^([^a-z0-9']*)([a-z0-9'][a-z0-9'.-]*)([^a-z0-9']*)$/i);
  return m?{pre:m[1],word:m[2],post:m[3]}:{pre:"",word:token,post:""};
}
function doTranslate(text,dir) {
  if (!text.trim()) return [];
  const lookup=dir==="en"?EN:CU, sorted=dir==="en"?sortEN:sortCU;
  const parts=text.split(/(\s+)/), out=[];
  let i=0;
  while (i<parts.length) {
    const tok=parts[i];
    if (!tok){i++;continue;}
    if (/^\s+$/.test(tok)){out.push({src:tok,dst:tok,type:"space"});i++;continue;}
    const {pre,word,post}=extractParts(tok.toLowerCase());
    if (dir==="en"&&/^\d+$/.test(word)&&NUMS[word]){out.push({src:tok,dst:pre+NUMS[word]+post,type:"number"});i++;continue;}
    let matched=false;
    for (const phrase of sorted) {
      const pw=phrase.split(" ");
      if (pw.length===1) {
        if (word===phrase){out.push({src:tok,dst:pre+lookup[phrase]+post,type:"match"});i++;matched=true;break;}
      } else {
        const words=[word];let j=i+1;
        while (words.length<pw.length&&j<parts.length){if(!parts[j]||/^\s+$/.test(parts[j])){j++;continue;}words.push(extractParts(parts[j].toLowerCase()).word);j++;}
        if (words.join(" ")===phrase){out.push({src:parts.slice(i,j).join(""),dst:lookup[phrase],type:"phrase"});i=j;matched=true;break;}
      }
    }
    if (!matched){out.push({src:tok,dst:tok,type:"unknown"});i++;}
  }
  return out;
}

// ── Evil Eye — raw WebGL ──────────────────────────────

function generateNoiseTexture(size=256) {
  const data=new Uint8Array(size*size*4);
  function hash(x,y,s){let n=x*374761393+y*668265263+s*1274126177;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
  function noise(px,py,freq,seed){
    const fx=(px/size)*freq,fy=(py/size)*freq,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,w=freq|0;
    const v00=hash(((ix%w)+w)%w,((iy%w)+w)%w,seed),v10=hash((((ix+1)%w)+w)%w,((iy%w)+w)%w,seed);
    const v01=hash(((ix%w)+w)%w,(((iy+1)%w)+w)%w,seed),v11=hash((((ix+1)%w)+w)%w,(((iy+1)%w)+w)%w,seed);
    return v00*(1-tx)*(1-ty)+v10*tx*(1-ty)+v01*(1-tx)*ty+v11*tx*ty;
  }
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    let v=0,amp=0.4,tot=0;
    for (let o=0;o<8;o++){v+=amp*noise(x,y,32*(1<<o),o*31);tot+=amp;amp*=0.65;}
    v/=tot;v=(v-0.5)*2.2+0.5;v=Math.max(0,Math.min(1,v));
    const val=Math.round(v*255),idx=(y*size+x)*4;
    data[idx]=val;data[idx+1]=val;data[idx+2]=val;data[idx+3]=255;
  }
  return data;
}

const VERT_SRC=`attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}`;
const FRAG_SRC=`
precision highp float;
uniform float uTime,uPupilSize,uIrisWidth,uGlowIntensity,uIntensity,uScale,uNoiseScale,uPupilFollow,uFlameSpeed;
uniform vec2 uResolution,uMouse;
uniform vec3 uEyeColor,uBgColor;
uniform sampler2D uNoise;
void main(){
  vec2 uv=(gl_FragCoord.xy*2.0-uResolution)/uResolution.y;
  uv/=uScale;
  float ft=uTime*uFlameSpeed;
  float pr=length(uv)*2.0,pa=(2.0*atan(uv.x,uv.y))/6.2832*0.3;
  vec2 puv=vec2(pr,pa);
  vec4 nA=texture2D(uNoise,puv*vec2(0.2,7.0)*uNoiseScale+vec2(-ft*0.1,0.0));
  vec4 nB=texture2D(uNoise,puv*vec2(0.3,4.0)*uNoiseScale+vec2(-ft*0.2,0.0));
  vec4 nC=texture2D(uNoise,puv*vec2(0.1,5.0)*uNoiseScale+vec2(-ft*0.1,0.0));
  float dm=1.0-length(uv);
  float ir=clamp(-1.0*((dm-0.7)/uIrisWidth),0.0,1.0);
  ir=(ir*dm-0.2)/0.28+nA.r-0.5;ir*=1.3;ir=clamp(ir,0.0,1.0);
  float or2=clamp(-1.0*((dm-0.5)/0.2),0.0,1.0);
  or2=(or2*dm-0.1)/0.38+nC.r-0.5;or2*=1.3;or2=clamp(or2,0.0,1.0);
  ir+=or2;
  float ie=(dm-0.2)*nB.r*2.0;
  float pupil=1.0-length((uv-uMouse*uPupilFollow*0.12)*vec2(9.0,2.3));
  pupil=clamp(pupil*uPupilSize,0.0,1.0)/0.35;
  float eg=clamp(1.0-length(uv*vec2(0.5,1.5))+0.5,0.0,1.0)+nC.r-0.5;
  float bg=eg;
  eg=clamp(pow(eg,2.0)+dm,0.0,1.0)*uGlowIntensity;
  eg=clamp(eg,0.0,1.0)*pow(1.0-dm,2.0)*2.5;
  bg=pow(bg+dm,0.5)*0.15;
  vec3 color=uEyeColor*uIntensity*clamp(max(ir+ie,eg+bg)-pupil,0.0,3.0)+uBgColor;
  gl_FragColor=vec4(color,1.0);
}`;

function hexRGB(hex){
  const h=hex.replace("#","");
  return[parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255];
}

function EvilEye() {
  const canvasRef=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current;
    const gl=canvas.getContext("webgl")||canvas.getContext("experimental-webgl");
    if (!gl){console.error("WebGL not supported");return;}
    function compile(type,src){
      const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(s));return null;}
      return s;
    }
    const prog=gl.createProgram();
    gl.attachShader(prog,compile(gl.VERTEX_SHADER,VERT_SRC));
    gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,FRAG_SRC));
    gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(prog));return;}
    gl.useProgram(prog);
    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
    const aPos=gl.getAttribLocation(prog,"aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);
    const tex=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,256,256,0,gl.RGBA,gl.UNSIGNED_BYTE,generateNoiseTexture(256));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
    gl.uniform1i(gl.getUniformLocation(prog,"uNoise"),0);
    gl.uniform1f(gl.getUniformLocation(prog,"uPupilSize"),0.6);
    gl.uniform1f(gl.getUniformLocation(prog,"uIrisWidth"),0.25);
    gl.uniform1f(gl.getUniformLocation(prog,"uGlowIntensity"),0.35);
    gl.uniform1f(gl.getUniformLocation(prog,"uIntensity"),1.4);
    gl.uniform1f(gl.getUniformLocation(prog,"uScale"),0.82);
    gl.uniform1f(gl.getUniformLocation(prog,"uNoiseScale"),1.0);
    gl.uniform1f(gl.getUniformLocation(prog,"uPupilFollow"),1.0);
    gl.uniform1f(gl.getUniformLocation(prog,"uFlameSpeed"),0.75);
    gl.uniform3fv(gl.getUniformLocation(prog,"uEyeColor"),hexRGB("#c9a84c"));
    gl.uniform3fv(gl.getUniformLocation(prog,"uBgColor"),hexRGB("#06060f"));
    const uTime=gl.getUniformLocation(prog,"uTime");
    const uRes=gl.getUniformLocation(prog,"uResolution");
    const uMouse=gl.getUniformLocation(prog,"uMouse");
    const mouse={x:0,y:0,tx:0,ty:0};
    const onMove=(e)=>{mouse.tx=(e.clientX/window.innerWidth)*2-1;mouse.ty=-((e.clientY/window.innerHeight)*2-1);};
    window.addEventListener("mousemove",onMove);
    const resize=()=>{
      canvas.width=window.innerWidth;canvas.height=window.innerHeight;
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(uRes,canvas.width,canvas.height);
    };
    window.addEventListener("resize",resize);
    resize();
    let raf;
    const draw=(t)=>{
      raf=requestAnimationFrame(draw);
      mouse.x+=(mouse.tx-mouse.x)*0.05;mouse.y+=(mouse.ty-mouse.y)*0.05;
      gl.uniform1f(uTime,t*0.001);gl.uniform2f(uMouse,mouse.x,mouse.y);
      gl.drawArrays(gl.TRIANGLES,0,3);
    };
    raf=requestAnimationFrame(draw);
    return()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove",onMove);
      window.removeEventListener("resize",resize);
    };
  },[]);
  return <canvas ref={canvasRef} style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",zIndex:0,display:"block",pointerEvents:"none"}}/>;
}

// ── UI helpers ────────────────────────────────────────

function ShinyText({children}) {
  return <span style={{background:"linear-gradient(110deg,#7a5a18 20%,#c9a84c 38%,#f0d47a 50%,#c9a84c 62%,#7a5a18 80%)",backgroundSize:"300% auto",WebkitBackgroundClip:"text",backgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shine 4s linear infinite",display:"inline-block"}}>{children}</span>;
}

function SpotlightCard({children,style={}}) {
  const ref=useRef(null);
  const [m,setM]=useState({x:0,y:0,over:false});
  const onMove=useCallback((e)=>{const r=ref.current.getBoundingClientRect();setM({x:e.clientX-r.left,y:e.clientY-r.top,over:true});},[]);
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={()=>setM(v=>({...v,over:false}))} style={{position:"relative",overflow:"hidden",...style}}>
      {m.over&&<div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0,background:`radial-gradient(340px circle at ${m.x}px ${m.y}px,rgba(201,168,76,0.07) 0%,transparent 65%)`}}/>}
      <div style={{position:"relative",zIndex:1}}>{children}</div>
    </div>
  );
}

const GLYPHS="abcdefghijklmnopqrstuvwxyz";
function DecryptedText({text,seed}) {
  const [d,setD]=useState("");
  const r=useRef(null);
  useEffect(()=>{
    if(!text){setD("");return;}
    let f=0;
    const run=()=>{
      f++;const rev=Math.floor((f/22)*text.length);
      let s="";for(let k=0;k<text.length;k++){const c=text[k];s+=c===" "||c==="\n"?c:k<rev?c:GLYPHS[Math.floor(Math.random()*26)];}
      setD(s);if(f<22){r.current=requestAnimationFrame(run);}else setD(text);
    };
    if(r.current) cancelAnimationFrame(r.current);
    r.current=requestAnimationFrame(run);
    return()=>{if(r.current) cancelAnimationFrame(r.current);};
  },[text,seed]);
  return <>{d}</>;
}

// ── Styles ────────────────────────────────────────────

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Crimson+Pro:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap');
@keyframes shine{from{background-position:300%}to{background-position:-300%}}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes runeIn{from{opacity:0;letter-spacing:-.05em}to{opacity:1;letter-spacing:.18em}}
*,*::before,*::after{box-sizing:border-box;}
html,body{margin:0;background:#06060f;}

.rl-root{position:relative;z-index:2;min-height:100vh;color:#e8e0d4;font-family:'Crimson Pro',Georgia,serif;padding:2.5rem 1rem 5rem;}

.rl-title{
  font-family:'Cinzel Decorative',serif;
  font-size:clamp(2rem,6vw,3.4rem);
  letter-spacing:.18em;margin:0 0 .35rem;
  animation:runeIn .8s ease both;
  text-shadow:0 0 60px rgba(201,168,76,0.6),0 2px 16px rgba(0,0,0,1);
}
.rl-sub{
  color:#9080b8;font-size:.75rem;letter-spacing:.38em;
  text-transform:uppercase;margin:0 0 1.2rem;
  font-family:'JetBrains Mono',monospace;
  text-shadow:0 1px 10px rgba(0,0,0,1);
}
.rl-divider{
  width:120px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(201,168,76,.8),transparent);
  margin:0 auto 2.8rem;
}

/* panel label */
.rl-label{
  padding:12px 18px 8px;
  font-size:.68rem;letter-spacing:.3em;text-transform:uppercase;
  color:#9080b8;
  font-family:'JetBrains Mono',monospace;
  border-bottom:1px solid rgba(80,65,140,0.4);
}

/* textarea */
.rl-ta{
  width:100%;min-height:170px;background:transparent;
  border:none;outline:none;
  color:#f0ead8;
  font-family:'Crimson Pro',Georgia,serif;
  font-size:1.18rem;line-height:1.8;resize:none;
  padding:14px 18px 18px;
}
.rl-ta::placeholder{color:#3c3268;}

/* output */
.rl-out{
  min-height:170px;padding:14px 18px 18px;
  font-family:'JetBrains Mono',monospace;
  font-size:1rem;line-height:1.8;letter-spacing:.03em;
  color:#eac96a;white-space:pre-wrap;word-break:break-word;
}
.rl-empty{color:#3c3268;font-family:'Crimson Pro',serif;font-size:1.05rem;}

/* swap button */
.rl-swap{
  width:48px;height:48px;border-radius:50%;
  border:1px solid rgba(201,168,76,0.5);
  background:rgba(6,4,18,0.98);
  color:#c9a84c;font-size:1.2rem;cursor:pointer;
  flex-shrink:0;display:flex;align-items:center;justify-content:center;
  transition:all .25s;
  box-shadow:0 0 0 5px rgba(0,0,0,0.5),0 0 24px rgba(201,168,76,0.15);
}
.rl-swap:hover{
  border-color:rgba(201,168,76,1);
  box-shadow:0 0 0 5px rgba(0,0,0,0.5),0 0 32px rgba(201,168,76,.5);
  transform:scale(1.05);
}

/* copy */
.rl-copy{
  background:rgba(201,168,76,0.1);
  border:1px solid rgba(201,168,76,0.35);
  color:#c9a84c;cursor:pointer;border-radius:6px;
  padding:4px 14px;font-size:.68rem;letter-spacing:.12em;
  font-family:'JetBrains Mono',monospace;transition:all .2s;
}
.rl-copy.done{background:rgba(56,178,172,0.15);border-color:rgba(56,178,172,0.6);color:#5ee8de;}
.rl-copy:hover:not(.done){background:rgba(201,168,76,0.18);border-color:rgba(201,168,76,.7);}

/* word chips */
.chip{
  display:inline-flex;flex-direction:column;align-items:center;
  gap:3px;padding:7px 14px;border-radius:10px;margin:3px;
  font-family:'JetBrains Mono',monospace;animation:fadeUp .3s ease both;
}
.chip-s{font-size:.63rem;color:#6858a8;}
.chip-d{font-size:.84rem;font-weight:500;}
.chip.match  {background:rgba(56,178,172,.15); border:1px solid rgba(56,178,172,.5);}
.chip.phrase {background:rgba(201,168,76,.15); border:1px solid rgba(201,168,76,.5);}
.chip.number {background:rgba(147,112,219,.15);border:1px solid rgba(147,112,219,.5);}
.chip.unknown{background:rgba(200,80,80,.12);  border:1px solid rgba(200,80,80,.45);}

/* dict */
.dict-btn{
  width:100%;
  background:rgba(6,4,18,0.95);
  border:1px solid rgba(70,58,120,0.7);
  color:#7868b0;cursor:pointer;padding:14px;border-radius:12px;
  font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;
  font-family:'JetBrains Mono',monospace;transition:all .2s;
  box-shadow:0 4px 24px rgba(0,0,0,0.5);
}
.dict-btn:hover{border-color:rgba(120,100,200,.8);color:#b0a0e0;}
.dict-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:7px;animation:fadeUp .3s ease;}
.dict-item{
  display:flex;justify-content:space-between;align-items:center;
  padding:9px 14px;border-radius:10px;
  background:rgba(6,4,18,0.95);
  border:1px solid rgba(50,40,90,0.8);
  font-size:.8rem;transition:all .2s;
}
.dict-item:hover{border-color:rgba(100,80,180,.7);background:rgba(10,7,28,0.98);}
.dict-src{color:#7868a8;}
.dict-dst{font-family:'JetBrains Mono',monospace;font-size:.75rem;}
.sec-lbl{
  font-size:.66rem;color:#6858a8;letter-spacing:.32em;
  text-transform:uppercase;font-family:'JetBrains Mono',monospace;margin-bottom:10px;
}
.rl-hr{height:1px;background:linear-gradient(90deg,transparent,rgba(60,48,110,0.9),transparent);margin:32px 0;border:none;}
`;

const PANEL={
  background:"rgba(5,4,16,0.95)",
  backdropFilter:"blur(20px)",
  WebkitBackdropFilter:"blur(20px)",
  border:"1px solid rgba(70,58,130,0.7)",
  borderRadius:16,
  boxShadow:"0 12px 48px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)",
};

// ── App ───────────────────────────────────────────────

export default function App() {
  const [dir,setDir]=useState("en");
  const [input,setInput]=useState("");
  const [tokens,setTokens]=useState([]);
  const [seed,setSeed]=useState(0);
  const [showDict,setShowDict]=useState(false);
  const [copied,setCopied]=useState(false);

  useEffect(()=>{const el=document.createElement("style");el.textContent=CSS;document.head.appendChild(el);return()=>document.head.removeChild(el);},[]);
  useEffect(()=>{setTokens(doTranslate(input,dir));setSeed(s=>s+1);},[input,dir]);

  const output=tokens.map(t=>t.dst).join("");
  const chips=tokens.filter(t=>t.type!=="space"&&t.src.trim());
  const srcLang=dir==="en"?"English":"Relanic";
  const dstLang=dir==="en"?"Relanic":"English";

  return (
    <>
      <EvilEye/>
      <div className="rl-root">
        <header style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <h1 className="rl-title"><ShinyText>RELANIC</ShinyText></h1>
          <p className="rl-sub">lero jadu · word magic · translator</p>
          <div className="rl-divider"/>
        </header>

        <div style={{maxWidth:880,margin:"0 auto"}}>

          {/* Language bar */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
            <div style={{
              flex:1,textAlign:"center",color:"#c9a84c",
              fontSize:".82rem",letterSpacing:".3em",textTransform:"uppercase",
              fontFamily:"'JetBrains Mono',monospace",
              textShadow:"0 0 20px rgba(201,168,76,0.6)",
            }}>{srcLang}</div>
            <button className="rl-swap" onClick={()=>{setDir(d=>d==="en"?"cu":"en");setInput("");}}>⇄</button>
            <div style={{
              flex:1,textAlign:"center",color:"#38c4b8",
              fontSize:".82rem",letterSpacing:".3em",textTransform:"uppercase",
              fontFamily:"'JetBrains Mono',monospace",
              textShadow:"0 0 20px rgba(56,196,184,0.5)",
            }}>{dstLang}</div>
          </div>

          {/* Panels */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:16}}>
            <SpotlightCard style={PANEL}>
              <div className="rl-label">Input</div>
              <textarea className="rl-ta" value={input} onChange={e=>setInput(e.target.value)} placeholder={`Type in ${srcLang}…`}/>
            </SpotlightCard>
            <SpotlightCard style={PANEL}>
              <div className="rl-label" style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span>Translation</span>
                {output.trim()&&<button className={`rl-copy${copied?" done":""}`} onClick={()=>navigator.clipboard.writeText(output.trim()).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1800);})}>{copied?"✓ copied":"copy"}</button>}
              </div>
              <div className="rl-out">
                {output.trim()?<DecryptedText text={output} seed={seed}/>:<span className="rl-empty">Translation appears here…</span>}
              </div>
            </SpotlightCard>
          </div>

          {/* Word chips */}
          {chips.length>0&&(
            <div style={{
              marginTop:18,padding:18,
              background:"rgba(5,4,16,0.93)",
              border:"1px solid rgba(70,58,130,0.6)",
              borderRadius:16,
              boxShadow:"0 8px 36px rgba(0,0,0,0.7)",
            }}>
              <div className="sec-lbl">Word by word</div>
              <div style={{display:"flex",flexWrap:"wrap",marginBottom:12}}>
                {chips.map((w,i)=>(
                  <div key={i} className={`chip ${w.type}`} style={{animationDelay:`${i*0.04}s`}}>
                    <span className="chip-s">{w.src.trim()}</span>
                    <span className="chip-d" style={{
                      color:w.type==="unknown"?"#e07070":w.type==="phrase"?"#eac96a":w.type==="number"?"#b090e8":"#4ecdc4"
                    }}>{w.dst.trim()||"—"}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:18,flexWrap:"wrap",borderTop:"1px solid rgba(50,40,90,0.5)",paddingTop:10}}>
                {[["#4ecdc4","word"],["#eac96a","phrase"],["#b090e8","number"],["#e07070","unknown"]].map(([c,l])=>(
                  <span key={l} style={{display:"flex",alignItems:"center",gap:6,fontSize:".65rem",color:"#6858a8",fontFamily:"'JetBrains Mono',monospace",letterSpacing:".15em"}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block",boxShadow:`0 0 6px ${c}`}}/>{l}
                  </span>
                ))}
              </div>
            </div>
          )}

          <hr className="rl-hr"/>

          <button className="dict-btn" onClick={()=>setShowDict(d=>!d)}>
            {showDict?"▲ hide dictionary":"▼ full dictionary · leroavel"}
          </button>

          {showDict&&(
            <div style={{marginTop:18,padding:18,background:"rgba(5,4,16,0.93)",border:"1px solid rgba(70,58,130,0.6)",borderRadius:16,boxShadow:"0 8px 36px rgba(0,0,0,0.7)"}}>
              <div className="sec-lbl" style={{marginBottom:10}}>Words</div>
              <div className="dict-grid" style={{marginBottom:24}}>
                {Object.entries(EN).sort((a,b)=>a[0].localeCompare(b[0])).map(([en,cu])=>(
                  <div key={en} className="dict-item">
                    <span className="dict-src">{en}</span>
                    <span className="dict-dst" style={{color:"#eac96a"}}>{cu}</span>
                  </div>
                ))}
              </div>
              <div className="sec-lbl" style={{marginBottom:10}}>Numbers</div>
              <div className="dict-grid">
                {Object.entries(NUMS).map(([n,cu])=>(
                  <div key={n} className="dict-item">
                    <span className="dict-src">{n}</span>
                    <span className="dict-dst" style={{color:"#b090e8"}}>{cu}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{textAlign:"center",marginTop:48,color:"#3a2e68",fontSize:".68rem",letterSpacing:".35em",fontFamily:"'JetBrains Mono',monospace"}}>
            rela · lero jadu · relanic
          </div>
        </div>
      </div>
    </>
  );
}
