import { useState } from 'react'
import { supabase } from '../supabase'

const REASONS=['Spam','Inappropriate content','Hate speech','Misinformation','Other']

export default function ReportButton({user,type,targetId,setPage}){
  const[open,setOpen]=useState(false)
  const[reason,setReason]=useState('')
  const[custom,setCustom]=useState('')
  const[done,setDone]=useState(false)

  if(!user)return null

  const submit=async()=>{
    const finalReason=reason==='Other'?custom:reason
    if(!finalReason.trim())return
    await supabase.from('reports').insert({reporter_id:user.id,type,target_id:targetId,reason:finalReason})
    setDone(true);setTimeout(()=>{setOpen(false);setDone(false);setReason('');setCustom('')},1500)
  }

  return(
    <div style={{position:'relative',display:'inline-block'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:'none',border:'none',color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem',cursor:'pointer',letterSpacing:'.1em',padding:'2px 6px',borderRadius:5,transition:'color .2s'}}
        onMouseEnter={e=>e.currentTarget.style.color='#e07070'}
        onMouseLeave={e=>e.currentTarget.style.color='#3a3060'}>
        ⚑ Report
      </button>
      {open&&(
        <div style={{position:'absolute',right:0,top:'100%',zIndex:200,background:'rgba(5,4,16,0.98)',border:'1px solid rgba(70,58,130,0.7)',borderRadius:12,padding:'1rem',width:220,boxShadow:'0 8px 32px rgba(0,0,0,0.8)',marginTop:4}}>
          {done?(
            <p style={{margin:0,color:'#38b2ac',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',textAlign:'center'}}>✓ Reported</p>
          ):(
            <>
              <p style={{margin:'0 0 10px',color:'#6858a8',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.15em'}}>REPORT REASON</p>
              <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:10}}>
                {REASONS.map(r=>(
                  <button key={r} onClick={()=>setReason(r)} style={{background:reason===r?'rgba(224,112,112,0.12)':'transparent',border:reason===r?'1px solid rgba(224,112,112,0.35)':'1px solid rgba(70,58,130,0.3)',color:reason===r?'#e07070':'#7060a0',borderRadius:7,padding:'5px 10px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer',textAlign:'left'}}>{r}</button>
                ))}
              </div>
              {reason==='Other'&&(
                <input value={custom} onChange={e=>setCustom(e.target.value)} placeholder="Describe the issue…"
                  style={{width:'100%',background:'rgba(10,8,30,0.8)',border:'1px solid rgba(70,58,130,0.4)',borderRadius:7,color:'#f0ead8',fontFamily:"'Crimson Pro',serif",fontSize:'.9rem',padding:'6px 10px',outline:'none',marginBottom:8}}/>
              )}
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>setOpen(false)} style={{flex:1,background:'transparent',border:'1px solid rgba(70,58,130,0.4)',color:'#5848a0',borderRadius:7,padding:'6px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer'}}>Cancel</button>
                <button onClick={submit} disabled={!reason} style={{flex:1,background:'rgba(224,112,112,0.1)',border:'1px solid rgba(224,112,112,0.35)',color:'#e07070',borderRadius:7,padding:'6px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer',opacity:!reason?.5:1}}>Submit</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
