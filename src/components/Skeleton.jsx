const GLOBAL_SKEL_CSS = `
@keyframes shimmer {
  0% { background-position: -400px 0 }
  100% { background-position: 400px 0 }
}
.skel {
  background: linear-gradient(90deg, rgba(30,24,60,0.6) 25%, rgba(50,40,90,0.4) 50%, rgba(30,24,60,0.6) 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s ease infinite;
  border-radius: 6px;
}
`
let injected = false
function injectCSS() {
  if (injected) return; injected = true
  const el = document.createElement('style'); el.textContent = GLOBAL_SKEL_CSS; document.head.appendChild(el)
}

export function Skel({ w='100%', h=14, r=6, style={} }) {
  injectCSS()
  return <div className="skel" style={{ width:w, height:h, borderRadius:r, flexShrink:0, ...style }}/>
}

export function CardSkeleton() {
  return (
    <div style={{ background:'rgba(5,4,16,0.95)', border:'1px solid rgba(70,58,130,0.5)', borderRadius:16, padding:'1.3rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
        <Skel w="55%" h={14}/>
        <Skel w={40} h={14}/>
      </div>
      <Skel w="80%" h={11} style={{ marginBottom:8 }}/>
      <Skel w="40%" h={11}/>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:14 }}>
        <Skel w={80} h={10}/>
        <Skel w={70} h={10}/>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div style={{ background:'rgba(5,4,16,0.95)', border:'1px solid rgba(70,58,130,0.5)', borderRadius:16, padding:'2rem', marginBottom:16 }}>
      <div style={{ display:'flex', gap:20, alignItems:'center' }}>
        <Skel w={76} h={76} r={38}/>
        <div style={{ flex:1 }}>
          <Skel w="40%" h={18} style={{ marginBottom:10 }}/>
          <div style={{ display:'flex', gap:16, marginBottom:10 }}>
            <Skel w={80} h={10}/><Skel w={80} h={10}/><Skel w={80} h={10}/>
          </div>
          <Skel w="60%" h={12}/>
        </div>
      </div>
    </div>
  )
}

export function TranslatorRowSkeleton() {
  return (
    <div style={{ background:'rgba(5,4,16,0.95)', border:'1px solid rgba(70,58,130,0.5)', borderRadius:14, padding:'1.1rem 1.4rem', display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ flex:1 }}>
        <Skel w="45%" h={13} style={{ marginBottom:8 }}/>
        <div style={{ display:'flex', gap:10 }}><Skel w={60} h={10}/><Skel w={40} h={10}/></div>
      </div>
      <div style={{ display:'flex', gap:7 }}><Skel w={48} h={28} r={7}/><Skel w={52} h={28} r={7}/></div>
    </div>
  )
}

export function NotifSkeleton() {
  return (
    <div style={{ background:'rgba(5,4,16,0.95)', border:'1px solid rgba(70,58,130,0.5)', borderRadius:12, padding:'1rem 1.2rem', display:'flex', gap:10, alignItems:'center' }}>
      <Skel w={36} h={36} r={18}/>
      <div style={{ flex:1 }}><Skel w="70%" h={12} style={{ marginBottom:6 }}/><Skel w="35%" h={9}/></div>
    </div>
  )
}
