import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function AnnouncementBanner(){
  const[announcements,setAnnouncements]=useState([])
  const[dismissed,setDismissed]=useState([])

  useEffect(()=>{
    supabase.from('announcements').select('*').eq('active',true).order('created_at',{ascending:false}).then(({data})=>setAnnouncements(data||[]))
  },[])

  const active=announcements.filter(a=>!dismissed.includes(a.id))
  if(active.length===0)return null

  return(
    <div style={{position:'fixed',top:56,left:0,right:0,zIndex:99,display:'flex',flexDirection:'column',gap:1}}>
      {active.map(a=>{
        const rgb=a.color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
        return(
          <div key={a.id} style={{background:`rgba(${rgb},0.12)`,borderBottom:`1px solid rgba(${rgb},0.3)`,backdropFilter:'blur(10px)',padding:'8px 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <p style={{margin:0,color:a.color,fontFamily:"'Crimson Pro',serif",fontSize:'.95rem',flex:1,textAlign:'center'}}>{a.content}</p>
            <button onClick={()=>setDismissed(d=>[...d,a.id])} style={{background:'none',border:'none',color:`rgba(${rgb},0.5)`,cursor:'pointer',fontSize:'1rem',flexShrink:0,padding:0}}>✕</button>
          </div>
        )
      })}
    </div>
  )
}
