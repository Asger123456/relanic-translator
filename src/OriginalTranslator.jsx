import { useState, useEffect, useRef, useCallback } from 'react'

const EN = {
  "role playing game":"lalarilona","thank you":"tasalu","chronic suffering":"dewanasorel",
  "non-binary":"aloirosi","non binary":"aloirosi","trans man":"alotril","trans woman":"alotrol",
  "it's":"bana","i'm":"kauela","a":"yak","air":"ril","am":"ela","an":"yak","and":"lor","are":"ral",
  "at":"ryba","binary":"rosi","book":"lirea","breath":"siona","but":"lulo","crazy":"dewana",
  "cool":"gob","depression":"sorel","dice":"poda","disease":"ionelara","do":"bax","dragon":"golana",
  "dungeon":"kapasak","dust":"kethrava","earth":"rak","fire":"ravi","fun":"qento","game":"ona",
  "goodbye":"alorela","have":"xely","he":"nu","hell":"xaqavi","hello":"rela","help":"goma",
  "her":"ku","him":"yu","i":"kaune","is":"na","it":"ba","late":"gyplo","least":"colna",
  "lung":"velara","magic":"jadu","man":"trol","maybe":"xena","me":"arel","my":"aryl","no":"alo",
  "non":"aloi","nonbinarysexual":"stragaydt","not":"aloa","on":"le","or":"e","paper":"lisi",
  "periodt":"selino","place":"xaq","playing":"aril","read":"lerandan","role":"lal","sadness":"sorel",
  "say":"lakol","sentence":"leroa","she":"mi","shit":"sta","stone":"morika","stupid":"beakel",
  "thanks":"tas","the":"re","them":"si","they":"mag","too":"kenda","type":"ot","use":"gol",
  "volcano":"ravikethra","water":"rau","welcome":"gafa","with":"o","woman":"tril","word":"lero",
  "yes":"ne","you":"talu","your":"talurin",
}
const NUMS = {
  "0":"nil","1":"yak","2":"duul","3":"va","4":"chaar","5":"sanq","6":"sash","7":"saat",
  "8":"aath","9":"non","10":"da","11":"dayak","12":"duduul","13":"dava","14":"dachaar",
  "15":"dasanq","16":"dasash","17":"dasaat","18":"daath","19":"danon","20":"dau","30":"vada",
  "40":"chada","50":"sanda","60":"sashda","70":"saatda","80":"aathda","90":"nonda","100":"dada",
}
const CU={}
for(const[en,cu]of Object.entries(EN)){if(!CU[cu])CU[cu]=en}
for(const[n,cu]of Object.entries(NUMS)){if(!CU[cu])CU[cu]=n}
const sortEN=Object.keys(EN).sort((a,b)=>b.split(" ").length-a.split(" ").length)
const sortCU=Object.keys(CU).sort((a,b)=>b.split(" ").length-a.split(" ").length)

function extractParts(t){const m=t.match(/^([^a-z0-9']*)([a-z0-9'][a-z0-9'.-]*)([^a-z0-9']*)$/i);return m?{pre:m[1],word:m[2],post:m[3]}:{pre:"",word:t,post:""}}
function doTranslate(text,dir){
  if(!text.trim())return[]
  const lookup=dir==="en"?EN:CU,sorted=dir==="en"?sortEN:sortCU
  const parts=text.split(/(\s+)/),out=[];let i=0
  while(i<parts.length){
    const tok=parts[i];if(!tok){i++;continue}
    if(/^\s+$/.test(tok)){out.push({src:tok,dst:tok,type:"space"});i++;continue}
    const{pre,word,post}=extractParts(tok.toLowerCase())
    if(dir==="en"&&/^\d+$/.test(word)&&NUMS[word]){out.push({src:tok,dst:pre+NUMS[word]+post,type:"number"});i++;continue}
    let matched=false
    for(const phrase of sorted){
      const pw=phrase.split(" ")
      if(pw.length===1){if(word===phrase){out.push({src:tok,dst:pre+lookup[phrase]+post,type:"match"});i++;matched=true;break}}
      else{const words=[word];let j=i+1;while(words.length<pw.length&&j<parts.length){if(!parts[j]||/^\s+$/.test(parts[j])){j++;continue}words.push(extractParts(parts[j].toLowerCase()).word);j++}
        if(words.join(" ")===phrase){out.push({src:parts.slice(i,j).join(""),dst:lookup[phrase],type:"phrase"});i=j;matched=true;break}}
    }
    if(!matched){out.push({src:tok,dst:tok,type:"unknown"});i++}
  }
  return out
}

