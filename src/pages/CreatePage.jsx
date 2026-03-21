import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { PANEL, INPUT } from '../styles'
import { toast } from '../components/Toast'
import { checkAndAwardBadges } from '../utils/notifications'

const FAMILIES  = ['personal','fantasy','alien','ancient','sci-fi','spiritual','humorous','other']
const CATEGORIES = ['noun','verb','adjective','adverb','pronoun','emotion','place','number','phrase','other']

export default function CreatePage({ user, setPage, editTranslator=null }) {
  const isEdit = !!editTranslator

  const [name,        setName]        = useState(editTranslator?.name||'')
  const [description, setDescription] = useState(editTranslator?.description||'')
  const [family,      setFamily]      = useState(editTranslator?.family||'personal')
  const [grammar,     setGrammar]     = useState(editTranslator?.grammar||'')
  const [words,       setWords]       = useState([{src:'',dst:'',category:'noun',phonetic:''}])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [tab,         setTab]         = useState('words')

  useEffect(() => {
    if (editTranslator?.words) {
      const cats  = editTranslator.word_categories || {}
      const phons = editTranslator.phonetics || {}
      const rows  = Object.entries(editTranslator.words).map(([src,dst]) => ({
        src, dst, category: cats[src]||'noun', phonetic: phons[src]||''
      }))
      setWords(rows.length ? rows : [{src:'',dst:'',category:'noun',phonetic:''}])
    }
  }, [editTranslator])

  if (!user) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh'}}>
      <div style={{...PANEL,padding:'2.5rem',textAlign:'center',maxWidth:380}}>
        <p style={{color:'#7060a0',fontFamily:"'Crimson Pro',serif",fontSize:'1.1rem',margin:'0 0 1.5rem'}}>Sign in to create a translator</p>
        <button onClick={()=>setPage('auth')} style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.4)',color:'#c9a84c',borderRadius:10,padding:'10px 22px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.8rem',cursor:'pointer'}}>Sign in</button>
      </div>
    </div>
  )

  const addWord    = () => setWords(w=>[...w,{src:'',dst:'',category:'noun',phonetic:''}])
  const removeWord = i  => setWords(w=>w.filter((_,idx)=>idx!==i))
  const updateWord = (i,field,val) => setWords(w=>w.map((row,idx)=>idx===i?{...row,[field]:val}:row))

  const handleSave = async () => {
    if (!name.trim()) return setError('Give your translator a name')
    const valid = words.filter(w=>w.src.trim()&&w.dst.trim())
    if (valid.length===0) return setError('Add at least one word pair')
    setLoading(true); setError('')
    const wordMap={}, catMap={}, phonMap={}
    valid.forEach(w=>{
      const k=w.src.trim().toLowerCase()
      wordMap[k]=w.dst.trim()
      catMap[k]=w.category||'noun'
      if(w.phonetic?.trim()) phonMap[k]=w.phonetic.trim()
    })
    const payload = { name:name.trim(), description:description.trim()||null, family, grammar:grammar.trim()||null, words:wordMap, word_categories:catMap, phonetics:phonMap }
    let err
    if (isEdit) {
      const { error:e } = await supabase.from('translators').update(payload).eq('id', editTranslator.id)
      err=e
      if (!e) toast('Translator updated!','success')
    } else {
      const { error:e } = await supabase.from('translators').insert({ ...payload, user_id:user.id })
      err=e
      if (!e) {
        toast('Translator published!','success')
        const awarded = await checkAndAwardBadges(user.id)
        awarded.forEach(b => toast(`Badge unlocked: ${b}!`,'info'))
      }
    }
    if (err) { setError(err.message); setLoading(false); return }
    setPage('marketplace')
  }

  const exportJSON = () => {
    const data = { name, description, family, grammar, words:words.filter(w=>w.src&&w.dst).reduce((acc,w)=>({...acc,[w.src]:{translation:w.dst,category:w.category,phonetic:w.phonetic}}),{}) }
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${name||'translator'}.json`;a.click()
    toast('Exported!','success')
  }

  const importFile = (e,type) => {
    const file=e.target.files[0];if(!file)return
    const reader=new FileReader()
    reader.onload=ev=>{
      try {
        if(type==='json'){
          const data=JSON.parse(ev.target.result)
          if(data.name) setName(data.name)
          if(data.description) setDescription(data.description)
          if(data.family) setFamily(data.family)
          if(data.grammar) setGrammar(data.grammar)
          if(data.words){
            const rows=Object.entries(data.words).map(([src,v])=>({src,dst:typeof v==='object'?v.translation:v,category:typeof v==='object'?v.category:'noun',phonetic:typeof v==='object'?v.phonetic||'':''}))
            setWords(rows.length?rows:[{src:'',dst:'',category:'noun',phonetic:''}])
          }
          toast('Imported!','success')
        } else {
          const lines=ev.target.result.split('\n').filter(Boolean)
          const rows=lines.map(l=>{const[src,dst,category,phonetic]=l.split(',');return{src:src?.trim()||'',dst:dst?.trim()||'',category:category?.trim()||'noun',phonetic:phonetic?.trim()||''}}).filter(w=>w.src&&w.dst)
          if(rows.length){setWords(rows);toast('Imported!','success')}
          else toast('No valid rows found','error')
        }
      } catch { toast('Invalid file','error') }
    }
    reader.readAsText(file)
  }

  const sel=(val,opts,onChange)=>(
    <select value={val} onChange={e=>onChange(e.target.value)} style={{background:'rgba(5,4,16,0.8)',border:'1px solid rgba(70,58,130,0.5)',borderRadius:8,color:'#a090c0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',padding:'6px 10px',outline:'none',cursor:'pointer',letterSpacing:'.08em'}}>
      {opts.map(o=><option key={o} value={o}>{o}</option>)}
    </select>
  )

  return (
    <div style={{position:'relative',zIndex:2,minHeight:'100vh',padding:'4.5rem 1.5rem 5rem',maxWidth:800,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:'1.8rem'}}>
        <div>
          <h1 style={{fontFamily:"'Cinzel Decorative',serif",fontSize:'clamp(1.4rem,4vw,2rem)',letterSpacing:'.12em',color:'#e8e0d4',margin:'0 0 .3rem',textShadow:'0 0 30px rgba(201,168,76,0.35)'}}>{isEdit?'Edit Translator':'Create Translator'}</h1>
          <p style={{color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.25em',margin:0}}>{isEdit?'UPDATE YOUR LANGUAGE':'BUILD YOUR LANGUAGE'}</p>
        </div>
        <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
          {!isEdit&&(<>
            <label style={{background:'transparent',border:'1px solid rgba(70,58,130,0.5)',color:'#5848a0',borderRadius:8,padding:'7px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.1em',cursor:'pointer'}}>
              JSON<input type="file" accept=".json" onChange={e=>importFile(e,'json')} style={{display:'none'}}/>
            </label>
            <label style={{background:'transparent',border:'1px solid rgba(70,58,130,0.5)',color:'#5848a0',borderRadius:8,padding:'7px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.1em',cursor:'pointer'}}>
              CSV<input type="file" accept=".csv" onChange={e=>importFile(e,'csv')} style={{display:'none'}}/>
            </label>
          </>)}
          <button onClick={exportJSON} style={{background:'transparent',border:'1px solid rgba(70,58,130,0.5)',color:'#5848a0',borderRadius:8,padding:'7px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.68rem',letterSpacing:'.1em',cursor:'pointer'}}>Export</button>
        </div>
      </div>

      {/* Info */}
      <div style={{...PANEL,padding:'1.6rem',marginBottom:12}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,marginBottom:12}}>
          <div>
            <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem',letterSpacing:'.22em',marginBottom:7}}>NAME</label>
            <input style={INPUT} placeholder="Translator name…" value={name} onChange={e=>setName(e.target.value)}/>
          </div>
          <div>
            <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem',letterSpacing:'.22em',marginBottom:7}}>FAMILY</label>
            {sel(family,FAMILIES,setFamily)}
          </div>
        </div>
        <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem',letterSpacing:'.22em',marginBottom:7}}>DESCRIPTION</label>
        <textarea style={{...INPUT,minHeight:65,resize:'none',fontFamily:"'Crimson Pro',serif"}} placeholder="Tell people about your language…" value={description} onChange={e=>setDescription(e.target.value)}/>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,marginBottom:10}}>
        {['words','grammar'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?'rgba(201,168,76,0.1)':'transparent',border:tab===t?'1px solid rgba(201,168,76,0.35)':'1px solid rgba(70,58,130,0.4)',color:tab===t?'#c9a84c':'#5848a0',borderRadius:8,padding:'7px 18px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.7rem',letterSpacing:'.12em',cursor:'pointer',transition:'all .2s',textTransform:'uppercase'}}>{t}</button>
        ))}
      </div>

      {tab==='words'&&(
        <div style={{...PANEL,padding:'1.6rem'}}>
          {/* Column headers */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 110px 110px auto',gap:8,marginBottom:8}}>
            {['SOURCE','TRANSLATION','CATEGORY','PHONETIC',''].map((h,i)=>(
              <span key={i} style={{color:'#3a3060',fontFamily:"'JetBrains Mono',monospace",fontSize:'.58rem',letterSpacing:'.12em'}}>{h}</span>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:7,maxHeight:440,overflowY:'auto',paddingRight:2}}>
            {words.map((w,i)=>(
              <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr 110px 110px auto',gap:8,alignItems:'center'}}>
                <input style={{...INPUT,fontSize:'.86rem',padding:'7px 10px'}} placeholder="source" value={w.src} onChange={e=>updateWord(i,'src',e.target.value)}/>
                <input style={{...INPUT,fontSize:'.86rem',padding:'7px 10px',color:'#eac96a'}} placeholder="translation" value={w.dst} onChange={e=>updateWord(i,'dst',e.target.value)}/>
                {sel(w.category||'noun',CATEGORIES,v=>updateWord(i,'category',v))}
                <input style={{...INPUT,fontSize:'.78rem',padding:'6px 9px',color:'#9080c0'}} placeholder="e.g. /rɛ.la/" value={w.phonetic||''} onChange={e=>updateWord(i,'phonetic',e.target.value)}/>
                <button onClick={()=>removeWord(i)} style={{background:'rgba(200,80,80,0.08)',border:'1px solid rgba(200,80,80,0.2)',color:'#a06060',borderRadius:7,width:32,height:32,cursor:'pointer',fontSize:'.9rem',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s',flexShrink:0}}
                  onMouseEnter={e=>{e.currentTarget.style.background='rgba(200,80,80,0.18)';e.currentTarget.style.color='#e07070'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(200,80,80,0.08)';e.currentTarget.style.color='#a06060'}}>✕</button>
              </div>
            ))}
          </div>
          <button onClick={addWord} style={{width:'100%',marginTop:10,padding:'9px',background:'transparent',border:'1px dashed rgba(70,58,130,0.5)',color:'#5848a0',borderRadius:10,fontFamily:"'JetBrains Mono',monospace",fontSize:'.72rem',letterSpacing:'.14em',cursor:'pointer',transition:'all .2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(100,88,160,0.8)';e.currentTarget.style.color='#8878c0'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(70,58,130,0.5)';e.currentTarget.style.color='#5848a0'}}>
            + Add word pair
          </button>
        </div>
      )}

      {tab==='grammar'&&(
        <div style={{...PANEL,padding:'1.6rem'}}>
          <label style={{display:'block',color:'#5848a0',fontFamily:"'JetBrains Mono',monospace",fontSize:'.62rem',letterSpacing:'.22em',marginBottom:10}}>GRAMMAR RULES</label>
          <textarea style={{...INPUT,minHeight:260,resize:'vertical',fontFamily:"'Crimson Pro',serif",fontSize:'1rem',lineHeight:1.7}}
            placeholder={`Describe how your language works...\n\nExamples:\n- Word order: verb before noun\n- Plurals: add -avel suffix\n- Negation: prefix alo-\n- Questions: end with -ne`}
            value={grammar} onChange={e=>setGrammar(e.target.value)}/>
        </div>
      )}

      {error&&<p style={{color:'#e07070',fontFamily:"'JetBrains Mono',monospace",fontSize:'.73rem',marginTop:10}}>{error}</p>}

      <div style={{display:'flex',gap:10,marginTop:16}}>
        <button onClick={()=>setPage(isEdit?'use':'marketplace')} style={{background:'transparent',border:'1px solid rgba(70,58,130,0.5)',color:'#5848a0',borderRadius:10,padding:'11px 22px',fontFamily:"'JetBrains Mono',monospace",fontSize:'.76rem',letterSpacing:'.1em',cursor:'pointer',transition:'all .2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(100,88,160,0.8)';e.currentTarget.style.color='#8878c0'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(70,58,130,0.5)';e.currentTarget.style.color='#5848a0'}}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={loading} style={{flex:1,padding:'11px',background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.45)',color:'#c9a84c',borderRadius:10,fontFamily:"'JetBrains Mono',monospace",fontSize:'.76rem',letterSpacing:'.14em',cursor:'pointer',opacity:loading?.6:1,transition:'all .2s',boxShadow:'0 0 20px rgba(201,168,76,0.08)'}}
          onMouseEnter={e=>{if(!loading){e.currentTarget.style.background='rgba(201,168,76,0.2)';e.currentTarget.style.boxShadow='0 0 28px rgba(201,168,76,0.2)'}}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(201,168,76,0.12)';e.currentTarget.style.boxShadow='0 0 20px rgba(201,168,76,0.08)'}}>
          {loading?'Saving…':isEdit?'✦ Save changes':'✦ Publish translator'}
        </button>
      </div>
    </div>
  )
}
