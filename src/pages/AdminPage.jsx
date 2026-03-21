import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { PANEL, INPUT } from '../styles'
import { ALL_BADGES, BadgeIcon, BadgeList } from '../components/Badges'

const TABS = ['overview','users','translators','reports','announcements']

function StatCard({label,value,color='#c9a84c',sub}){
  const rgb=color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
  return(
    <div style={{...PANEL,padding:'1.4rem',textAlign:'center'}}>
      <div style={{color:`rgba(${rgb},0.6)`,fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',letterSpacing:'.2em',marginBottom:8}}>{label}</div>
      <div style={{color,fontFamily:"'Cinzel Decorative',serif",fontSize:'1.9rem'}}>{value?.toLocaleString?.()??value}</div>
      {sub&&<div style={{color:`rgba(${rgb},0.4)`,fontFamily:"'JetBrains Mono',monospace",fontSize:'.58rem',marginTop:4,letterSpacing:'.12em'}}>{sub}</div>}
    </div>
  )
}

// Inline editable field
function EditField({label,value,onSave,type='text',options}){
  const[editing,setEditing]=useState(false)
  const[val,setVal]=useState(value||'')
  const save=()=>{onSave(val);setEditing(false)}
  return(
    <div style={{marginBottom:12}}>
      <div style={{color:'#4838a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',letterSpacing:'.2em',marginBottom:5}}>{label}</div>
      {editing?(
        <div style={{display:'flex',gap:8}}>
          {options?(
            <select value={val} onChange={e=>setVal(e.target.value)} style={{flex:1,background:'rgba(5,4,16,0.8)',border:'1px solid rgba(70,58,130,0.5)',borderRadius:8,color:'#f0ead8',fontFamily:"'JetBrains Mono',monospace",fontSize:'.75rem',padding:'7px 10px',outline:'none'}}>
              {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ):(
            <input type={type} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&save()} style={{flex:1,...INPUT,fontSize:'.85rem',padding:'7px 12px'}}/>
          )}
          <button onClick={save} style={{background:'rgba(56,178,172,0.12)',border:'1px solid rgba(56,178,172,0.35)',color:'#38b2ac',borderRadius:8,padding:'7px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',cursor:'pointer'}}>Save</button>
          <button onClick={()=>setEditing(false)} style={{background:'transparent',border:'1px solid rgba(70,58,130,0.4)',color:'#5848a0',borderRadius:8,padding:'7px 10px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',cursor:'pointer'}}>✕</button>
        </div>
      ):(
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{color:'#c0b8d8',fontFamily:"'Crimson Pro',serif",fontSize:'.95rem'}}>{value||<span style={{color:'#3a3060',fontStyle:'italic'}}>empty</span>}</span>
          <button onClick={()=>setEditing(true)} style={{background:'none',border:'none',color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',cursor:'pointer',letterSpacing:'.1em',padding:'2px 6px',borderRadius:4,transition:'color .2s'}}
            onMouseEnter={e=>e.currentTarget.style.color='#7060a0'}
            onMouseLeave={e=>e.currentTarget.style.color='#3a3060'}>edit</button>
        </div>
      )}
    </div>
  )
}

export default function AdminPage({user,setPage}){
  const[profile,setProfile]=useState(null)
  const[tab,setTab]=useState('overview')
  const[stats,setStats]=useState({})
  const[reports,setReports]=useState([])
  const[users,setUsers]=useState([])
  const[translators,setTranslators]=useState([])
  const[announcements,setAnnouncements]=useState([])
  const[newAnnouncement,setNewAnnouncement]=useState('')
  const[announcementColor,setAnnouncementColor]=useState('#c9a84c')
  const[userSearch,setUserSearch]=useState('')
  const[selectedUser,setSelectedUser]=useState(null)
  const[loading,setLoading]=useState(true)
  const[saving,setSaving]=useState(false)

  useEffect(()=>{if(user)checkAdmin()},[user])
  useEffect(()=>{if(['owner','admin','moderator'].includes(profile?.role))fetchTab()},[tab,profile])

  const checkAdmin=async()=>{
    const{data}=await supabase.from('profiles').select('*').eq('id',user.id).single()
    setProfile(data);setLoading(false)
  }

  const fetchTab=async()=>{
    if(tab==='overview'){
      const[{count:uc},{count:tc},{count:cc},{count:rc},{count:rpc}]=await Promise.all([
        supabase.from('profiles').select('*',{count:'exact',head:true}),
        supabase.from('translators').select('*',{count:'exact',head:true}),
        supabase.from('comments').select('*',{count:'exact',head:true}),
        supabase.from('ratings').select('*',{count:'exact',head:true}),
        supabase.from('reports').select('*',{count:'exact',head:true}).eq('status','pending'),
      ])
      const{data:words}=await supabase.from('translators').select('words')
      const totalWords=(words||[]).reduce((s,t)=>s+Object.keys(t.words||{}).length,0)
      const{data:recent}=await supabase.from('profiles').select('id').gte('created_at',new Date(Date.now()-86400000*7).toISOString())
      setStats({users:uc,translators:tc,comments:cc,ratings:rc,words:totalWords,pendingReports:rpc,newThisWeek:recent?.length||0})
    }
    if(tab==='reports'){
      const{data}=await supabase.from('reports').select('*,reporter:reporter_id(username)').order('created_at',{ascending:false})
      setReports(data||[])
    }
    if(tab==='users'){
      const{data}=await supabase.from('profiles').select('*').order('created_at',{ascending:false})
      setUsers(data||[])
    }
    if(tab==='translators'){
      const{data}=await supabase.from('translators').select('*,profiles(username,accent_color)').order('created_at',{ascending:false})
      setTranslators(data||[])
    }
    if(tab==='announcements'){
      const{data}=await supabase.from('announcements').select('*').order('created_at',{ascending:false})
      setAnnouncements(data||[])
    }
  }

  const updateUser=async(uid,updates)=>{
    await supabase.from('profiles').update(updates).eq('id',uid)
    fetchTab()
    if(selectedUser?.id===uid) setSelectedUser(u=>({...u,...updates}))
  }

  const toggleBadge=async(uid,badgeId,currentBadges)=>{
    const badges=currentBadges||[]
    const next=badges.includes(badgeId)?badges.filter(b=>b!==badgeId):[...badges,badgeId]
    await updateUser(uid,{badges:next})
  }

  const banUser=async(uid,hours)=>{
    const reason=prompt('Ban reason:');if(!reason)return
    const until=new Date(Date.now()+hours*3600000).toISOString()
    await updateUser(uid,{banned_until:until,ban_reason:reason})
  }

  const unbanUser=uid=>updateUser(uid,{banned_until:null,ban_reason:null})
  const deleteTranslator=async id=>{if(!confirm('Delete permanently?'))return;await supabase.from('translators').delete().eq('id',id);fetchTab()}
  const resolveReport=async(id,status)=>{await supabase.from('reports').update({status}).eq('id',id);fetchTab()}
  const deleteReportTarget=async r=>{
    if(!confirm('Delete this content?'))return
    if(r.type==='translator')await supabase.from('translators').delete().eq('id',r.target_id)
    if(r.type==='comment')await supabase.from('comments').delete().eq('id',r.target_id)
    await supabase.from('reports').update({status:'resolved'}).eq('id',r.id);fetchTab()
  }
  const postAnnouncement=async()=>{
    if(!newAnnouncement.trim())return;setSaving(true)
    await supabase.from('announcements').insert({content:newAnnouncement.trim(),color:announcementColor,active:true})
    setNewAnnouncement('');await fetchTab();setSaving(false)
  }
  const toggleAnnouncement=async(id,active)=>{await supabase.from('announcements').update({active:!active}).eq('id',id);fetchTab()}
  const deleteAnnouncement=async id=>{await supabase.from('announcements').delete().eq('id',id);fetchTab()}

  if(loading)return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}><div style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',animation:'pulse 1.5s ease infinite'}}>loading…</div></div>
  if(!profile||!['owner','admin','moderator'].includes(profile.role))return(
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{...PANEL,padding:'2.5rem',textAlign:'center',maxWidth:380}}>
        <p style={{color:'#e07070',fontFamily:"'Cinzel Decorative',serif",fontSize:'1.1rem',margin:'0 0 .5rem',letterSpacing:'.1em'}}>Access Denied</p>
        <p style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.72rem',margin:'0 0 1.5rem'}}>ADMINS ONLY</p>
        <button onClick={()=>setPage('marketplace')} style={{background:'transparent',border:'1px solid rgba(70,58,130,0.5)',color:'#5848a0',borderRadius:10,padding:'10px 22px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.78rem',cursor:'pointer'}}>Go back</button>
      </div>
    </div>
  )

  const filteredUsers=users.filter(u=>!userSearch||(u.username||'').toLowerCase().includes(userSearch.toLowerCase()))
  const ACOLORS=['#c9a84c','#e07070','#38b2ac','#9370db','#5090e0']
  const ROLE_OPTS=[{value:'regular',label:'Regular'},{value:'trusted',label:'Trusted'},{value:'moderator',label:'Moderator'},{value:'admin',label:'Admin'},{value:'owner',label:'Owner'}].filter(r=>profile.role==='owner'||r.value!=='owner')
  const VIS_OPTS=[{value:'public',label:'Public'},{value:'unlisted',label:'Unlisted'},{value:'private',label:'Private'}]

  return(
    <div style={{position:'relative',zIndex:2,minHeight:'100vh',padding:'4.5rem 1.5rem 4rem',maxWidth:1200,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:'2rem',flexWrap:'wrap'}}>
        <h1 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'clamp(1.4rem,3.5vw,2rem)',letterSpacing:'.12em',color:'#e8e0d4',margin:0,textShadow:'0 0 30px rgba(224,112,112,0.3)'}}>Admin Panel</h1>
        <BadgeIcon badge={profile.role==='owner'?'owner':profile.role} size="md"/>
        {stats.pendingReports>0&&<span style={{background:'rgba(224,112,112,0.15)',border:'1px solid rgba(224,112,112,0.4)',color:'#e07070',borderRadius:20,padding:'3px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',letterSpacing:'.1em'}}>{stats.pendingReports} PENDING REPORTS</span>}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:20,flexWrap:'wrap'}}>
        {TABS.filter(t=>['owner','admin'].includes(profile.role)||t!=='announcements').map(t=>(
          <button key={t} onClick={()=>{setTab(t);setSelectedUser(null)}} style={{background:tab===t?'rgba(224,112,112,0.1)':'transparent',border:tab===t?'1px solid rgba(224,112,112,0.35)':'1px solid rgba(70,58,130,0.4)',color:tab===t?'#e07070':'#5848a0',borderRadius:8,padding:'7px 16px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.1em',cursor:'pointer',transition:'all .2s',textTransform:'uppercase'}}>{t}</button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab==='overview'&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
          <StatCard label="TOTAL USERS" value={stats.users||0} color="#c9a84c" sub={`+${stats.newThisWeek||0} THIS WEEK`}/>
          <StatCard label="TRANSLATORS" value={stats.translators||0} color="#38b2ac"/>
          <StatCard label="TOTAL WORDS" value={stats.words||0} color="#9370db"/>
          <StatCard label="COMMENTS" value={stats.comments||0} color="#5090e0"/>
          <StatCard label="RATINGS" value={stats.ratings||0} color="#e08040"/>
          <StatCard label="PENDING REPORTS" value={stats.pendingReports||0} color="#e07070"/>
        </div>
      )}

      {/* USERS — split view */}
      {tab==='users'&&(
        <div style={{display:'grid',gridTemplateColumns:selectedUser?'1fr 380px':'1fr',gap:14}}>
          {/* User list */}
          <div>
            <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search users…" style={{...INPUT,marginBottom:12,maxWidth:360}}/>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {filteredUsers.map(u=>{
                const isBanned=u.banned_until&&new Date(u.banned_until)>new Date()
                const isSelected=selectedUser?.id===u.id
                return(
                  <button key={u.id} onClick={()=>setSelectedUser(isSelected?null:u)} style={{
                    ...PANEL,padding:'1rem 1.2rem',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',
                    cursor:'pointer',textAlign:'left',width:'100%',
                    borderColor:isSelected?'rgba(224,112,112,0.5)':isBanned?'rgba(224,112,112,0.25)':'rgba(70,58,130,0.7)',
                    borderLeft:isBanned?'3px solid rgba(224,112,112,0.5)':'3px solid transparent',
                    transition:'all .15s',
                  }}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}}>
                        <span style={{color:isSelected?'#e07070':'#c0b8d8',fontFamily:"'JetBrains Mono',monospace",fontSize:'.78rem'}}>{u.username||'(no username)'}</span>
                        {u.role&&u.role!=='regular'&&<BadgeIcon badge={u.role} size="sm"/>}
                        {u.verified&&<BadgeIcon badge="verified" size="sm"/>}
                        {(u.badges||[]).map(b=><BadgeIcon key={b} badge={b} size="sm"/>)}
                        {isBanned&&<span style={{color:'#e07070',fontFamily:"'JetBrains Mono',monospace",fontSize:'.58rem',letterSpacing:'.08em'}}>BANNED</span>}
                      </div>
                      <span style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem'}}>joined {new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                    <span style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',flexShrink:0}}>{isSelected?'▾':'▸'}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* User editor panel */}
          {selectedUser&&(
            <div style={{...PANEL,padding:'1.6rem',height:'fit-content',position:'sticky',top:70,animation:'fadeUp .25s ease'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                <h3 style={{margin:0,fontFamily:"'Cinzel Decorative',serif",fontSize:'.9rem',color:'#e8e0d4',letterSpacing:'.08em'}}>{selectedUser.username}</h3>
                <button onClick={()=>setSelectedUser(null)} style={{background:'none',border:'none',color:'#3a3060',cursor:'pointer',fontSize:'1rem',padding:0}}>✕</button>
              </div>

              <EditField label="USERNAME" value={selectedUser.username} onSave={v=>updateUser(selectedUser.id,{username:v})}/>
              <EditField label="BIO" value={selectedUser.bio} onSave={v=>updateUser(selectedUser.id,{bio:v})}/>
              <EditField label="ROLE" value={selectedUser.role||'regular'} options={ROLE_OPTS} onSave={v=>updateUser(selectedUser.id,{role:v})}/>

              {/* Verified toggle */}
              <div style={{marginBottom:14}}>
                <div style={{color:'#4838a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',letterSpacing:'.2em',marginBottom:6}}>VERIFIED</div>
                <button onClick={()=>updateUser(selectedUser.id,{verified:!selectedUser.verified})} style={{background:selectedUser.verified?'rgba(201,168,76,0.12)':'rgba(5,4,16,0.6)',border:selectedUser.verified?'1px solid rgba(201,168,76,0.4)':'1px solid rgba(70,58,130,0.4)',color:selectedUser.verified?'#c9a84c':'#5848a0',borderRadius:8,padding:'6px 16px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',cursor:'pointer'}}>
                  {selectedUser.verified?'✦ Verified — click to remove':'Not verified — click to verify'}
                </button>
              </div>

              {/* Badge editor */}
              <div style={{marginBottom:14}}>
                <div style={{color:'#4838a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',letterSpacing:'.2em',marginBottom:8}}>BADGES</div>
                <div style={{display:'flex',flexDirection:'column',gap:5,maxHeight:260,overflowY:'auto',paddingRight:2}}>
                  {ALL_BADGES.filter(b=>!['owner','admin','moderator','trusted','regular'].includes(b.id)).map(b=>{
                    const has=(selectedUser.badges||[]).includes(b.id)
                    const rgb=b.color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
                    return(
                      <button key={b.id} onClick={()=>{
                        const next=(selectedUser.badges||[]).includes(b.id)?(selectedUser.badges||[]).filter(x=>x!==b.id):[...(selectedUser.badges||[]),b.id]
                        setSelectedUser(u=>({...u,badges:next}))
                        toggleBadge(selectedUser.id,b.id,selectedUser.badges)
                      }} style={{
                        display:'flex',alignItems:'center',gap:10,padding:'7px 10px',borderRadius:8,cursor:'pointer',textAlign:'left',
                        background:has?`rgba(${rgb},0.12)`:'rgba(5,4,16,0.5)',
                        border:has?`1px solid rgba(${rgb},0.4)`:'1px solid rgba(50,40,90,0.5)',
                        transition:'all .15s',
                      }}>
                        <span style={{fontSize:'.9rem'}}>{b.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{color:has?b.color:'#7060a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem'}}>{b.label}</div>
                          <div style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.58rem'}}>{b.description}</div>
                        </div>
                        {has&&<span style={{color:b.color,fontSize:'.75rem'}}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Ban section */}
              <div style={{borderTop:'1px solid rgba(50,40,90,0.5)',paddingTop:14}}>
                <div style={{color:'#4838a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',letterSpacing:'.2em',marginBottom:8}}>BAN / SUSPEND</div>
                {selectedUser.banned_until&&new Date(selectedUser.banned_until)>new Date()?(
                  <div>
                    <p style={{color:'#e07070',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',margin:'0 0 6px'}}>Banned until {new Date(selectedUser.banned_until).toLocaleDateString()}</p>
                    {selectedUser.ban_reason&&<p style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem',margin:'0 0 8px'}}>Reason: {selectedUser.ban_reason}</p>}
                    <button onClick={()=>{unbanUser(selectedUser.id);setSelectedUser(u=>({...u,banned_until:null,ban_reason:null}))}} style={{background:'rgba(56,178,172,0.1)',border:'1px solid rgba(56,178,172,0.35)',color:'#38b2ac',borderRadius:8,padding:'6px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',cursor:'pointer'}}>Unban</button>
                  </div>
                ):(
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {[[1,'1h'],[24,'24h'],[24*7,'7d'],[24*30,'30d'],[24*365*10,'Perm']].map(([h,label])=>(
                      <button key={label} onClick={()=>{banUser(selectedUser.id,h);}} style={{background:'rgba(224,112,112,0.08)',border:'1px solid rgba(224,112,112,0.25)',color:'#e07070',borderRadius:7,padding:'5px 10px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer'}}>{label}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TRANSLATORS */}
      {tab==='translators'&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {translators.map(t=>(
            <div key={t.id} style={{...PANEL,padding:'1.1rem 1.4rem',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:200}}>
                <h4 style={{margin:'0 0 3px',fontFamily:"'Cinzel Decorative',serif",fontSize:'.85rem',color:'#e8e0d4',letterSpacing:'.05em'}}>{t.name}</h4>
                <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                  <span style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.1em'}}>{Object.keys(t.words||{}).length} WORDS</span>
                  <span style={{color:'#4838a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem'}}>by {t.profiles?.username||'unknown'}</span>
                  <span style={{color:t.visibility==='public'?'#38b2ac':t.visibility==='unlisted'?'#c9a84c':'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.08em'}}>{t.visibility||'public'}</span>
                  {t.family&&<span style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem'}}>{t.family}</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0,flexWrap:'wrap'}}>
                <select value={t.visibility||'public'} onChange={e=>supabase.from('translators').update({visibility:e.target.value}).eq('id',t.id).then(fetchTab)}
                  style={{background:'rgba(5,4,16,0.8)',border:'1px solid rgba(70,58,130,0.5)',borderRadius:7,color:'#7060a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',padding:'5px 8px',outline:'none',cursor:'pointer'}}>
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
                <button onClick={()=>deleteTranslator(t.id)} style={{background:'rgba(224,112,112,0.08)',border:'1px solid rgba(224,112,112,0.25)',color:'#e07070',borderRadius:7,padding:'5px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer'}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REPORTS */}
      {tab==='reports'&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {reports.length===0&&<div style={{...PANEL,padding:'2rem',textAlign:'center'}}><p style={{color:'#4a3a80',fontFamily:"'Crimson Pro',serif",margin:0}}>No reports</p></div>}
          {reports.map(r=>(
            <div key={r.id} style={{...PANEL,padding:'1.3rem',borderLeft:r.status==='pending'?'3px solid rgba(224,112,112,0.6)':r.status==='resolved'?'3px solid rgba(56,178,172,0.5)':'3px solid rgba(70,58,130,0.3)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
                <div>
                  <div style={{display:'flex',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                    <span style={{background:'rgba(224,112,112,0.12)',border:'1px solid rgba(224,112,112,0.3)',color:'#e07070',borderRadius:5,padding:'2px 8px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',letterSpacing:'.1em'}}>{r.type}</span>
                    <span style={{color:r.status==='pending'?'#e07070':r.status==='resolved'?'#38b2ac':'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',letterSpacing:'.1em'}}>{r.status}</span>
                  </div>
                  <p style={{margin:'0 0 4px',color:'#c0b8d8',fontFamily:"'Crimson Pro',serif",fontSize:'.95rem'}}>{r.reason}</p>
                  <p style={{margin:'0 0 2px',color:'#4a3a70',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem'}}>by {r.reporter?.username||'unknown'} · {new Date(r.created_at).toLocaleDateString()}</p>
                  <p style={{margin:0,color:'#2a2040',fontFamily:"'JetBrains Mono',monospace",fontSize:'.58rem',letterSpacing:'.06em'}}>ID: {r.target_id}</p>
                </div>
                {r.status==='pending'&&(
                  <div style={{display:'flex',gap:7,flexWrap:'wrap',flexShrink:0}}>
                    <button onClick={()=>deleteReportTarget(r)} style={{background:'rgba(224,112,112,0.1)',border:'1px solid rgba(224,112,112,0.35)',color:'#e07070',borderRadius:8,padding:'6px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer'}}>Delete content</button>
                    <button onClick={()=>resolveReport(r.id,'resolved')} style={{background:'rgba(56,178,172,0.1)',border:'1px solid rgba(56,178,172,0.35)',color:'#38b2ac',borderRadius:8,padding:'6px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer'}}>Resolve</button>
                    <button onClick={()=>resolveReport(r.id,'dismissed')} style={{background:'transparent',border:'1px solid rgba(70,58,130,0.4)',color:'#5848a0',borderRadius:8,padding:'6px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer'}}>Dismiss</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {tab==='announcements'&&['owner','admin'].includes(profile.role)&&(
        <div>
          <div style={{...PANEL,padding:'1.8rem',marginBottom:14}}>
            <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.22em',marginBottom:8}}>NEW ANNOUNCEMENT</label>
            <textarea style={{...INPUT,minHeight:80,resize:'none',fontFamily:"'Crimson Pro',serif",marginBottom:12}} placeholder="Write an announcement…" value={newAnnouncement} onChange={e=>setNewAnnouncement(e.target.value)}/>
            <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
              <label style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.63rem',letterSpacing:'.18em'}}>COLOR</label>
              <div style={{display:'flex',gap:6}}>
                {ACOLORS.map(c=>(
                  <button key={c} onClick={()=>setAnnouncementColor(c)} style={{width:24,height:24,borderRadius:'50%',background:c,cursor:'pointer',outline:'none',border:announcementColor===c?'3px solid white':'3px solid transparent',boxShadow:announcementColor===c?`0 0 8px ${c}`:'none'}}/>
                ))}
              </div>
              <button onClick={postAnnouncement} disabled={saving||!newAnnouncement.trim()} style={{marginLeft:'auto',background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.4)',color:'#c9a84c',borderRadius:10,padding:'9px 20px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.75rem',cursor:'pointer',opacity:(saving||!newAnnouncement.trim())?.5:1}}>Post</button>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {announcements.map(a=>{
              const rgb=a.color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
              return(
                <div key={a.id} style={{...PANEL,padding:'1.1rem 1.4rem',borderLeft:`3px solid rgba(${rgb},${a.active?.7:.2})`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                    <div>
                      <p style={{margin:'0 0 3px',color:a.active?'#e8e0d4':'#5848a0',fontFamily:"'Crimson Pro',serif",fontSize:'.95rem'}}>{a.content}</p>
                      <span style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem'}}>{new Date(a.created_at).toLocaleDateString()} · {a.active?'ACTIVE':'INACTIVE'}</span>
                    </div>
                    <div style={{display:'flex',gap:7,flexShrink:0}}>
                      <button onClick={()=>toggleAnnouncement(a.id,a.active)} style={{background:a.active?'rgba(56,178,172,0.1)':'rgba(201,168,76,0.1)',border:a.active?'1px solid rgba(56,178,172,0.35)':'1px solid rgba(201,168,76,0.35)',color:a.active?'#38b2ac':'#c9a84c',borderRadius:8,padding:'5px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer'}}>{a.active?'Deactivate':'Activate'}</button>
                      <button onClick={()=>deleteAnnouncement(a.id)} style={{background:'rgba(224,112,112,0.08)',border:'1px solid rgba(224,112,112,0.25)',color:'#e07070',borderRadius:8,padding:'5px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',cursor:'pointer'}}>Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
