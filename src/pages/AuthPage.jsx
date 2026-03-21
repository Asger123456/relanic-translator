import { useState } from 'react'
import { supabase } from '../supabase'
import { PANEL, INPUT } from '../styles'

const EMOJIS = ['◈','⬡','◉','⟁','✦','⌘','⍟','⎈','⌬','◬','⧖','⟐','⌖','⎊','⍣','◭','⊕','⋈','⌦','⟴']
const COLORS = ['#c9a84c','#38b2ac','#9370db','#e07070','#5090e0','#60c080','#e08040','#c060a0','#50b8d0','#90a030']

export default function AuthPage({ setPage }) {
  const [mode, setMode] = useState('signin')
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [emoji, setEmoji] = useState('◈')
  const [accent, setAccent] = useState('#c9a84c')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authUser, setAuthUser] = useState(null)

  const handleCreds = async () => {
    setError(''); setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error: e } = await supabase.auth.signUp({ email, password })
        if (e) throw e
        if (!data?.user) throw new Error('Signup failed — try again')
        // sign in immediately so we have a valid session before inserting profile
        const { data: signInData, error: siErr } = await supabase.auth.signInWithPassword({ email, password })
        if (siErr) throw siErr
        setAuthUser(signInData.user)
        setStep(2)
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password })
        if (e) throw e
        setPage('marketplace')
      }
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const handleOnboard = async () => {
    if (!username.trim()) return setError('Choose a username')
    setLoading(true); setError('')
    try {
      const user = authUser || (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not logged in')
      const { error: e } = await supabase.from('profiles').insert({
        id: user.id,
        username: username.trim(),
        bio: bio.trim() || null,
        avatar_emoji: emoji,
        accent_color: accent,
      })
      if (e) throw e
      setPage('marketplace')
    } catch(e) { setError(e.message) }
    setLoading(false)
  }

  const rgb = (hex) => hex.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')

  if (step === 2) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'2rem'}}>
      <div style={{...PANEL,width:'100%',maxWidth:480,padding:'2.5rem',animation:'fadeUp .4s ease'}}>
        <h2 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'1.3rem',color:'#e8e0d4',margin:'0 0 .3rem',letterSpacing:'.1em'}}>Make it yours</h2>
        <p style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.2em',margin:'0 0 2rem'}}>CUSTOMIZE YOUR PROFILE</p>

        <div style={{display:'flex',justifyContent:'center',marginBottom:'1.8rem'}}>
          <div style={{
            width:80,height:80,borderRadius:'50%',
            background:`rgba(${rgb(accent)},0.15)`,border:`2px solid ${accent}`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'2rem',transition:'all .3s',
          }}>{emoji}</div>
        </div>

        <div style={{marginBottom:'1.5rem'}}>
          <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',letterSpacing:'.22em',marginBottom:8}}>AVATAR</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {EMOJIS.map(e=>(
              <button key={e} onClick={()=>setEmoji(e)} style={{
                width:38,height:38,borderRadius:8,fontSize:'1.1rem',cursor:'pointer',
                background:emoji===e?`rgba(${rgb(accent)},0.15)`:'rgba(5,4,16,0.6)',
                border:emoji===e?`1px solid ${accent}`:'1px solid rgba(50,40,90,0.5)',
                transition:'all .15s',
              }}>{e}</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:'1.5rem'}}>
          <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.65rem',letterSpacing:'.22em',marginBottom:8}}>ACCENT COLOR</label>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {COLORS.map(c=>(
              <button key={c} onClick={()=>setAccent(c)} style={{
                width:30,height:30,borderRadius:'50%',background:c,cursor:'pointer',
                border:accent===c?'3px solid white':'3px solid transparent',
                boxShadow:accent===c?`0 0 12px ${c}`:'none',
                transition:'all .15s',outline:'none',
              }}/>
            ))}
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <input style={INPUT} placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)}/>
          <textarea style={{...INPUT,minHeight:80,resize:'none',fontFamily:"'Crimson Pro',serif"}}
            placeholder="Bio (optional)" value={bio} onChange={e=>setBio(e.target.value)}/>
        </div>

        {error&&<p style={{color:'#e07070',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem',marginTop:10}}>{error}</p>}

        <button onClick={handleOnboard} disabled={loading} style={{
          width:'100%',marginTop:20,padding:'12px',
          background:`rgba(${rgb(accent)},0.15)`,
          border:`1px solid rgba(${rgb(accent)},0.5)`,
          color:accent,borderRadius:10,
          fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',letterSpacing:'.15em',
          cursor:'pointer',opacity:loading?.6:1,transition:'all .2s',
        }}>{loading?'saving…':'Enter Tongues →'}</button>
      </div>
    </div>
  )

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:'2rem'}}>
      <div style={{...PANEL,width:'100%',maxWidth:400,padding:'2.5rem',animation:'fadeUp .4s ease'}}>
        <h2 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'1.3rem',color:'#c9a84c',margin:'0 0 .3rem',letterSpacing:'.1em'}}>
          {mode==='signin'?'Welcome back':'Join Tongues'}
        </h2>
        <p style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.2em',margin:'0 0 2rem'}}>
          {mode==='signin'?'SIGN IN':'CREATE ACCOUNT'}
        </p>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <input style={INPUT} placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
          <input style={INPUT} placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleCreds()}/>
        </div>
        {error&&<p style={{color:'#e07070',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem',marginTop:10}}>{error}</p>}
        <button onClick={handleCreds} disabled={loading} style={{
          width:'100%',marginTop:18,padding:'12px',
          background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.4)',
          color:'#c9a84c',borderRadius:10,fontFamily:"'JetBrains Mono',monospace",
          fontSize:'.8rem',letterSpacing:'.15em',cursor:'pointer',opacity:loading?.6:1,
        }}>{loading?'loading…':mode==='signin'?'Sign in':'Continue →'}</button>
        <p style={{textAlign:'center',marginTop:16,color:'#4838a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem'}}>
          {mode==='signin'?"No account? ":"Have one? "}
          <button onClick={()=>{setMode(mode==='signin'?'signup':'signin');setError('')}}
            style={{background:'none',border:'none',color:'#c9a84c',cursor:'pointer',fontFamily:'inherit',fontSize:'inherit'}}>
            {mode==='signin'?'Sign up':'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
