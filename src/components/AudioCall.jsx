import { useState, useEffect } from 'react'
import { Phone, Mic, MicOff, Volume2, VolumeX, PhoneOff } from 'lucide-react'

export function AudioCall({ onEndCall, currentUser }) {
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-slate-900 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 max-w-md w-full mx-4">
        <div className="w-28 h-28 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
          <Phone className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl text-white font-bold mb-2">Audio Call</h2>
        <p className="text-gray-400 mb-2">Call with <span className="text-emerald-400">{currentUser}</span></p>
        <p className="text-3xl text-emerald-400 font-mono mb-8">{formatTime(duration)}</p>
        
        <div className="flex gap-4 justify-center">
          <button onClick={() => setIsMuted(!isMuted)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>
          <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className="w-14 h-14 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-all">
            {isSpeakerOn ? <Volume2 className="w-6 h-6 text-white" /> : <VolumeX className="w-6 h-6 text-white" />}
          </button>
          <button onClick={onEndCall} className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all animate-pulse">
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
        
        <p className="text-gray-500 text-xs mt-6">Tap to mute/unmute</p>
      </div>
    </div>
  )
}