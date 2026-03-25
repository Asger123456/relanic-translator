import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { PANEL, INPUT } from '../styles'
import ReportButton from '../components/ReportButton'
import { toast } from '../components/Toast'
import { notify, checkAndAwardBadges } from '../utils/notifications'

const GLYPHS='abcdefghijklmnopqrstuvwxyz'
function DecryptedText({text,seed}){
  const[d,setD]=useState('');const r={current:null}
  useEffect(()=>{
    if(!text){setD('');return}
    let f=0
    const run=()=>{f++;const rev=Math.floor((f/22)*text.length);let s=''
      for(let k=0;k<text.length;k++){const c=text[k];s+=c===' '||c==='\n'?c:k<rev?c:GLYPHS[Math.floor(Math.random()*26)]}
      setD(s);if(f<22){r.current=requestAnimationFrame(run)}else setD(text)}
    if(r.current)cancelAnimationFrame(r.current);r.current=requestAnimationFrame(run)
    return()=>{if(r.current)cancelAnimationFrame(r.current)}
  },[text,seed])
  return <>{d}</>
}

function translate(text,words){
  if(!text.trim())return''
  const sorted=Object.keys(words).sort((a,b)=>b.split(' ').length-a.split(' ').length)
  const parts=text.split(/(\s+)/),out=[];let i=0
  while(i<parts.length){
    const tok=parts[i];if(!tok){i++;continue}
    if(/^\s+$/.test(tok)){out.push(tok);i++;continue}
    const word=tok.toLowerCase().replace(/[^a-z0-9']/g,'');let matched=false
    for(const phrase of sorted){
      const pw=phrase.split(' ')
      if(pw.length===1){if(word===phrase){out.push(words[phrase]);i++;matched=true;break}}
      else{const ws=[word];let j=i+1;while(ws.length<pw.length&&j<parts.length){if(!parts[j]||/^\s+$/.test(parts[j])){j++;continue}ws.push(parts[j].toLowerCase().replace(/[^a-z0-9']/g,''));j++}
        if(ws.join(' ')===phrase){out.push(words[phrase]);i=j;matched=true;break}}
    }
    if(!matched){out.push(tok);i++}
  }
  return out.join(' ')
}

function Stars({score,onChange}){
  const[hover,setHover]=useState(0)
  return(
    <div style={{display:'flex',gap:4}}>
      {[1,2,3,4,5].map(n=>(
        <span key={n} onMouseEnter={()=>onChange&&setHover(n)} onMouseLeave={()=>onChange&&setHover(0)} onClick={()=>onChange&&onChange(n)}
          style={{fontSize:'1.2rem',cursor:onChange?'pointer':'default',color:n<=(hover||score)?'#c9a84c':'#2e2860',transition:'color .15s'}}>★</span>
      ))}
    </div>
  )
}

function Avatar({profile,size=28}){
  const color=profile?.accent_color||'#c9a84c'
  const rgb=color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:`rgba(${rgb},0.15)`,border:`1.5px solid rgba(${rgb},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.42}}>{profile?.avatar_emoji||'◈'}</div>
}

function Comment({c,user,onReply,setPage,depth=0}){
  const[replying,setReplying]=useState(false)
  const[text,setText]=useState('')
  const[submitting,setSubmitting]=useState(false)
  const submit=async()=>{
    if(!text.trim())return
    setSubmitting(true)
    await onReply(c.id,text.trim())
    setText('');setReplying(false);setSubmitting(false)
  }
  return(
    <div style={{marginLeft:depth>0?20:0,borderLeft:depth>0?'1px solid rgba(70,58,130,0.3)':'none',paddingLeft:depth>0?14:0}}>
      <div style={{marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
          <Avatar profile={c.profiles} size={24}/>
          <span style={{color:'#6858a8',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem'}}>{c.profiles?.username||'anon'}</span>
          <span style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem'}}>{new Date(c.created_at).toLocaleDateString()}</span>
        </div>
        <p style={{margin:'0 0 6px',color:'#b0a8c8',fontSize:'.95rem',lineHeight:1.6}}>{c.content}</p>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
        {user&&<button onClick={()=>setReplying(r=>!r)} style={{background:'none',border:'none',color:'#4838a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer',padding:0,letterSpacing:'.1em'}}>↩ reply</button>}
        <ReportButton user={user} type="comment" targetId={c.id} setPage={setPage}/>
      </div>
      </div>
      {replying&&(
        <div style={{display:'flex',gap:8,marginBottom:12}}>
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="Write a reply…"
            style={{flex:1,background:'rgba(5,4,16,0.8)',border:'1px solid rgba(70,58,130,0.5)',borderRadius:8,color:'#f0ead8',fontFamily:"'Crimson Pro',serif",fontSize:'.95rem',padding:'7px 12px',outline:'none'}}
            onKeyDown={e=>e.key==='Enter'&&submit()}/>
          <button onClick={submit} disabled={submitting} style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.35)',color:'#c9a84c',borderRadius:8,padding:'7px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',cursor:'pointer'}}>Reply</button>
        </div>
      )}
      {c.replies?.map(r=><Comment key={r.id} c={r} user={user} onReply={onReply} setPage={setPage} depth={depth+1}/>)}
    </div>
  )
}

export default function UsePage({translator,user,setPage,setViewProfile,setEditTranslator}){
  const[input,setInput]=useState('')
  const[seed,setSeed]=useState(0)
  const[activeTab,setActiveTab]=useState('translate') // translate|words|grammar|comments
  const[ratings,setRatings]=useState([])
  const[myRating,setMyRating]=useState(null)
  const[comment,setComment]=useState('')
  const[score,setScore]=useState(0)
  const[comments,setComments]=useState([])
  const[newComment,setNewComment]=useState('')
  const[wordLikes,setWordLikes]=useState({})
  const[submitting,setSubmitting]=useState(false)
  const[filterCat,setFilterCat]=useState('all')

  const output=translate(input,translator?.words||{})
  useEffect(()=>{setSeed(s=>s+1)},[output])
  useEffect(()=>{if(translator){fetchRatings();fetchComments();if(user)fetchWordLikes()}},[translator])

  const fetchRatings=async()=>{
    const{data}=await supabase.from('ratings').select('*,profiles(username,avatar_emoji,accent_color)').eq('translator_id',translator.id).order('created_at',{ascending:false})
    setRatings(data||[])
    if(user){const mine=(data||[]).find(r=>r.user_id===user.id);if(mine){setMyRating(mine);setScore(mine.score);setComment(mine.comment||'')}}
  }

  const fetchComments=async()=>{
    const{data}=await supabase.from('comments').select('*,profiles(username,avatar_emoji,accent_color)').eq('translator_id',translator.id).is('parent_id',null).order('created_at',{ascending:false})
    if(!data){setComments([]);return}
    const withReplies=await Promise.all(data.map(async c=>{
      const{data:replies}=await supabase.from('comments').select('*,profiles(username,avatar_emoji,accent_color)').eq('parent_id',c.id).order('created_at',{ascending:true})
      return{...c,replies:replies||[]}
    }))
    setComments(withReplies)
  }

  const fetchWordLikes=async()=>{
    const{data}=await supabase.from('word_likes').select('word_key').eq('translator_id',translator.id).eq('user_id',user.id)
    const map={};(data||[]).forEach(l=>{map[l.word_key]=true});setWordLikes(map)
  }

  const submitRating=async()=>{
    if(!user||score===0)return;setSubmitting(true)
    if(myRating){await supabase.from('ratings').update({score,comment}).eq('id',myRating.id)}
    else{
      await supabase.from('ratings').insert({user_id:user.id,translator_id:translator.id,score,comment})
      await supabase.from('activity').insert({user_id:user.id,type:'rated',translator_id:translator.id})
      if(translator.profiles?.id) await notify(translator.profiles.id,'rating',user.id,translator.id)
      await checkAndAwardBadges(user.id)
    }
    toast(myRating?'Rating updated!':'Rating submitted!','success')
    await fetchRatings();setSubmitting(false)
  }

  const submitComment=async()=>{
    if(!user||!newComment.trim())return;setSubmitting(true)
    await supabase.from('comments').insert({translator_id:translator.id,user_id:user.id,content:newComment.trim()})
    await supabase.from('activity').insert({user_id:user.id,type:'commented',translator_id:translator.id})
    // notify translator owner
    if(translator.profiles?.id) await notify(translator.profiles.id,'comment',user.id,translator.id)
    // check mentions
    const mentioned=newComment.match(/@(\w+)/g)||[]
    for(const m of mentioned){
      const uname=m.slice(1)
      const{data:mp}=await supabase.from('profiles').select('id').eq('username',uname).single()
      if(mp) await notify(mp.id,'mention',user.id,translator.id)
    }
    await checkAndAwardBadges(user.id)
    toast('Comment posted!','success')
    setNewComment('');await fetchComments();setSubmitting(false)
  }

  const submitReply=async(parentId,content)=>{
    if(!user)return
    await supabase.from('comments').insert({translator_id:translator.id,user_id:user.id,parent_id:parentId,content})
    await fetchComments()
  }

  const toggleWordLike=async(wordKey)=>{
    if(!user)return
    if(wordLikes[wordKey]){
      await supabase.from('word_likes').delete().eq('user_id',user.id).eq('translator_id',translator.id).eq('word_key',wordKey)
      setWordLikes(l=>({...l,[wordKey]:false}))
    } else {
      await supabase.from('word_likes').insert({user_id:user.id,translator_id:translator.id,word_key:wordKey})
      setWordLikes(l=>({...l,[wordKey]:true}))
    }
  }

  const shareURL=()=>{
    const url=`${window.location.origin}?t=${translator.id}`
    navigator.clipboard.writeText(url)
    toast('Link copied!','success')
  }

  if(!translator)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{...PANEL,padding:'2rem',textAlign:'center'}}>
        <p style={{color:'#7060a0',fontFamily:"'Crimson Pro',serif",margin:'0 0 1rem'}}>No translator selected</p>
        <button onClick={()=>setPage('marketplace')} style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.4)',color:'#c9a84c',borderRadius:10,padding:'10px 22px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.78rem',cursor:'pointer'}}>Browse marketplace</button>
      </div>
    </div>
  )

  const avg=ratings.length?(ratings.reduce((s,r)=>s+r.score,0)/ratings.length).toFixed(1):null
  const words=translator.words||{}
  const cats=translator.word_categories||{}
  const allCats=['all',...new Set(Object.values(cats))]
  const filteredWords=Object.entries(words).filter(([k])=>filterCat==='all'||cats[k]===filterCat)

  const TABS=['translate','words','grammar','comments']

  return(
    <div style={{position:'relative',zIndex:2,minHeight:'100vh',padding:'4.5rem 1.5rem 4rem',maxWidth:920,margin:'0 auto'}}>
      <button onClick={()=>setPage('marketplace')} style={{background:'none',border:'none',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.12em',cursor:'pointer',marginBottom:'1.2rem',padding:0}}>← BACK</button>

      {/* Header */}
      <div style={{...PANEL,padding:'1.6rem',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
              {translator.family&&<span style={{background:'rgba(70,58,130,0.25)',border:'1px solid rgba(70,58,130,0.4)',color:'#7868a8',borderRadius:6,padding:'2px 10px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem',letterSpacing:'.12em'}}>{translator.family}</span>}
            </div>
            <h1 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'clamp(1.3rem,3.5vw,2rem)',color:'#e8e0d4',margin:'0 0 6px',letterSpacing:'.08em',textShadow:'0 0 24px rgba(201,168,76,0.3)'}}>{translator.name}</h1>
            {translator.description&&<p style={{margin:'0 0 8px',color:'#7060a0',fontSize:'.9rem',lineHeight:1.5}}>{translator.description}</p>}
            <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
              <span style={{color:'#3a3070',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',letterSpacing:'.12em'}}>{Object.keys(words).length} WORDS</span>
              {avg&&<><Stars score={parseFloat(avg)}/><span style={{color:'#c9a84c',fontFamily:"'JetBrains Mono',monospace",fontSize:'.78rem'}}>{avg} ({ratings.length})</span></>}
              {translator.profiles&&(
                <button onClick={()=>{setViewProfile&&setViewProfile(translator.profiles.id);setPage('viewprofile')}} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:0}}>
                  <Avatar profile={translator.profiles} size={22}/>
                  <span style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem'}}>{translator.profiles.username}</span>
                </button>
              )}
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
            {user&&translator?.user_id===user?.id&&setEditTranslator&&(
              <button onClick={()=>{setEditTranslator(translator);setPage('create')}} style={{background:'rgba(70,58,130,0.15)',border:'1px solid rgba(70,58,130,0.4)',color:'#7868a8',borderRadius:9,padding:'8px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',cursor:'pointer'}}>✎ Edit</button>
            )}
            <button onClick={shareURL} style={{background:'rgba(70,58,130,0.15)',border:'1px solid rgba(70,58,130,0.4)',color:'#7868a8',borderRadius:9,padding:'8px 16px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.1em',cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(120,100,180,0.7)';e.currentTarget.style.color='#a090c8'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(70,58,130,0.4)';e.currentTarget.style.color='#7868a8'}}>
              ⎘ Copy link
            </button>
            <ReportButton user={user} type="translator" targetId={translator?.id} setPage={setPage}/>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:14,flexWrap:'wrap'}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)} style={{
            background:activeTab===t?'rgba(201,168,76,0.1)':'transparent',
            border:activeTab===t?'1px solid rgba(201,168,76,0.35)':'1px solid rgba(70,58,130,0.4)',
            color:activeTab===t?'#c9a84c':'#5848a0',borderRadius:8,padding:'7px 16px',
            fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.1em',
            cursor:'pointer',transition:'all .2s',textTransform:'uppercase',
          }}>{t}{t==='comments'&&comments.length>0?` (${comments.length})`:''}</button>
        ))}
      </div>

      {/* TRANSLATE TAB */}
      {activeTab==='translate'&&(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14,marginBottom:20}}>
            <div style={PANEL}>
              <div style={{padding:'10px 16px 6px',fontSize:'.63rem',letterSpacing:'.28em',textTransform:'uppercase',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",borderBottom:'1px solid rgba(70,58,130,0.4)'}}>Input</div>
              <textarea style={{width:'100%',minHeight:160,background:'transparent',border:'none',outline:'none',color:'#f0ead8',fontFamily:"'Crimson Pro',serif",fontSize:'1.1rem',lineHeight:1.75,resize:'none',padding:'12px 16px'}}
                value={input} onChange={e=>setInput(e.target.value)} placeholder="Type to translate…"/>
            </div>
            <div style={PANEL}>
              <div style={{padding:'10px 16px 6px',fontSize:'.63rem',letterSpacing:'.28em',textTransform:'uppercase',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",borderBottom:'1px solid rgba(70,58,130,0.4)'}}>Translation</div>
              <div style={{minHeight:160,padding:'12px 16px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.98rem',lineHeight:1.75,color:'#eac96a',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>
                {output.trim()?<DecryptedText text={output} seed={seed}/>:<span style={{color:'#2e2860'}}>Translation appears here…</span>}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div style={{...PANEL,padding:'1.6rem'}}>
            <h3 style={{margin:'0 0 1rem',color:'#6858a8',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.22em'}}>{myRating?'UPDATE RATING':'RATE THIS TRANSLATOR'}</h3>
            {user?(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <Stars score={score} onChange={setScore}/>
                <textarea style={{...INPUT,minHeight:70,resize:'none',fontFamily:"'Crimson Pro',serif"}} placeholder="Leave a comment (optional)…" value={comment} onChange={e=>setComment(e.target.value)}/>
                <button onClick={submitRating} disabled={submitting||score===0} style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.35)',color:'#c9a84c',borderRadius:9,padding:'9px 20px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem',letterSpacing:'.1em',cursor:'pointer',alignSelf:'flex-start',opacity:(submitting||score===0)?.5:1}}>
                  {submitting?'Saving…':myRating?'Update':'Submit rating'}
                </button>
              </div>
            ):(
              <p style={{color:'#4a3a70',fontFamily:"'Crimson Pro',serif",margin:0}}>
                <button onClick={()=>setPage('auth')} style={{background:'none',border:'none',color:'#c9a84c',cursor:'pointer',fontFamily:'inherit',fontSize:'inherit'}}>Sign in</button> to rate
              </p>
            )}
          </div>
        </>
      )}

      {/* WORDS TAB */}
      {activeTab==='words'&&(
        <div style={{...PANEL,padding:'1.6rem'}}>
          {/* Category filter */}
          {allCats.length>1&&(
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
              {allCats.map(c=>(
                <button key={c} onClick={()=>setFilterCat(c)} style={{
                  background:filterCat===c?'rgba(201,168,76,0.1)':'transparent',
                  border:filterCat===c?'1px solid rgba(201,168,76,0.35)':'1px solid rgba(70,58,130,0.35)',
                  color:filterCat===c?'#c9a84c':'#5848a0',borderRadius:7,padding:'4px 12px',
                  fontFamily:"'JetBrains Mono',monospace",fontSize:'.66rem',letterSpacing:'.1em',cursor:'pointer',
                }}>{c}</button>
              ))}
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}}>
            {filteredWords.map(([k,v])=>(
              <div key={k} style={{background:'rgba(5,4,16,0.6)',border:'1px solid rgba(50,40,90,0.6)',borderRadius:10,padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                    <span style={{color:'#8878c0',fontSize:'.88rem'}}>{k}</span>
                    {cats[k]&&<span style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.58rem',letterSpacing:'.1em'}}>{cats[k]}</span>}
                  </div>
                  <span style={{color:'#eac96a',fontFamily:"'JetBrains Mono',monospace",fontSize:'.82rem'}}>{v}</span>
                </div>
                <button onClick={()=>toggleWordLike(k)} style={{background:'none',border:'none',cursor:user?'pointer':'default',fontSize:'1rem',color:wordLikes[k]?'#e07070':'#3a3060',transition:'color .2s',flexShrink:0,padding:0}}
                  title={user?'Like this word':'Sign in to like'}>
                  {wordLikes[k]?'♥':'♡'}
                </button>
              </div>
            ))}
          </div>
          {/* Export */}
          <div style={{display:'flex',gap:8,marginTop:16,paddingTop:16,borderTop:'1px solid rgba(50,40,90,0.4)'}}>
            <button onClick={()=>{
              const data={name:translator.name,description:translator.description,family:translator.family,grammar:translator.grammar,words:Object.fromEntries(Object.entries(words).map(([k,v])=>([k,{translation:v,category:cats[k]||'noun'}])))}
              const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
              const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${translator.name}.json`;a.click()
            }} style={{background:'transparent',border:'1px solid rgba(70,58,130,0.4)',color:'#5848a0',borderRadius:8,padding:'7px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',cursor:'pointer'}}>Export JSON</button>
            <button onClick={()=>{
              const csv=Object.entries(words).map(([k,v])=>`${k},${v},${cats[k]||'noun'}`).join('\n')
              const blob=new Blob([csv],{type:'text/csv'})
              const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${translator.name}.csv`;a.click()
            }} style={{background:'transparent',border:'1px solid rgba(70,58,130,0.4)',color:'#5848a0',borderRadius:8,padding:'7px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',cursor:'pointer'}}>Export CSV</button>
          </div>
        </div>
      )}

      {/* GRAMMAR TAB */}
      {activeTab==='grammar'&&(
        <div style={{...PANEL,padding:'1.8rem'}}>
          {translator.grammar?(
            <div style={{color:'#c0b8d8',fontSize:'1rem',lineHeight:1.8,fontFamily:"'Crimson Pro',serif",whiteSpace:'pre-wrap'}}>{translator.grammar}</div>
          ):(
            <p style={{color:'#4a3a70',fontFamily:"'Crimson Pro',serif",margin:0,fontStyle:'italic'}}>No grammar rules have been added for this language yet.</p>
          )}
        </div>
      )}

      {/* COMMENTS TAB */}
      {activeTab==='comments'&&(
        <div style={{...PANEL,padding:'1.8rem'}}>
          {user&&(
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              <input value={newComment} onChange={e=>setNewComment(e.target.value)}
                placeholder="Write a comment…"
                style={{flex:1,background:'rgba(5,4,16,0.8)',border:'1px solid rgba(70,58,130,0.5)',borderRadius:9,color:'#f0ead8',fontFamily:"'Crimson Pro',serif",fontSize:'1rem',padding:'9px 14px',outline:'none'}}
                onKeyDown={e=>e.key==='Enter'&&submitComment()}/>
              <button onClick={submitComment} disabled={submitting||!newComment.trim()} style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.35)',color:'#c9a84c',borderRadius:9,padding:'9px 18px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem',cursor:'pointer',opacity:(submitting||!newComment.trim())?.5:1}}>Post</button>
            </div>
          )}
          {comments.length===0?(
            <p style={{color:'#4a3a70',fontFamily:"'Crimson Pro',serif",margin:0,textAlign:'center',fontStyle:'italic'}}>No comments yet — be the first!</p>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {comments.map(c=><Comment key={c.id} c={c} user={user} onReply={submitReply} setPage={setPage}/>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
