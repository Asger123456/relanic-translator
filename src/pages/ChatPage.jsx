import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { PANEL, INPUT } from '../styles'

function Avatar({profile,size=36,url}){
  const color=profile?.accent_color||'#c9a84c'
  const rgb=color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  if(url||profile?.avatar_url) return <img src={url||profile.avatar_url} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:`1.5px solid rgba(${rgb},0.5)`,flexShrink:0}} alt=""/>
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:`rgba(${rgb},0.15)`,border:`1.5px solid rgba(${rgb},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.42}}>{profile?.avatar_emoji||'◈'}</div>
}

export default function ChatPage({user,setPage,setViewProfile,chatWith,setChatWith}){
  const[friends,setFriends]=useState([])
  const[requests,setRequests]=useState([])
  const[messages,setMessages]=useState([])
  const[text,setText]=useState('')
  const[loading,setLoading]=useState(true)
  const[sending,setSending]=useState(false)
  const bottomRef=useRef(null)
  const subRef=useRef(null)

  useEffect(()=>{if(user)fetchFriends()},[user])
  useEffect(()=>{
    if(chatWith){fetchMessages();subscribeMessages()}
    return()=>{if(subRef.current)supabase.removeChannel(subRef.current)}
  },[chatWith])
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'})},[messages])

  const fetchFriends=async()=>{
    setLoading(true)
    const{data:reqs}=await supabase.from('friend_requests').select('*,sender:sender_id(id,username,avatar_emoji,accent_color,avatar_url),receiver:receiver_id(id,username,avatar_emoji,accent_color,avatar_url)').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    const accepted=(reqs||[]).filter(r=>r.status==='accepted').map(r=>r.sender_id===user.id?r.receiver:r.sender)
    const pending=(reqs||[]).filter(r=>r.status==='pending'&&r.receiver_id===user.id).map(r=>({...r,sender:r.sender}))
    setFriends(accepted)
    setRequests(pending)
    setLoading(false)
  }

  const fetchMessages=async()=>{
    const{data}=await supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatWith.id}),and(sender_id.eq.${chatWith.id},receiver_id.eq.${user.id})`).order('created_at',{ascending:true})
    setMessages(data||[])
    // mark as read
    await supabase.from('messages').update({read:true}).eq('receiver_id',user.id).eq('sender_id',chatWith.id)
  }

  const subscribeMessages=()=>{
    if(subRef.current)supabase.removeChannel(subRef.current)
    subRef.current=supabase.channel(`chat:${user.id}:${chatWith.id}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{
        const msg=payload.new
        if((msg.sender_id===user.id&&msg.receiver_id===chatWith.id)||(msg.sender_id===chatWith.id&&msg.receiver_id===user.id)){
          setMessages(m=>[...m,msg])
          if(msg.receiver_id===user.id) supabase.from('messages').update({read:true}).eq('id',msg.id)
        }
      }).subscribe()
  }

  const sendMessage=async()=>{
    if(!text.trim()||sending)return
    setSending(true)
    await supabase.from('messages').insert({sender_id:user.id,receiver_id:chatWith.id,content:text.trim()})
    setText('');setSending(false)
  }

  const acceptRequest=async(req)=>{
    await supabase.from('friend_requests').update({status:'accepted'}).eq('id',req.id)
    fetchFriends()
  }

  const declineRequest=async(req)=>{
    await supabase.from('friend_requests').update({status:'declined'}).eq('id',req.id)
    fetchFriends()
  }

  if(!user)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{...PANEL,padding:'2.5rem',textAlign:'center',maxWidth:360}}>
        <p style={{color:'#7060a0',fontFamily:"'Crimson Pro',serif",fontSize:'1.1rem',margin:'0 0 1.5rem'}}>Sign in to chat</p>
        <button onClick={()=>setPage('auth')} style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.4)',color:'#c9a84c',borderRadius:10,padding:'10px 22px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',cursor:'pointer'}}>Sign in</button>
      </div>
    </div>
  )

  return(
    <div style={{position:'relative',zIndex:2,minHeight:'100vh',padding:'4.5rem 0 0',display:'flex',height:'100vh'}}>
      {/* Sidebar */}
      <div style={{width:280,flexShrink:0,borderRight:'1px solid rgba(70,58,130,0.4)',background:'rgba(5,4,16,0.95)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'1.2rem 1rem .8rem',borderBottom:'1px solid rgba(70,58,130,0.3)'}}>
          <h2 style={{margin:0,fontFamily:"'Cinzel Decorative',serif",fontSize:'.9rem',color:'#e8e0d4',letterSpacing:'.1em'}}>Messages</h2>
        </div>

        {/* Friend requests */}
        {requests.length>0&&(
          <div style={{padding:'.8rem 1rem',borderBottom:'1px solid rgba(70,58,130,0.3)'}}>
            <div style={{color:'#e07070',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem',letterSpacing:'.18em',marginBottom:8}}>REQUESTS ({requests.length})</div>
            {requests.map(req=>(
              <div key={req.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <Avatar profile={req.sender} size={28}/>
                <span style={{flex:1,color:'#9080c0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{req.sender?.username}</span>
                <button onClick={()=>acceptRequest(req)} style={{background:'rgba(56,178,172,0.15)',border:'1px solid rgba(56,178,172,0.4)',color:'#38b2ac',borderRadius:6,padding:'3px 8px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',cursor:'pointer'}}>✓</button>
                <button onClick={()=>declineRequest(req)} style={{background:'rgba(200,80,80,0.1)',border:'1px solid rgba(200,80,80,0.3)',color:'#e07070',borderRadius:6,padding:'3px 8px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',cursor:'pointer'}}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Friends list */}
        <div style={{flex:1,overflowY:'auto',padding:'.5rem 0'}}>
          {loading?<div style={{padding:'1rem',color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.72rem',animation:'pulse 1.5s ease infinite'}}>loading…</div>
          :friends.length===0?(
            <div style={{padding:'1.2rem 1rem',color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',lineHeight:1.6}}>No friends yet.<br/>Visit a profile to add friends.</div>
          ):(
            friends.map(f=>(
              <button key={f.id} onClick={()=>setChatWith(f)} style={{
                width:'100%',display:'flex',alignItems:'center',gap:10,padding:'.7rem 1rem',
                background:chatWith?.id===f.id?'rgba(201,168,76,0.08)':'transparent',
                border:'none',borderLeft:chatWith?.id===f.id?'2px solid rgba(201,168,76,0.5)':'2px solid transparent',
                cursor:'pointer',transition:'all .15s',textAlign:'left',
              }}>
                <Avatar profile={f} size={32}/>
                <span style={{color:chatWith?.id===f.id?'#c9a84c':'#8878c0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.username}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div style={{flex:1,display:'flex',flexDirection:'column',background:'rgba(5,4,16,0.85)',overflow:'hidden'}}>
        {chatWith?(
          <>
            {/* Chat header */}
            <div style={{padding:'.9rem 1.4rem',borderBottom:'1px solid rgba(70,58,130,0.3)',display:'flex',alignItems:'center',gap:12,background:'rgba(5,4,16,0.95)'}}>
              <button onClick={()=>{setViewProfile(chatWith.id);setPage('viewprofile')}} style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',alignItems:'center',gap:10}}>
                <Avatar profile={chatWith} size={34}/>
                <span style={{color:'#c9a84c',fontFamily:"'Cinzel Decorative',serif",fontSize:'.85rem',letterSpacing:'.08em'}}>{chatWith.username}</span>
              </button>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:'auto',padding:'1.2rem',display:'flex',flexDirection:'column',gap:8}}>
              {messages.map(m=>{
                const mine=m.sender_id===user.id
                return(
                  <div key={m.id} style={{display:'flex',justifyContent:mine?'flex-end':'flex-start',animation:'fadeUp .2s ease'}}>
                    <div style={{
                      maxWidth:'72%',padding:'9px 14px',borderRadius:mine?'14px 14px 4px 14px':'14px 14px 14px 4px',
                      background:mine?'rgba(201,168,76,0.12)':'rgba(70,58,130,0.2)',
                      border:mine?'1px solid rgba(201,168,76,0.25)':'1px solid rgba(70,58,130,0.4)',
                    }}>
                      <p style={{margin:'0 0 3px',color:mine?'#f0ead8':'#c0b8d8',fontSize:'.95rem',fontFamily:"'Crimson Pro',serif",lineHeight:1.5,wordBreak:'break-word'}}>{m.content}</p>
                      <span style={{color:mine?'rgba(201,168,76,0.4)':'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.58rem'}}>
                        {new Date(m.created_at).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef}/>
            </div>

            {/* Input */}
            <div style={{padding:'.9rem 1.2rem',borderTop:'1px solid rgba(70,58,130,0.3)',display:'flex',gap:10,background:'rgba(5,4,16,0.95)'}}>
              <input value={text} onChange={e=>setText(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()}
                placeholder="Type a message…"
                style={{flex:1,background:'rgba(10,8,30,0.8)',border:'1px solid rgba(70,58,130,0.5)',borderRadius:10,color:'#f0ead8',fontFamily:"'Crimson Pro',serif",fontSize:'1rem',padding:'10px 14px',outline:'none'}}/>
              <button onClick={sendMessage} disabled={sending||!text.trim()} style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.4)',color:'#c9a84c',borderRadius:10,padding:'10px 18px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.75rem',cursor:'pointer',opacity:(sending||!text.trim())?.5:1,transition:'all .2s'}}>Send</button>
            </div>
          </>
        ):(
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{textAlign:'center'}}>
              <p style={{color:'#3a3060',fontFamily:"'Cinzel Decorative',serif",fontSize:'1.1rem',letterSpacing:'.1em',margin:'0 0 .5rem'}}>Select a conversation</p>
              <p style={{color:'#2a2050',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.15em',margin:0}}>or add friends from their profile</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
