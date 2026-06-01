import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { Auth } from './components/Auth'
import { Chat } from './components/Chat'
import { Projects } from './components/Projects'
import { Loader2, MessageCircle, Package } from 'lucide-react'
import { Logo } from './components/Logo'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('chat')
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <Auth onAuth={() => {}} />
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-black/80 backdrop-blur-2xl border-t border-white/10 flex">
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 flex flex-col items-center gap-1 ${activeTab === 'chat' ? 'text-emerald-400' : 'text-gray-400'}`}>
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs">Chat</span>
        </button>
        <button onClick={() => setActiveTab('projects')} className={`flex-1 py-3 flex flex-col items-center gap-1 ${activeTab === 'projects' ? 'text-emerald-400' : 'text-gray-400'}`}>
          <Package className="w-5 h-5" />
          <span className="text-xs">Projects</span>
        </button>
      </div>

      {/* Desktop Tab Switcher */}
      <div className="hidden md:block fixed top-4 right-4 z-30">
        <div className="bg-black/50 backdrop-blur-xl rounded-full p-1 flex gap-1">
          <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <MessageCircle className="w-4 h-4 inline mr-1" /> Chat
          </button>
          <button onClick={() => setActiveTab('projects')} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === 'projects' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <Package className="w-4 h-4 inline mr-1" /> Projects
          </button>
        </div>
      </div>

      {activeTab === 'chat' && <Chat session={session} onLogout={handleLogout} onToggleTheme={() => setIsDarkMode(!isDarkMode)} isDarkMode={isDarkMode} />}
      {activeTab === 'projects' && <Projects session={session} isDarkMode={isDarkMode} />}
    </div>
  )
}

export default App