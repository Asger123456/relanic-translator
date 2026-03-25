import { useState } from 'react'
import { supabase } from '../supabase'

export default function MobileNav({ user, userProfile, page, setPage, unreadCount }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const mainLinks = [
    { id:'marketplace', icon:'◈', label:'Discover' },
    { id:'activity',    icon:'⬡', label:'Feed' },
    { id:'chat',        icon:'✉', label:'Messages' },
    { id:'notifs',      icon:'⍟', label:'Alerts', badge: unreadCount },
    { id:'profile',     icon:'◉', label:'Profile' },
  ]

  const menuLinks = [
    { id:'create',   label:'+ Create' },
    { id:'tongues',  label:'Tongues' },
    ...(['owner','admin','moderator'].includes(userProfile?.role) ? [{ id:'admin', label:'Admin' }] : []),
  ]

  return (
    <>
      {/* Bottom tab bar */}
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:100,
        background:'rgba(5,4,16,0.97)', backdropFilter:'blur(20px)',
        borderTop:'1px solid rgba(70,58,130,0.4)',
        display:'flex', alignItems:'stretch',
        height:60, paddingBottom:'env(safe-area-inset-bottom)',
      }}>
        {mainLinks.map(l => (
          <button key={l.id} onClick={() => { setPage(l.id); setMenuOpen(false) }} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            gap:3, background:'none', border:'none', cursor:'pointer',
            color: page===l.id ? '#c9a84c' : '#4838a0',
            transition:'color .15s', position:'relative',
          }}>
            <span style={{ fontSize:'1.1rem', lineHeight:1 }}>{l.icon}</span>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'.52rem', letterSpacing:'.08em' }}>{l.label}</span>
            {l.badge>0 && (
              <span style={{ position:'absolute', top:6, right:'50%', marginRight:-18, background:'#e07070', color:'white', borderRadius:10, fontSize:'.5rem', fontFamily:"'JetBrains Mono',monospace", padding:'1px 5px', minWidth:16, textAlign:'center' }}>{l.badge>9?'9+':l.badge}</span>
            )}
            {page===l.id && <div style={{ position:'absolute', top:0, left:'50%', marginLeft:-12, width:24, height:2, background:'#c9a84c', borderRadius:1 }}/>}
          </button>
        ))}
        {/* More menu */}
        <button onClick={() => setMenuOpen(o => !o)} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:3, background:'none', border:'none', cursor:'pointer',
          color: menuOpen ? '#c9a84c' : '#4838a0', transition:'color .15s',
        }}>
          <span style={{ fontSize:'1.1rem', lineHeight:1 }}>⌘</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'.52rem', letterSpacing:'.08em' }}>More</span>
        </button>
      </nav>

      {/* Slide-up menu */}
      {menuOpen && (
        <div style={{
          position:'fixed', bottom:60, left:0, right:0, zIndex:99,
          background:'rgba(5,4,16,0.98)', borderTop:'1px solid rgba(70,58,130,0.4)',
          animation:'fadeUp .2s ease', padding:'1rem',
        }}>
          {menuLinks.map(l => (
            <button key={l.id} onClick={() => { setPage(l.id); setMenuOpen(false) }} style={{
              display:'block', width:'100%', textAlign:'left',
              background: page===l.id ? 'rgba(201,168,76,0.1)' : 'transparent',
              border:'none', borderRadius:10, padding:'12px 16px', marginBottom:4,
              color: page===l.id ? '#c9a84c' : '#7060a0',
              fontFamily:"'JetBrains Mono',monospace", fontSize:'.8rem', letterSpacing:'.12em',
              cursor:'pointer', transition:'all .15s',
            }}>{l.label}</button>
          ))}
          <div style={{ height:1, background:'rgba(70,58,130,0.3)', margin:'8px 0' }}/>
          {user ? (
            <button onClick={() => { supabase.auth.signOut(); setMenuOpen(false) }} style={{
              display:'block', width:'100%', textAlign:'left', background:'transparent',
              border:'none', borderRadius:10, padding:'12px 16px',
              color:'#5848a0', fontFamily:"'JetBrains Mono',monospace", fontSize:'.8rem',
              letterSpacing:'.12em', cursor:'pointer',
            }}>Sign out</button>
          ) : (
            <button onClick={() => { setPage('auth'); setMenuOpen(false) }} style={{
              display:'block', width:'100%', textAlign:'left',
              background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)',
              borderRadius:10, padding:'12px 16px',
              color:'#c9a84c', fontFamily:"'JetBrains Mono',monospace", fontSize:'.8rem',
              letterSpacing:'.12em', cursor:'pointer',
            }}>Sign in</button>
          )}
        </div>
      )}
    </>
  )
}
