import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { PANEL, INPUT } from '../styles'
import { BadgeIcon, BadgeList, ROLE_BADGE_IDS } from '../components/Badges'
import { ProfileSkeleton, TranslatorRowSkeleton } from '../components/Skeleton'
import { toast } from '../components/Toast'

const EMOJIS=['◈','⬡','◉','⟁','✦','⌘','⍟','⎈','⌬','◬','⧖','⟐','⌖','⎊','⍣','◭','⊕','⋈','⌦','⟴']
const COLORS=['#c9a84c','#38b2ac','#9370db','#e07070','#5090e0','#60c080','#e08040','#c060a0','#50b8d0','#90a030']

function Avatar({profile,previewUrl,size=72}){
  const color=profile?.accent_color||'#c9a84c'
  const rgb=color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  const src=previewUrl||profile?.avatar_url
  if(src)return <img src={src} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:`2px solid rgba(${rgb},0.6)`,boxShadow:`0 0 20px rgba(${rgb},0.2)`,flexShrink:0}} alt=""/>
  return <div style={{width:size,height:size,borderRadius:'50%',flexShrink:0,background:`rgba(${rgb},0.15)`,border:`2px solid rgba(${rgb},0.6)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.42,boxShadow:`0 0 20px rgba(${rgb},0.2)`}}>{profile?.avatar_emoji||'◈'}</div>
}

export default function ProfilePage({user,setPage,setActiveTranslator,setEditTranslator}){
  const[profile,setProfile]=useState(null)
  const[translators,setTranslators]=useState([])
  const[followers,setFollowers]=useState(0)
  const[following,setFollowing]=useState(0)
  const[editing,setEditing]=useState(false)
  const[editBio,setEditBio]=useState('')
  const[editEmoji,setEditEmoji]=useState('◈')
  const[editColor,setEditColor]=useState('#c9a84c')
  const[previewUrl,setPreviewUrl]=useState(null)
  const[uploadFile,setUploadFile]=useState(null)
  const[saving,setSaving]=useState(false)
  const[loading,setLoading]=useState(true)
  const fileRef=useRef(null)

  useEffect(()=>{if(user)fetchAll()},[user])

  const fetchAll=async()=>{
    setLoading(true)
    const[{data:prof},{data:trans},{data:foll},{data:folling}]=await Promise.all([
      supabase.from('profiles').select('*').eq('id',user.id).single(),
      supabase.from('translators').select('*,ratings(score)').eq('user_id',user.id).order('created_at',{ascending:false}),
      supabase.from('follows').select('id',{count:'exact'}).eq('following_id',user.id),
      supabase.from('follows').select('id',{count:'exact'}).eq('follower_id',user.id),
    ])
    setProfile(prof);setTranslators(trans||[])
    setFollowers(foll?.length||0);setFollowing(folling?.length||0)
    if(prof){setEditBio(prof.bio||'');setEditEmoji(prof.avatar_emoji||'◈');setEditColor(prof.accent_color||'#c9a84c')}
    setLoading(false)
  }

  const handleFileChange=e=>{
    const file=e.target.files[0];if(!file)return
    setUploadFile(file);setPreviewUrl(URL.createObjectURL(file))
  }

  const saveProfile=async()=>{
    setSaving(true)
    let avatarUrl=profile?.avatar_url||null
    if(uploadFile){
      const ext=uploadFile.name.split('.').pop()
      const path=`${user.id}/avatar.${ext}`
      await supabase.storage.from('avatars').upload(path,uploadFile,{upsert:true})
      const{data}=supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl=data.publicUrl+'?t='+Date.now()
    }
    await supabase.from('profiles').update({bio:editBio.trim()||null,avatar_emoji:editEmoji,accent_color:editColor,avatar_url:avatarUrl}).eq('id',user.id)
    await fetchAll()
    setSaving(false);setEditing(false);setPreviewUrl(null);setUploadFile(null)
    toast('Profile saved!','success')
  }

  const deleteTranslator=async id=>{
    if(!confirm('Delete this translator?'))return
    await supabase.from('translators').delete().eq('id',id)
    setTranslators(t=>t.filter(x=>x.id!==id))
  }

  if(!user)return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{...PANEL,padding:'2.5rem',textAlign:'center',maxWidth:360}}>
        <p style={{color:'#7060a0',fontFamily:"'Crimson Pro',serif",fontSize:'1.1rem',margin:'0 0 1.5rem'}}>Sign in to view your profile</p>
        <button onClick={()=>setPage('auth')} style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.4)',color:'#c9a84c',borderRadius:10,padding:'10px 22px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',cursor:'pointer'}}>Sign in</button>
      </div>
    </div>
  )

  const accent=editing?editColor:(profile?.accent_color||'#c9a84c')
  const rgb=accent.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  const allBadges=[
    ...(ROLE_BADGE_IDS.includes(profile?.role)?[profile.role]:[]),
    ...(profile?.verified&&!ROLE_BADGE_IDS.includes('verified')?['verified']:[]),
    ...(profile?.verified?['verified']:[]),
    ...(profile?.badges||[]),
  ].filter((v,i,a)=>a.indexOf(v)===i) // dedupe

  return(
    <div style={{position:'relative',zIndex:2,minHeight:'100vh',padding:'4.5rem 1.5rem 4rem',maxWidth:780,margin:'0 auto'}}>

      {/* ── Profile card ── */}
      <div style={{...PANEL,padding:'2rem',marginBottom:16}}>
        <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>

          {/* Avatar */}
          <div style={{position:'relative',flexShrink:0}}>
            <Avatar profile={editing?{...profile,accent_color:editColor,avatar_emoji:editEmoji}:profile} previewUrl={editing?previewUrl:null} size={76}/>
            {editing&&(
              <button onClick={()=>fileRef.current?.click()} style={{position:'absolute',bottom:0,right:0,width:24,height:24,borderRadius:'50%',background:accent,border:'2px solid #06060f',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'.7rem',color:'#06060f',fontWeight:'bold'}}>+</button>
            )}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} style={{display:'none'}}/>
          </div>

          {/* Info */}
          <div style={{flex:1,minWidth:200}}>
            <h2 style={{margin:'0 0 4px',fontFamily:"'Cinzel Decorative',serif",fontSize:'1.3rem',color:'#e8e0d4',letterSpacing:'.08em'}}>{profile?.username}</h2>
            <div style={{display:'flex',gap:18,marginBottom:10,flexWrap:'wrap'}}>
              <span style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.12em'}}>{followers} FOLLOWERS</span>
              <span style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.12em'}}>{following} FOLLOWING</span>
              <span style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.12em'}}>{translators.length} TRANSLATORS</span>
            </div>
            {!editing&&<p style={{margin:'0 0 10px',color:'#7060a0',fontSize:'.95rem',lineHeight:1.5}}>{profile?.bio||<span style={{color:'#3a3060',fontStyle:'italic'}}>No bio yet</span>}</p>}

            {/* ── Badges ── */}
            {!editing&&allBadges.length>0&&(
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {allBadges.map(b=><BadgeIcon key={b} badge={b} size='sm'/>)}
              </div>
            )}
          </div>

          <button onClick={()=>setEditing(e=>!e)} style={{background:editing?`rgba(${rgb},0.1)`:'rgba(70,58,130,0.2)',border:editing?`1px solid rgba(${rgb},0.4)`:'1px solid rgba(70,58,130,0.4)',color:editing?accent:'#7060a0',borderRadius:8,padding:'6px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',cursor:'pointer',flexShrink:0}}>
            {editing?'Cancel':'Edit profile'}
          </button>
        </div>

        {/* ── Edit panel ── */}
        {editing&&(
          <div style={{marginTop:20,paddingTop:20,borderTop:'1px solid rgba(50,40,90,0.5)',animation:'fadeUp .3s ease'}}>
            <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:200}}>
                <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.22em',marginBottom:8}}>BIO</label>
                <textarea style={{...INPUT,minHeight:80,resize:'none',fontFamily:"'Crimson Pro',serif"}} value={editBio} onChange={e=>setEditBio(e.target.value)} placeholder="Tell people about your languages…"/>
                <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.22em',marginBottom:8,marginTop:14}}>PROFILE PHOTO</label>
                <button onClick={()=>fileRef.current?.click()} style={{background:'rgba(5,4,16,0.8)',border:'1px dashed rgba(70,58,130,0.5)',color:'#5848a0',borderRadius:10,padding:'10px 18px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',cursor:'pointer',width:'100%'}}>
                  {uploadFile?`✓ ${uploadFile.name}`:'Upload PNG / JPG'}
                </button>
              </div>
              <div>
                <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.22em',marginBottom:8}}>AVATAR SYMBOL</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,maxWidth:220,marginBottom:14}}>
                  {EMOJIS.map(e=>(
                    <button key={e} onClick={()=>setEditEmoji(e)} style={{width:34,height:34,borderRadius:7,fontSize:'1rem',cursor:'pointer',background:editEmoji===e?`rgba(${rgb},0.15)`:'rgba(5,4,16,0.6)',border:editEmoji===e?`1px solid ${accent}`:'1px solid rgba(50,40,90,0.4)'}}>{e}</button>
                  ))}
                </div>
                <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.22em',marginBottom:8}}>ACCENT COLOR</label>
                <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setEditColor(c)} style={{width:26,height:26,borderRadius:'50%',background:c,cursor:'pointer',outline:'none',border:editColor===c?'3px solid white':'3px solid transparent',boxShadow:editColor===c?`0 0 10px ${c}`:'none'}}/>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving} style={{marginTop:16,padding:'10px 24px',background:`rgba(${rgb},0.12)`,border:`1px solid rgba(${rgb},0.4)`,color:accent,borderRadius:10,fontFamily:"'JetBrains Mono',monospace",fontSize:'.78rem',letterSpacing:'.12em',cursor:'pointer',opacity:saving?.6:1}}>
              {saving?'Saving…':'Save changes'}
            </button>
          </div>
        )}
      </div>

      {/* ── Translators ── */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <span style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.22em'}}>YOUR TRANSLATORS</span>
        <button onClick={()=>setPage('create')} style={{background:`rgba(${rgb},0.08)`,border:`1px solid rgba(${rgb},0.3)`,color:accent,borderRadius:8,padding:'5px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',cursor:'pointer'}}>+ New</button>
      </div>

      {loading?<div style={{display:'flex',flexDirection:'column',gap:10}}>{[...Array(3)].map((_,i)=><TranslatorRowSkeleton key={i}/>)}</div>
      :translators.length===0?(
        <div style={{...PANEL,padding:'2.5rem',textAlign:'center'}}>
          <p style={{color:'#4a3a80',fontFamily:"'Crimson Pro',serif",margin:'0 0 1.2rem'}}>No translators yet</p>
          <button onClick={()=>setPage('create')} style={{background:`rgba(${rgb},0.12)`,border:`1px solid rgba(${rgb},0.4)`,color:accent,borderRadius:10,padding:'10px 22px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.78rem',cursor:'pointer'}}>Create your first</button>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {translators.map(t=>{
            const avg=t.ratings?.length?(t.ratings.reduce((s,r)=>s+r.score,0)/t.ratings.length).toFixed(1):null
            return(
              <div key={t.id} style={{...PANEL,padding:'1.1rem 1.4rem',display:'flex',alignItems:'center',gap:12}}>
                <div style={{flex:1,minWidth:0}}>
                  <h4 style={{margin:'0 0 3px',fontFamily:"'Cinzel Decorative',serif",fontSize:'.88rem',color:'#e8e0d4',letterSpacing:'.05em'}}>{t.name}</h4>
                  <div style={{display:'flex',gap:12}}>
                    <span style={{color:'#3a3070',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.1em'}}>{Object.keys(t.words||{}).length} WORDS</span>
                    {avg&&<span style={{color:'#c9a84c',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem'}}>★ {avg}</span>}
                  </div>
                </div>
                <div style={{display:'flex',gap:7,flexShrink:0}}>
                  <button onClick={()=>{setActiveTranslator(t);setPage('use')}} style={{background:`rgba(${rgb},0.08)`,border:`1px solid rgba(${rgb},0.25)`,color:accent,borderRadius:7,padding:'5px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.66rem',cursor:'pointer'}}>Use</button>
                  <button onClick={()=>{if(setEditTranslator){setEditTranslator(t);setPage('create')}}} style={{background:'rgba(70,58,130,0.1)',border:'1px solid rgba(70,58,130,0.3)',color:'#7060a0',borderRadius:7,padding:'5px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.66rem',cursor:'pointer'}}>Edit</button>
                  <button onClick={()=>deleteTranslator(t.id)} style={{background:'rgba(200,80,80,0.07)',border:'1px solid rgba(200,80,80,0.2)',color:'#b06060',borderRadius:7,padding:'5px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.66rem',cursor:'pointer'}}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
