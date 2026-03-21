import { supabase } from '../supabase'

const ROLE_COLORS={owner:'#f0d47a',admin:'#e07070',moderator:'#9370db',trusted:'#38b2ac',regular:'#5848a0'}

export default function Navbar({user,userProfile,page,setPage,unreadCount=0}){
  const links=[
    {id:'marketplace',label:'Discover'},
    {id:'activity',label:'Feed'},
    {id:'chat',label:'Messages'},
    {id:'tongues',label:'Tongues'},
    {id:'create',label:'Create'},
  ]
  const isAdmin=['owner','admin','moderator'].includes(userProfile?.role)

  return(
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(5,4,16,0.92)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderBottom:'1px solid rgba(70,58,130,0.4)',padding:'0 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',height:56}}>
      <button onClick={()=>setPage('marketplace')} style={{background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:"'Cinzel Decorative',serif",fontSize:'1rem',letterSpacing:'.18em',background:'linear-gradient(110deg,#7a5a18 20%,#c9a84c 50%,#7a5a18 80%)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',backgroundClip:'text',WebkitTextFillColor:'transparent',animation:'shine 4s linear infinite'}}>TONGUES</button>

      <div style={{display:'flex',gap:4,alignItems:'center'}}>
        {links.map(l=>(
          <button key={l.id} onClick={()=>setPage(l.id)} style={{background:page===l.id?'rgba(201,168,76,0.1)':'transparent',border:page===l.id?'1px solid rgba(201,168,76,0.3)':'1px solid transparent',color:page===l.id?'#c9a84c':'#5848a0',borderRadius:8,padding:'5px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.12em',cursor:'pointer',transition:'all .2s'}}>{l.label}</button>
        ))}
        {isAdmin&&(
          <button onClick={()=>setPage('admin')} style={{background:page==='admin'?'rgba(224,112,112,0.12)':'transparent',border:page==='admin'?'1px solid rgba(224,112,112,0.4)':'1px solid rgba(224,112,112,0.2)',color:'#e07070',borderRadius:8,padding:'5px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.12em',cursor:'pointer',transition:'all .2s'}}>Admin</button>
        )}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:8}}>
        {user?(
          <>
            {userProfile?.verified&&<span style={{color:'#c9a84c',fontSize:'.85rem'}} title="Verified">✦</span>}
            {userProfile?.role&&!['regular'].includes(userProfile.role)&&(
              <span style={{color:ROLE_COLORS[userProfile.role],fontFamily:"'JetBrains Mono',monospace",fontSize:'.6rem',letterSpacing:'.1em',opacity:.8}}>{userProfile.role.toUpperCase()}</span>
            )}
            <button onClick={()=>setPage('notifs')} style={{position:'relative',background:page==='notifs'?'rgba(201,168,76,0.1)':'transparent',border:'1px solid rgba(70,58,130,0.3)',color:'#7060a0',borderRadius:8,padding:'5px 10px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',cursor:'pointer'}}>
              ⍟
              {unreadCount>0&&<span style={{position:'absolute',top:-4,right:-4,background:'#e07070',color:'white',borderRadius:10,fontSize:'.5rem',fontFamily:"'JetBrains Mono',monospace",padding:'1px 4px',minWidth:14,textAlign:'center'}}>{unreadCount>9?'9+':unreadCount}</span>}
            </button>
            <button onClick={()=>setPage('profile')} style={{background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.25)',color:'#c9a84c',borderRadius:8,padding:'5px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',cursor:'pointer'}}>Profile</button>
            <button onClick={()=>supabase.auth.signOut()} style={{background:'transparent',border:'1px solid rgba(70,58,130,0.4)',color:'#5848a0',borderRadius:8,padding:'5px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',cursor:'pointer'}}>Out</button>
          </>
        ):(
          <button onClick={()=>setPage('auth')} style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.35)',color:'#c9a84c',borderRadius:8,padding:'5px 14px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',cursor:'pointer'}}>Sign in</button>
        )}
      </div>
    </nav>
  )
}
