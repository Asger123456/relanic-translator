import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { GLOBAL_CSS } from './styles'
import EvilEye from './components/EvilEye'
import Navbar from './components/Navbar'
import MobileNav from './components/MobileNav'
import AnnouncementBanner from './components/AnnouncementBanner'
import ToastContainer from './components/Toast'
import AuthPage from './pages/AuthPage'
import Marketplace from './pages/Marketplace'
import CreatePage from './pages/CreatePage'
import UsePage from './pages/UsePage'
import ProfilePage from './pages/ProfilePage'
import ViewProfile from './pages/ViewProfile'
import ActivityFeed from './pages/ActivityFeed'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'
import NotificationsPage from './pages/NotificationsPage'
import OriginalTranslator from './OriginalTranslator'

export default function App() {
  const [user,            setUser]            = useState(null)
  const [userProfile,     setUserProfile]     = useState(null)
  const [page,            setPage]            = useState('marketplace')
  const [activeTranslator,setActiveTranslator]= useState(null)
  const [editTranslator,  setEditTranslator]  = useState(null)
  const [viewProfileId,   setViewProfileId]   = useState(null)
  const [chatWith,        setChatWith]        = useState(null)
  const [unreadCount,     setUnreadCount]     = useState(0)
  const [isMobile,        setIsMobile]        = useState(window.innerWidth < 768)

  useEffect(() => {
    const el = document.createElement('style'); el.textContent = GLOBAL_CSS; document.head.appendChild(el)
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => { document.head.removeChild(el); window.removeEventListener('resize', onResize) }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) { fetchProfile(session.user.id); if (page === 'auth') setPage('marketplace') }
      else { setUserProfile(null); setUnreadCount(0) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setUserProfile(data)
    // fetch unread count
    const { count } = await supabase.from('notifications').select('*', { count:'exact', head:true }).eq('user_id', uid).eq('read', false)
    setUnreadCount(count || 0)
    // Subscribe to new notifications
    supabase.channel(`notifs-count:${uid}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications', filter:`user_id=eq.${uid}` },
        () => setUnreadCount(c => c + 1))
      .subscribe()
  }

  const goToNotifs = () => { setPage('notifs'); setUnreadCount(0) }
  const isBanned = userProfile?.banned_until && new Date(userProfile.banned_until) > new Date() && userProfile?.role !== 'owner'

  const render = () => {
    if (isBanned) return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <div style={{ background:'rgba(5,4,16,0.95)', border:'1px solid rgba(224,112,112,0.4)', borderRadius:16, padding:'2.5rem', textAlign:'center', maxWidth:420, boxShadow:'0 12px 48px rgba(0,0,0,0.8)' }}>
          <p style={{ color:'#e07070', fontFamily:"'Cinzel Decorative',serif", fontSize:'1.1rem', margin:'0 0 .5rem', letterSpacing:'.1em' }}>Account Suspended</p>
          <p style={{ color:'#5848a0', fontFamily:"'JetBrains Mono',monospace", fontSize:'.72rem', margin:'0 0 .8rem', letterSpacing:'.1em' }}>UNTIL {new Date(userProfile.banned_until).toLocaleDateString()}</p>
          {userProfile.ban_reason && <p style={{ color:'#7060a0', fontFamily:"'Crimson Pro',serif", margin:'0 0 1.5rem' }}>Reason: {userProfile.ban_reason}</p>}
          <button onClick={() => supabase.auth.signOut()} style={{ background:'transparent', border:'1px solid rgba(70,58,130,0.5)', color:'#5848a0', borderRadius:10, padding:'10px 22px', fontFamily:"'JetBrains Mono',monospace", fontSize:'.78rem', cursor:'pointer' }}>Sign out</button>
        </div>
      </div>
    )
    switch (page) {
      case 'auth':        return <AuthPage setPage={setPage}/>
      case 'marketplace': return <Marketplace user={user} setPage={setPage} setActiveTranslator={setActiveTranslator} setViewProfile={setViewProfileId}/>
      case 'create':      return <CreatePage user={user} setPage={setPage} editTranslator={editTranslator}/>
      case 'use':         return <UsePage translator={activeTranslator} user={user} setPage={setPage} setViewProfile={setViewProfileId} setEditTranslator={setEditTranslator}/>
      case 'profile':     return <ProfilePage user={user} setPage={setPage} setActiveTranslator={setActiveTranslator} setEditTranslator={setEditTranslator}/>
      case 'viewprofile': return <ViewProfile profileId={viewProfileId} user={user} setPage={setPage} setActiveTranslator={setActiveTranslator} setChatWith={setChatWith}/>
      case 'activity':    return <ActivityFeed user={user} setPage={setPage} setActiveTranslator={setActiveTranslator} setViewProfile={setViewProfileId}/>
      case 'chat':        return <ChatPage user={user} setPage={setPage} setViewProfile={setViewProfileId} chatWith={chatWith} setChatWith={setChatWith}/>
      case 'admin':       return <AdminPage user={user} userProfile={userProfile} setPage={setPage}/>
      case 'notifs':      return <NotificationsPage user={user} setPage={setPage} setActiveTranslator={setActiveTranslator} setViewProfile={setViewProfileId}/>
      case 'tongues':     return <OriginalTranslator/>
      default:            return <Marketplace user={user} setPage={setPage} setActiveTranslator={setActiveTranslator} setViewProfile={setViewProfileId}/>
    }
  }

  return (
    <>
      <EvilEye/>
      {isMobile
        ? <MobileNav user={user} userProfile={userProfile} page={page} setPage={(p) => { if(p==='notifs') goToNotifs(); else setPage(p) }} unreadCount={unreadCount}/>
        : <Navbar user={user} userProfile={userProfile} page={page} setPage={(p) => { if(p==='notifs') goToNotifs(); else setPage(p) }} unreadCount={unreadCount}/>
      }
      <AnnouncementBanner/>
      <div style={{ paddingBottom: isMobile ? 60 : 0 }}>
        {render()}
      </div>
      <ToastContainer/>
    </>
  )
}
