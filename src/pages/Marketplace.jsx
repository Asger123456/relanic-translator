import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { PANEL } from '../styles'
import { CardSkeleton } from '../components/Skeleton'

const FAMILIES = ['all','personal','fantasy','alien','ancient','sci-fi','spiritual','humorous','other']

function Avatar({profile,size=28}){
  const color=profile?.accent_color||'#c9a84c'
  const rgb=color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:`rgba(${rgb},0.15)`,border:`1.5px solid rgba(${rgb},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.42}}>{profile?.avatar_emoji||'◈'}</div>
}

const BADGES=[
  {min:1,label:'Wordsmith',color:'#c9a84c'},
  {min:100,label:'Lexicon',color:'#38b2ac'},
  {min:500,label:'Tongue Master',color:'#9370db'},
]

function getBadge(count){
  return [...BADGES].reverse().find(b=>count>=b.min)
}

function TranslatorCard({t,onClick,setPage,setViewProfile}){
  const avg=t.ratings?.length?(t.ratings.reduce((s,r)=>s+r.score,0)/t.ratings.length).toFixed(1):null
  const color=t.profiles?.accent_color||'#c9a84c'
  const rgb=color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  const wordCount=Object.keys(t.words||{}).length
  const badge=getBadge(wordCount)

  return(
    <div onClick={onClick} style={{...PANEL,padding:'1.3rem',cursor:'pointer',animation:'fadeUp .3s ease both',transition:'border-color .2s,transform .15s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=`rgba(${rgb},0.5)`;e.currentTarget.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(70,58,130,0.7)';e.currentTarget.style.transform='translateY(0)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:4,flexWrap:'wrap'}}>
            {t.family&&t.family!=='personal'&&<span style={{background:'rgba(70,58,130,0.2)',border:'1px solid rgba(70,58,130,0.35)',color:'#6858a0',borderRadius:5,padding:'1px 8px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.58rem',letterSpacing:'.1em'}}>{t.family}</span>}
          </div>
          <h3 style={{margin:0,fontFamily:"'Cinzel Decorative',serif",fontSize:'.92rem',color:'#e8e0d4',letterSpacing:'.06em',lineHeight:1.3}}>{t.name}</h3>
        </div>
        {avg&&<span style={{color:'#c9a84c',fontFamily:"'JetBrains Mono',monospace",fontSize:'.78rem',flexShrink:0,marginLeft:8}}>★ {avg}</span>}
      </div>
      {t.description&&<p style={{margin:'0 0 10px',color:'#7060a0',fontSize:'.85rem',lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{t.description}</p>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:'#3a3070',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem',letterSpacing:'.1em'}}>{wordCount} WORDS</span>
          {badge&&<span style={{color:badge.color,fontFamily:"'JetBrains Mono',monospace",fontSize:'.58rem',letterSpacing:'.08em',opacity:.8}}>✦ {badge.label}</span>}
        </div>
        <button onClick={e=>{e.stopPropagation();setViewProfile(t.profiles?.id);setPage('viewprofile')}} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:0}}>
          <Avatar profile={t.profiles} size={20}/>
          <span style={{color:'#4848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem'}}>{t.profiles?.username||'anon'}</span>
        </button>
      </div>
    </div>
  )
}

export default function Marketplace({user,setPage,setActiveTranslator,setViewProfile}){
  const[translators,setTranslators]=useState([])
  const[loading,setLoading]=useState(true)
  const[search,setSearch]=useState('')
  const[sort,setSort]=useState('newest')
  const[feed,setFeed]=useState(false)
  const[following,setFollowing]=useState([])
  const[familyFilter,setFamilyFilter]=useState('all')

  useEffect(()=>{fetchTranslators()},[])
  useEffect(()=>{if(user)fetchFollowing()},[user])

  // Handle shared link
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search)
    const tid=params.get('t')
    if(tid){
      supabase.from('translators').select('*,profiles(id,username,accent_color,avatar_emoji),ratings(score)').eq('id',tid).single().then(({data})=>{
        if(data){setActiveTranslator(data);setPage('use')}
      })
      window.history.replaceState({},'',window.location.pathname)
    }
  },[])

  const fetchTranslators=async()=>{
    setLoading(true)
    const{data}=await supabase.from('translators').select('*,profiles(id,username,accent_color,avatar_emoji),ratings(score)').eq('visibility','public').order('created_at',{ascending:false})
    setTranslators(data||[]);setLoading(false)
  }

  const fetchFollowing=async()=>{
    const{data}=await supabase.from('follows').select('following_id').eq('follower_id',user.id)
    setFollowing((data||[]).map(f=>f.following_id))
  }

  const filtered=translators
    .filter(t=>!feed||following.includes(t.profiles?.id))
    .filter(t=>familyFilter==='all'||t.family===familyFilter)
    .filter(t=>t.name.toLowerCase().includes(search.toLowerCase())||(t.description||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{
      if(sort==='newest')return new Date(b.created_at)-new Date(a.created_at)
      if(sort==='top'){const avg=x=>x.ratings?.length?x.ratings.reduce((s,r)=>s+r.score,0)/x.ratings.length:0;return avg(b)-avg(a)}
      if(sort==='words')return Object.keys(b.words||{}).length-Object.keys(a.words||{}).length
      return 0
    })

  return(
    <div style={{position:'relative',zIndex:2,minHeight:'100vh',padding:'4.5rem 1.5rem 4rem',maxWidth:1040,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:'2rem',paddingTop:'1rem'}}>
        <h1 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'clamp(1.8rem,5vw,3rem)',letterSpacing:'.15em',margin:'0 0 .4rem',color:'#e8e0d4',textShadow:'0 0 40px rgba(201,168,76,0.35)'}}>Discover</h1>
        <p style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.3em',margin:0}}>COMMUNITY TRANSLATORS</p>
        <div style={{width:80,height:1,background:'linear-gradient(90deg,transparent,rgba(201,168,76,.5),transparent)',margin:'1rem auto 0'}}/>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
          style={{flex:1,minWidth:160,background:'rgba(5,4,16,0.9)',border:'1px solid rgba(70,58,130,0.5)',borderRadius:10,color:'#f0ead8',fontFamily:"'Crimson Pro',serif",fontSize:'1rem',padding:'9px 14px',outline:'none'}}/>
        <select value={sort} onChange={e=>setSort(e.target.value)}
          style={{background:'rgba(5,4,16,0.9)',border:'1px solid rgba(70,58,130,0.5)',borderRadius:10,color:'#7060a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem',padding:'9px 12px',outline:'none',cursor:'pointer'}}>
          <option value="newest">Newest</option>
          <option value="top">Top rated</option>
          <option value="words">Most words</option>
        </select>
        {user&&<button onClick={()=>setFeed(f=>!f)} style={{background:feed?'rgba(201,168,76,0.12)':'rgba(5,4,16,0.9)',border:feed?'1px solid rgba(201,168,76,0.4)':'1px solid rgba(70,58,130,0.5)',color:feed?'#c9a84c':'#5848a0',borderRadius:10,padding:'9px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem',cursor:'pointer',transition:'all .2s'}}>Following</button>}
        {user&&<button onClick={()=>setPage('create')} style={{background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.35)',color:'#c9a84c',borderRadius:10,padding:'9px 16px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem',cursor:'pointer'}}>+ Create</button>}
      </div>

      {/* Family filter pills */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:18}}>
        {FAMILIES.map(f=>(
          <button key={f} onClick={()=>setFamilyFilter(f)} style={{
            background:familyFilter===f?'rgba(120,100,200,0.18)':'transparent',
            border:familyFilter===f?'1px solid rgba(120,100,200,0.5)':'1px solid rgba(70,58,130,0.3)',
            color:familyFilter===f?'#a090d0':'#4838a0',borderRadius:7,padding:'4px 12px',
            fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',letterSpacing:'.08em',cursor:'pointer',transition:'all .2s',
          }}>{f}</button>
        ))}
      </div>

      {loading?(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
        {[...Array(6)].map((_,i)=><CardSkeleton key={i}/>)}
      </div>
      ):filtered.length===0?(
        <div style={{textAlign:'center',color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',marginTop:'4rem'}}>
          {feed?'No translators from people you follow':'No translators found'}
        </div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {filtered.map(t=>(
            <TranslatorCard key={t.id} t={t} onClick={()=>{setActiveTranslator(t);setPage('use')}} setPage={setPage} setViewProfile={setViewProfile}/>
          ))}
        </div>
      )}
    </div>
  )
}
