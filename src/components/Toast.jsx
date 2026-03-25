import { useState, useEffect, useCallback } from 'react'

let toastFn = null
export const toast = (msg, type='success', duration=2800) => { if(toastFn) toastFn(msg, type, duration) }

const COLORS = { success:'#38b2ac', error:'#e07070', info:'#c9a84c', warning:'#e08040' }
const ICONS  = { success:'✓', error:'✕', info:'◈', warning:'⚠' }

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    toastFn = (msg, type, duration) => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration)
    }
    return () => { toastFn = null }
  }, [])

  if (!toasts.length) return null
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:999, display:'flex', flexDirection:'column', gap:8 }}>
      {toasts.map(t => {
        const color = COLORS[t.type] || COLORS.success
        const rgb = color.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')
        return (
          <div key={t.id} style={{
            background:'rgba(5,4,16,0.97)', border:`1px solid rgba(${rgb},0.5)`,
            borderRadius:10, padding:'10px 16px',
            display:'flex', alignItems:'center', gap:10,
            boxShadow:`0 4px 24px rgba(0,0,0,0.6), 0 0 12px rgba(${rgb},0.15)`,
            animation:'fadeUp .25s ease',
            fontFamily:"'JetBrains Mono',monospace", fontSize:'.78rem',
            minWidth:200, maxWidth:320,
          }}>
            <span style={{ color, fontSize:'1rem', flexShrink:0 }}>{ICONS[t.type]}</span>
            <span style={{ color:'#e8e0d4' }}>{t.msg}</span>
          </div>
        )
      })}
    </div>
  )
}
