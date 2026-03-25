export const PANEL = {
  background: 'rgba(5,4,16,0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(70,58,130,0.7)',
  borderRadius: 16,
  boxShadow: '0 12px 48px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)',
}
export const BTN = (color='#c9a84c') => ({
  background: `rgba(${hexToRgb(color)},0.12)`,
  border: `1px solid rgba(${hexToRgb(color)},0.4)`,
  color, borderRadius: 10, padding: '10px 22px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '.8rem', letterSpacing: '.12em',
  cursor: 'pointer', transition: 'all .2s',
})
export const BTN_GHOST = {
  background: 'transparent',
  border: '1px solid rgba(70,58,130,0.6)',
  color: '#7868b0', borderRadius: 10, padding: '10px 22px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '.8rem', letterSpacing: '.12em',
  cursor: 'pointer', transition: 'all .2s',
}
export const INPUT = {
  width: '100%',
  background: 'rgba(5,4,16,0.8)',
  border: '1px solid rgba(70,58,130,0.5)',
  borderRadius: 10, color: '#f0ead8',
  fontFamily: "'Crimson Pro', Georgia, serif",
  fontSize: '1.05rem', padding: '10px 14px', outline: 'none',
}
function hexToRgb(hex) {
  const h = hex.replace('#','')
  return `${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)}`
}
export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Crimson+Pro:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap');
@keyframes shine{from{background-position:300%}to{background-position:-300%}}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
*,*::before,*::after{box-sizing:border-box;}
html,body,#root{margin:0;background:#06060f;min-height:100vh;}
input,textarea,select{color:#f0ead8;}
input::placeholder,textarea::placeholder{color:#3c3268;}
button:focus{outline:none;}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(70,58,130,0.5);border-radius:3px;}
select option{background:#0a0820;color:#f0ead8;}
`
