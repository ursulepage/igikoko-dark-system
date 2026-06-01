import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, Loader2, MessageCircle } from 'lucide-react'

export function Auth({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        onAuth()
      } else {
        if (password.length < 6) throw new Error('Password must be at least 6 characters')
        const { error } = await supabase.auth.signUp({ 
          email: email.trim(), 
          password, 
          options: { data: { username: username.trim() } } 
        })
        if (error) throw error
        alert('Account created! Please sign in.')
        setIsLogin(true)
      }
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">IGIKOKO</h1>
          <p className="text-gray-400 mt-2">Dark System Chat</p>
        </div>
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-8">
          <div className="flex gap-2 mb-6 bg-black/30 rounded-xl p-1">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg font-semibold ${isLogin ? 'bg-cyan-500 text-white' : 'text-gray-400'}`}>Sign In</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg font-semibold ${!isLogin ? 'bg-purple-500 text-white' : 'text-gray-400'}`}>Sign Up</button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required className="w-full bg-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full bg-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 chars)" required className="w-full bg-white/10 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}