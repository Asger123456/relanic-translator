import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { PANEL } from '../styles'
import { toast } from '../components/Toast'
import { notify } from '../utils/notifications'
import { BadgeList, BadgeIcon, ROLE_BADGE_IDS } from '../components/Badges'

function Avatar({profile,size=64}){
  const color=profile?.accent_color||'#c9a84c'
  const rgb=color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  if(profile?.avatar_url) return <img src={profile.avatar_url} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:`2px solid rgba(${rgb},0.6)`,boxShadow:`0 0 20px rgba(${rgb},0.2)`,flexShrink:0}} alt=""/>
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:`rgba(${rgb},0.15)`,border:`2px solid rgba(${rgb},0.6)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.42,boxShadow:`0 0 20px rgba(${rgb},0.2)`}}>{profile?.avatar_emoji||'◈'}</div>
}

export default function ViewProfile({profileId,user,setPage,setActiveTranslator,setChatWith}){
  const[profile,setProfile]=useState(null)
  const[translators,setTranslators]=useState([])
  const[followers,setFollowers]=useState(0)
  const[following,setFollowing]=useState(0)
  const[isFollowing,setIsFollowing]=useState(false)
  const[friendStatus,setFriendStatus]=useState(null) // null | 'pending_sent' | 'pending_received' | 'friends'
  const[loading,setLoading]=useState(true)
  const[toggling,setToggling]=useState(false)

  useEffect(()=>{if(profileId)fetchAll()},[profileId,user])

  const fetchAll=async()=>{
    setLoading(true)
    const[{data:prof},{data:trans},{data:foll},{data:folling}]=await Promise.all([
      supabase.from('profiles').select('*').eq('id',profileId).single(),
      supabase.from('translators').select('*,ratings(score)').eq('user_id',profileId).order('created_at',{ascending:false}),
      supabase.from('follows').select('id',{count:'exact'}).eq('following_id',profileId),
      supabase.from('follows').select('id',{count:'exact'}).eq('follower_id',profileId),
    ])
    setProfile(prof);setTranslators(trans||[])
    setFollowers(foll?.length||0);setFollowing(folling?.length||0)
    if(user){
      const{data:f}=await supabase.from('follows').select('id').eq('follower_id',user.id).eq('following_id',profileId).single()
      setIsFollowing(!!f)
      // check friend status
      const{data:req}=await supabase.from('friend_requests').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${profileId}),and(sender_id.eq.${profileId},receiver_id.eq.${user.id})`).single()
      if(req){
        if(req.status==='accepted') setFriendStatus('friends')
        else if(req.status==='pending') setFriendStatus(req.sender_id===user.id?'pending_sent':'pending_received')
        else setFriendStatus(null)
      } else setFriendStatus(null)
    }
    setLoading(false)
  }

  const toggleFollow=async()=>{
    if(!user)return setPage('auth')
    setToggling(true)
    if(isFollowing){
      await supabase.from('follows').delete().eq('follower_id',user.id).eq('following_id',profileId)
      setFollowers(f=>f-1);setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({follower_id:user.id,following_id:profileId})
      await supabase.from('activity').insert({user_id:user.id,type:'followed',target_user_id:profileId})
      await notify(profileId,'follow',user.id)
      toast('Following!','success')
      setFollowers(f=>f+1);setIsFollowing(true)
    }
    setToggling(false)
  }

  const sendFriendRequest=async()=>{
    if(!user)return setPage('auth')
    setToggling(true)
    await supabase.from('friend_requests').insert({sender_id:user.id,receiver_id:profileId})
    await notify(profileId,'friend_request',user.id)
    toast('Friend request sent!','success')
    setFriendStatus('pending_sent')
    setToggling(false)
  }

  const openChat=()=>{
    if(setChatWith){setChatWith(profile);setPage('chat')}
  }

  if(loading)return(
    <div style={{position:'relative',zIndex:2,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',animation:'pulse 1.5s ease infinite'}}>loading…</div>
    </div>
  )
  if(!profile)return null

  const accent=profile.accent_color||'#c9a84c'
  const rgb=accent.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  const isOwn=user?.id===profileId

  const friendBtn=()=>{
    if(friendStatus==='friends') return(
      <button onClick={openChat} style={{background:`rgba(${rgb},0.12)`,border:`1px solid rgba(${rgb},0.45)`,color:accent,borderRadius:10,padding:'9px 20px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.75rem',letterSpacing:'.1em',cursor:'pointer'}}>✉ Message</button>
    )
    if(friendStatus==='pending_sent') return(
      <button disabled style={{background:'rgba(70,58,130,0.15)',border:'1px solid rgba(70,58,130,0.35)',color:'#5848a0',borderRadius:10,padding:'9px 20px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.75rem',letterSpacing:'.1em',cursor:'default',opacity:.7}}>Request sent</button>
    )
    if(friendStatus==='pending_received') return(
      <button onClick={async()=>{
        const{data}=await supabase.from('friend_requests').select('id').eq('sender_id',profileId).eq('receiver_id',user.id).single()
        if(data){await supabase.from('friend_requests').update({status:'accepted'}).eq('id',data.id);setFriendStatus('friends')}
      }} style={{background:'rgba(56,178,172,0.12)',border:'1px solid rgba(56,178,172,0.4)',color:'#38b2ac',borderRadius:10,padding:'9px 20px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.75rem',letterSpacing:'.1em',cursor:'pointer'}}>Accept request</button>
    )
    return(
      <button onClick={sendFriendRequest} disabled={toggling} style={{background:'rgba(70,58,130,0.15)',border:'1px solid rgba(70,58,130,0.4)',color:'#7868a8',borderRadius:10,padding:'9px 20px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.75rem',letterSpacing:'.1em',cursor:'pointer',opacity:toggling?.6:1}}>+ Add friend</button>
    )
  }

  return(
    <div style={{position:'relative',zIndex:2,minHeight:'100vh',padding:'4.5rem 1.5rem 4rem',maxWidth:780,margin:'0 auto'}}>
      <button onClick={()=>history.back()} style={{background:'none',border:'none',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.12em',cursor:'pointer',marginBottom:'1.5rem',padding:0}}>← BACK</button>

      <div style={{...PANEL,padding:'2rem',marginBottom:16}}>
        <div style={{display:'flex',gap:20,alignItems:'center',flexWrap:'wrap'}}>
          <Avatar profile={profile} size={76}/>
          <div style={{flex:1}}>
            <h2 style={{margin:'0 0 6px',fontFamily:"'Cinzel Decorative',serif",fontSize:'1.4rem',color:'#e8e0d4',letterSpacing:'.08em'}}>{profile.username}</h2>
            <div style={{display:'flex',gap:18,marginBottom:10,flexWrap:'wrap'}}>
              <span style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.12em'}}>{followers} FOLLOWERS</span>
              <span style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.12em'}}>{following} FOLLOWING</span>
              <span style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.12em'}}>{translators.length} TRANSLATORS</span>
            </div>
            {profile.bio&&<p style={{margin:0,color:'#7060a0',fontSize:'.95rem',lineHeight:1.5,marginBottom:8}}>{profile.bio}</p>}
          </div>
          {!isOwn&&(
            <div style={{display:'flex',gap:8,flexWrap:'wrap',flexShrink:0}}>
              {friendBtn()}
              <button onClick={toggleFollow} disabled={toggling} style={{background:isFollowing?`rgba(${rgb},0.12)`:'transparent',border:isFollowing?`1px solid rgba(${rgb},0.45)`:`1px solid rgba(${rgb},0.35)`,color:isFollowing?accent:`rgba(${rgb},0.8)`,borderRadius:10,padding:'9px 20px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.75rem',letterSpacing:'.1em',cursor:'pointer',transition:'all .2s',opacity:toggling?.6:1}}>
                {isFollowing?'Following':'Follow'}
              </button>
            </div>
          )}
          {isOwn&&<button onClick={()=>setPage('profile')} style={{background:'rgba(70,58,130,0.2)',border:'1px solid rgba(70,58,130,0.4)',color:'#7060a0',borderRadius:10,padding:'9px 20px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.75rem',cursor:'pointer'}}>Edit profile</button>}
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <span style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.22em'}}>{profile.username.toUpperCase()}'S TRANSLATORS</span>
      </div>
      {translators.length===0?(
        <div style={{...PANEL,padding:'2rem',textAlign:'center'}}>
          <p style={{color:'#4a3a80',fontFamily:"'Crimson Pro',serif",margin:0}}>No translators published yet</p>
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
          {translators.map(t=>{
            const avg=t.ratings?.length?(t.ratings.reduce((s,r)=>s+r.score,0)/t.ratings.length).toFixed(1):null
            return(
              <div key={t.id} onClick={()=>{setActiveTranslator({...t,profiles:profile});setPage('use')}}
                style={{...PANEL,padding:'1.2rem',cursor:'pointer',transition:'all .2s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=`rgba(${rgb},0.5)`;e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(70,58,130,0.7)';e.currentTarget.style.transform='translateY(0)'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <h4 style={{margin:0,fontFamily:"'Cinzel Decorative',serif",fontSize:'.88rem',color:'#e8e0d4',letterSpacing:'.05em'}}>{t.name}</h4>
                  {avg&&<span style={{color:'#c9a84c',fontFamily:"'JetBrains Mono',monospace",fontSize:'.78rem'}}>★ {avg}</span>}
                </div>
                {t.description&&<p style={{margin:'0 0 8px',color:'#7060a0',fontSize:'.85rem',lineHeight:1.4}}>{t.description}</p>}
                <span style={{color:'#3a3070',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.1em'}}>{Object.keys(t.words||{}).length} WORDS</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
