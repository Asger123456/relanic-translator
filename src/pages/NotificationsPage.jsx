import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { PANEL } from '../styles'
import { NotifSkeleton } from '../components/Skeleton'

function Avatar({ profile, size=36 }) {
  const color = profile?.accent_color||'#c9a84c'
  const rgb = color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  const src = profile?.avatar_url
  if(src) return <img src={src} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:`1.5px solid rgba(${rgb},0.5)`,flexShrink:0}} alt=""/>
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:`rgba(${rgb},0.15)`,border:`1.5px solid rgba(${rgb},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.42}}>{profile?.avatar_emoji||'◈'}</div>
}

const TYPE_ICON = { follow:'⬡', comment:'✦', friend_request:'◈', mention:'@', rating:'★', friend_accepted:'◉' }
const TYPE_MSG  = {
  follow:          (a) => `${a} followed you`,
  comment:         (a,t) => `${a} commented on ${t}`,
  friend_request:  (a) => `${a} sent you a friend request`,
  friend_accepted: (a) => `${a} accepted your friend request`,
  mention:         (a,t) => `${a} mentioned you in ${t}`,
  rating:          (a,t) => `${a} rated ${t}`,
}

export default function NotificationsPage({ user, setPage, setActiveTranslator, setViewProfile }) {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchNotifs()
    // Subscribe to new ones
    const ch = supabase.channel(`notifs:${user.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications', filter:`user_id=eq.${user.id}` },
        payload => setNotifs(n => [payload.new, ...n]))
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  const fetchNotifs = async () => {
    setLoading(true)
    const { data } = await supabase.from('notifications')
      .select('*,actor:actor_id(id,username,avatar_emoji,accent_color,avatar_url),translator:translator_id(id,name)')
      .eq('user_id', user.id).order('created_at', { ascending:false }).limit(60)
    setNotifs(data||[])
    // Mark all read
    await supabase.from('notifications').update({ read:true }).eq('user_id', user.id).eq('read', false)
    setLoading(false)
  }

  const handleClick = async (n) => {
    if (n.translator) {
      const { data } = await supabase.from('translators').select('*,profiles(id,username,accent_color,avatar_emoji,avatar_url),ratings(score)').eq('id', n.translator.id).single()
      if (data) { setActiveTranslator(data); setPage('use') }
    } else if (n.actor && (n.type==='follow'||n.type==='friend_request'||n.type==='friend_accepted')) {
      setViewProfile(n.actor.id); setPage('viewprofile')
    }
  }

  if (!user) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{...PANEL,padding:'2.5rem',textAlign:'center',maxWidth:360}}>
        <p style={{color:'#7060a0',fontFamily:"'Crimson Pro',serif",fontSize:'1.1rem',margin:'0 0 1.5rem'}}>Sign in to see notifications</p>
        <button onClick={()=>setPage('auth')} style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.4)',color:'#c9a84c',borderRadius:10,padding:'10px 22px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',cursor:'pointer'}}>Sign in</button>
      </div>
    </div>
  )

  return (
    <div style={{position:'relative',zIndex:2,minHeight:'100vh',padding:'4.5rem 1.5rem 5rem',maxWidth:680,margin:'0 auto'}}>
      <h1 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'clamp(1.5rem,4vw,2.2rem)',letterSpacing:'.12em',color:'#e8e0d4',margin:'0 0 .4rem',textShadow:'0 0 30px rgba(201,168,76,0.3)'}}>Notifications</h1>
      <p style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.25em',margin:'0 0 2rem'}}>WHAT YOU MISSED</p>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>{[...Array(5)].map((_,i)=><NotifSkeleton key={i}/>)}</div>
      ) : notifs.length===0 ? (
        <div style={{...PANEL,padding:'2.5rem',textAlign:'center'}}>
          <p style={{color:'#4a3a80',fontFamily:"'Crimson Pro',serif",margin:0,fontStyle:'italic'}}>No notifications yet</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          {notifs.map(n => {
            const msg = TYPE_MSG[n.type]?.(n.actor?.username||'Someone', n.translator?.name||'a translator') || n.message || n.type
            const icon = TYPE_ICON[n.type]||'◈'
            return (
              <div key={n.id} onClick={()=>handleClick(n)} style={{
                ...PANEL, padding:'1rem 1.2rem',
                display:'flex', alignItems:'center', gap:12,
                cursor:'pointer', transition:'all .2s', animation:'fadeUp .3s ease',
                borderLeft: n.read ? '3px solid transparent' : '3px solid rgba(201,168,76,0.5)',
                opacity: n.read ? 0.7 : 1,
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(201,168,76,0.3)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor=n.read?'transparent':'rgba(201,168,76,0.5)'}>
                {n.actor ? <Avatar profile={n.actor} size={36}/> : (
                  <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(70,58,130,0.2)',border:'1px solid rgba(70,58,130,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1rem',color:'#c9a84c',flexShrink:0}}>{icon}</div>
                )}
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:'0 0 3px',color:'#c0b8d8',fontFamily:"'Crimson Pro',serif",fontSize:'.95rem',lineHeight:1.4}}>{msg}</p>
                  <span style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem'}}>{new Date(n.created_at).toLocaleDateString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                {!n.read&&<div style={{width:7,height:7,borderRadius:'50%',background:'#c9a84c',flexShrink:0}}/>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