const GLYPHS="abcdefghijklmnopqrstuvwxyz"
function DecryptedText({text,seed}){
  const[d,setD]=useState("");const r=useRef(null)
  useEffect(()=>{
    if(!text){setD("");return}
    let f=0;const run=()=>{f++;const rev=Math.floor((f/22)*text.length);let s=""
      for(let k=0;k<text.length;k++){const c=text[k];s+=c===" "||c==="\n"?c:k<rev?c:GLYPHS[Math.floor(Math.random()*26)]}
      setD(s);if(f<22){r.current=requestAnimationFrame(run)}else setD(text)}
    if(r.current)cancelAnimationFrame(r.current);r.current=requestAnimationFrame(run)
    return()=>{if(r.current)cancelAnimationFrame(r.current)}
  },[text,seed])
  return <>{d}</>
}

const PANEL={background:"rgba(5,4,16,0.95)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(70,58,130,0.7)",borderRadius:16,boxShadow:"0 12px 48px rgba(0,0,0,0.8)"}

export default function OriginalTranslator(){
  const[dir,setDir]=useState("en");const[input,setInput]=useState("");const[tokens,setTokens]=useState([])
  const[seed,setSeed]=useState(0);const[showDict,setShowDict]=useState(false);const[copied,setCopied]=useState(false)
  useEffect(()=>{setTokens(doTranslate(input,dir));setSeed(s=>s+1)},[input,dir])
  const output=tokens.map(t=>t.dst).join("");const chips=tokens.filter(t=>t.type!=="space"&&t.src.trim())
  const srcLang=dir==="en"?"English":"Relanic";const dstLang=dir==="en"?"Relanic":"English"
  return(
    <div style={{position:"relative",zIndex:2,minHeight:"100vh",color:"#e8e0d4",fontFamily:"'Crimson Pro',Georgia,serif",padding:"5rem 1rem 4rem"}}>
      <div style={{maxWidth:880,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <h2 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:"clamp(1.5rem,4vw,2.4rem)",color:"#e8e0d4",margin:"0 0 .3rem",letterSpacing:".12em",textShadow:"0 0 30px rgba(201,168,76,0.4)"}}>Relanic Translator</h2>
          <p style={{color:"#6858a8",fontFamily:"'JetBrains Mono',monospace",fontSize:".72rem",letterSpacing:".3em",margin:0}}>LERO JADU · WORD MAGIC</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
          <div style={{flex:1,textAlign:"center",color:"#c9a84c",fontSize:".82rem",letterSpacing:".3em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",textShadow:"0 0 20px rgba(201,168,76,0.6)"}}>{srcLang}</div>
          <button onClick={()=>{setDir(d=>d==="en"?"cu":"en");setInput("")}} style={{width:48,height:48,borderRadius:"50%",border:"1px solid rgba(201,168,76,0.5)",background:"rgba(6,4,18,0.98)",color:"#c9a84c",fontSize:"1.2rem",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .25s",boxShadow:"0 0 0 5px rgba(0,0,0,0.5)"}}>⇄</button>
          <div style={{flex:1,textAlign:"center",color:"#38c4b8",fontSize:".82rem",letterSpacing:".3em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",textShadow:"0 0 20px rgba(56,196,184,0.5)"}}>{dstLang}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:16,marginBottom:16}}>
          <div style={PANEL}>
            <div style={{padding:"10px 16px 6px",fontSize:".66rem",letterSpacing:".28em",textTransform:"uppercase",color:"#6858a8",fontFamily:"'JetBrains Mono',monospace",borderBottom:"1px solid rgba(70,58,130,0.4)"}}>Input</div>
            <textarea style={{width:"100%",minHeight:170,background:"transparent",border:"none",outline:"none",color:"#f0ead8",fontFamily:"'Crimson Pro',Georgia,serif",fontSize:"1.18rem",lineHeight:1.8,resize:"none",padding:"14px 18px 18px"}} value={input} onChange={e=>setInput(e.target.value)} placeholder={`Type in ${srcLang}…`}/>
          </div>
          <div style={PANEL}>
            <div style={{padding:"10px 16px 6px",fontSize:".66rem",letterSpacing:".28em",textTransform:"uppercase",color:"#6858a8",fontFamily:"'JetBrains Mono',monospace",borderBottom:"1px solid rgba(70,58,130,0.4)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>Translation</span>
              {output.trim()&&<button className={`rl-copy${copied?" done":""}`} onClick={()=>navigator.clipboard.writeText(output.trim()).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1800)})} style={{background:"rgba(201,168,76,0.1)",border:"1px solid rgba(201,168,76,0.35)",color:"#c9a84c",borderRadius:6,padding:"3px 14px",fontSize:".68rem",letterSpacing:".12em",fontFamily:"'JetBrains Mono',monospace",cursor:"pointer"}}>{copied?"✓ copied":"copy"}</button>}
            </div>
            <div style={{minHeight:170,padding:"14px 18px 18px",fontFamily:"'JetBrains Mono',monospace",fontSize:"1rem",lineHeight:1.8,letterSpacing:".03em",color:"#eac96a",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
              {output.trim()?<DecryptedText text={output} seed={seed}/>:<span style={{color:"#3c3268"}}>Translation appears here…</span>}
            </div>
          </div>
        </div>
        {chips.length>0&&(
          <div style={{marginTop:18,padding:18,background:"rgba(5,4,16,0.93)",border:"1px solid rgba(70,58,130,0.6)",borderRadius:16,boxShadow:"0 8px 36px rgba(0,0,0,0.7)"}}>
            <div style={{fontSize:".66rem",color:"#6858a8",letterSpacing:".32em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:10}}>Word by word</div>
            <div style={{display:"flex",flexWrap:"wrap",marginBottom:12}}>
              {chips.map((w,i)=>(
                <div key={i} style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:3,padding:"7px 14px",borderRadius:10,margin:3,fontFamily:"'JetBrains Mono',monospace",
                  background:w.type==="unknown"?"rgba(200,80,80,.12)":w.type==="phrase"?"rgba(201,168,76,.15)":w.type==="number"?"rgba(147,112,219,.15)":"rgba(56,178,172,.15)",
                  border:`1px solid ${w.type==="unknown"?"rgba(200,80,80,.45)":w.type==="phrase"?"rgba(201,168,76,.5)":w.type==="number"?"rgba(147,112,219,.5)":"rgba(56,178,172,.5)"}`}}>
                  <span style={{fontSize:".63rem",color:"#6858a8"}}>{w.src.trim()}</span>
                  <span style={{fontSize:".84rem",fontWeight:500,color:w.type==="unknown"?"#e07070":w.type==="phrase"?"#eac96a":w.type==="number"?"#b090e8":"#4ecdc4"}}>{w.dst.trim()||"—"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{marginTop:24}}>
          <button onClick={()=>setShowDict(d=>!d)} style={{width:"100%",background:"rgba(6,4,18,0.95)",border:"1px solid rgba(70,58,120,0.7)",color:"#7868b0",cursor:"pointer",padding:14,borderRadius:12,fontSize:".72rem",letterSpacing:".22em",textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",transition:"all .2s"}}>
            {showDict?"▲ hide dictionary":"▼ full dictionary · leroavel"}
          </button>
          {showDict&&(
            <div style={{marginTop:14,padding:18,background:"rgba(5,4,16,0.93)",border:"1px solid rgba(70,58,130,0.6)",borderRadius:16}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:7,marginBottom:24}}>
                {Object.entries(EN).sort((a,b)=>a[0].localeCompare(b[0])).map(([en,cu])=>(
                  <div key={en} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderRadius:10,background:"rgba(6,4,18,0.95)",border:"1px solid rgba(50,40,90,0.8)",fontSize:".8rem"}}>
                    <span style={{color:"#7868a8"}}>{en}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:".75rem",color:"#eac96a"}}>{cu}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:7}}>
                {Object.entries(NUMS).map(([n,cu])=>(
                  <div key={n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 14px",borderRadius:10,background:"rgba(6,4,18,0.95)",border:"1px solid rgba(50,40,90,0.8)",fontSize:".8rem"}}>
                    <span style={{color:"#7868a8"}}>{n}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:".75rem",color:"#b090e8"}}>{cu}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
