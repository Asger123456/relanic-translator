import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { PANEL } from '../styles'

function Avatar({profile,size=32}){
  const color=profile?.accent_color||'#c9a84c'
  const rgb=color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:`rgba(${rgb},0.15)`,border:`1.5px solid rgba(${rgb},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.42}}>{profile?.avatar_emoji||'◈'}</div>
}

const TYPE_LABEL={published:'published a translator',rated:'rated',commented:'commented on',followed:'followed'}
const TYPE_COLOR={published:'#c9a84c',rated:'#38b2ac',commented:'#9370db',followed:'#e07070'}

export default function ActivityFeed({user,setPage,setActiveTranslator,setViewProfile}){
  const[activities,setActivities]=useState([])
  const[loading,setLoading]=useState(true)

  useEffect(()=>{if(user)fetchFeed()},[user])

  const fetchFeed=async()=>{
    setLoading(true)
    // get following list
    const{data:follows}=await supabase.from('follows').select('following_id').eq('follower_id',user.id)
    const ids=(follows||[]).map(f=>f.following_id)
    if(ids.length===0){setLoading(false);return}
    const{data}=await supabase.from('activity')
      .select('*,profiles(id,username,avatar_emoji,accent_color),translators(id,name),target_profiles:target_user_id(id,username,avatar_emoji,accent_color)')
      .in('user_id',ids)
      .order('created_at',{ascending:false})
      .limit(50)
    setActivities(data||[]);setLoading(false)
  }

  if(!user)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{...PANEL,padding:'2.5rem',textAlign:'center',maxWidth:360}}>
        <p style={{color:'#7060a0',fontFamily:"'Crimson Pro',serif",fontSize:'1.1rem',margin:'0 0 1.5rem'}}>Sign in to see your feed</p>
        <button onClick={()=>setPage('auth')} style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.4)',color:'#c9a84c',borderRadius:10,padding:'10px 22px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',cursor:'pointer'}}>Sign in</button>
      </div>
    </div>
  )

  return(
    <div style={{position:'relative',zIndex:2,minHeight:'100vh',padding:'4.5rem 1.5rem 4rem',maxWidth:680,margin:'0 auto'}}>
      <h1 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'clamp(1.5rem,4vw,2.2rem)',letterSpacing:'.12em',color:'#e8e0d4',margin:'0 0 .4rem',textShadow:'0 0 30px rgba(201,168,76,0.3)'}}>Activity</h1>
      <p style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.25em',margin:'0 0 2rem'}}>FROM PEOPLE YOU FOLLOW</p>

      {loading?(
        <div style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',animation:'pulse 1.5s ease infinite'}}>loading…</div>
      ):activities.length===0?(
        <div style={{...PANEL,padding:'2.5rem',textAlign:'center'}}>
          <p style={{color:'#4a3a70',fontFamily:"'Crimson Pro',serif",margin:'0 0 .5rem'}}>Nothing here yet</p>
          <p style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.72rem',letterSpacing:'.1em',margin:0}}>Follow people to see their activity</p>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {activities.map(a=>(
            <div key={a.id} style={{...PANEL,padding:'1.1rem 1.4rem',display:'flex',gap:12,alignItems:'flex-start',animation:'fadeUp .3s ease'}}>
              <button onClick={()=>{setViewProfile(a.profiles?.id);setPage('viewprofile')}} style={{background:'none',border:'none',cursor:'pointer',padding:0,flexShrink:0}}>
                <Avatar profile={a.profiles} size={36}/>
              </button>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:2}}>
                  <span style={{color:'#9080c0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem',fontWeight:500}}>{a.profiles?.username}</span>
                  <span style={{color:TYPE_COLOR[a.type]||'#c9a84c',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem'}}>{TYPE_LABEL[a.type]||a.type}</span>
                  {a.translators&&(
                    <button onClick={()=>{
                      supabase.from('translators').select('*,profiles(id,username,accent_color,avatar_emoji),ratings(score)').eq('id',a.translators.id).single().then(({data})=>{if(data){setActiveTranslator(data);setPage('use')}})
                    }} style={{background:'none',border:'none',color:'#c9a84c',fontFamily:"'Cinzel Decorative',serif",fontSize:'.72rem',cursor:'pointer',padding:0}}>{a.translators.name}</button>
                  )}
                </div>
                <span style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem'}}>{new Date(a.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
