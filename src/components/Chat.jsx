import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Send, Paperclip, Smile, Download, Trash2, Reply, Edit2, X, Loader2, 
  Phone, Video, Hash, Users, LogOut, Menu, Search, Moon, Sun, MessageCircle,
  Mic, MicOff, VideoOff, PhoneOff, Monitor, Maximize, Minimize,
  Image, FileText, Music, FileArchive, Eye, Play, Pause,
  Check, CheckCheck, Bell, BellRing, BellDot
} from 'lucide-react'
import { Logo } from './Logo'

// ============================================
// CUSTOM SCROLLBAR CSS
// ============================================
const scrollbarStyles = `
  .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.5); border-radius: 10px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.8); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes bubblePop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes typingPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  @keyframes pulseRed { 0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); } }
  .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
  .animate-bubblePop { animation: bubblePop 0.4s ease-out; }
  .animate-typing { animation: typingPulse 1s infinite; }
  .animate-pulse-red { animation: pulseRed 1.5s infinite; }
`

if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = scrollbarStyles
  document.head.appendChild(style)
}

// ============================================
// EMOJI PICKER
// ============================================
function EmojiPicker({ onSelectEmoji, onClose }) {
  const emojis = ['😀', '😂', '🥰', '😎', '🤔', '😭', '😡', '🥳', '👍', '❤️', '🔥', '🎉', '✨', '💀', '👀', '🙏']
  return (
    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-2xl p-3 shadow-2xl z-50 w-64">
      <div className="grid grid-cols-8 gap-1">
        {emojis.map(emoji => (
          <button key={emoji} onClick={() => { onSelectEmoji(emoji); onClose() }} className="w-8 h-8 hover:bg-gray-700 rounded-lg text-xl transition-colors">
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// REAL VIDEO CALL (WebRTC)
// ============================================
function VideoCall({ onEndCall, currentUser, roomId, callerName }) {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnection = useRef(null)
  const screenStreamRef = useRef(null)
  const callChannelRef = useRef(null)

  useEffect(() => {
    initCall()
    const timer = setInterval(() => setCallDuration(d => d + 1), 1000)
    return () => {
      clearInterval(timer)
      if (localStream) localStream.getTracks().forEach(track => track.stop())
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(track => track.stop())
      if (peerConnection.current) peerConnection.current.close()
      if (callChannelRef.current) supabase.removeChannel(callChannelRef.current)
    }
  }, [])

  const initCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      
      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
      const pc = new RTCPeerConnection(configuration)
      peerConnection.current = pc
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
      
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0])
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0]
        setConnectionStatus('connected')
      }
      
      pc.onicecandidate = (event) => {
        if (event.candidate) sendSignal({ type: 'candidate', candidate: event.candidate })
      }
      
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected') setConnectionStatus('connected')
        if (pc.iceConnectionState === 'failed') setConnectionStatus('failed')
      }
      
      const channel = supabase.channel(`call_${roomId}`)
      callChannelRef.current = channel
      
      channel.on('broadcast', { event: 'signal' }, async (payload) => {
        const { type, offer, answer, candidate } = payload.payload
        if (!peerConnection.current) return
        try {
          if (type === 'offer') {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await peerConnection.current.createAnswer()
            await peerConnection.current.setLocalDescription(answer)
            sendSignal({ type: 'answer', answer })
          } else if (type === 'answer') {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer))
          } else if (type === 'candidate' && candidate) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
          }
        } catch (err) { console.error("Signal error:", err) }
      })
      channel.subscribe()
      
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendSignal({ type: 'offer', offer })
      
    } catch (err) { console.error("Call error:", err); setConnectionStatus('failed') }
  }

  const sendSignal = async (signal) => {
    if (callChannelRef.current) {
      await callChannelRef.current.send({ type: 'broadcast', event: 'signal', payload: signal })
    }
  }

  const toggleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        screenStreamRef.current = screenStream
        const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video')
        if (sender) sender.replaceTrack(screenStream.getVideoTracks()[0])
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream
        setIsSharingScreen(true)
      } else {
        if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(track => track.stop())
        const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video')
        if (sender && localStream) sender.replaceTrack(localStream.getVideoTracks()[0])
        if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream
        setIsSharingScreen(false)
      }
    } catch (err) { console.error("Screen share error:", err) }
  }

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled)
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled)
      setIsVideoOff(!isVideoOff)
    }
  }

  const formatDuration = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="relative w-full max-w-6xl">
        <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <p className="text-gray-400">Calling {currentUser}...</p>
                <p className="text-sm text-gray-500 mt-2">{connectionStatus === 'connecting' ? 'Connecting...' : formatDuration(callDuration)}</p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-24 right-4 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-emerald-500">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {isVideoOff && <div className="absolute inset-0 bg-gray-900 flex items-center justify-center"><VideoOff className="w-8 h-8 text-gray-600" /></div>}
          {isMuted && <div className="absolute bottom-2 left-2 bg-red-500 rounded-full p-1"><MicOff className="w-3 h-3 text-white" /></div>}
        </div>
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-xl rounded-full px-4 py-2">
          <p className="text-white text-sm">Video Call with {currentUser} • {formatDuration(callDuration)}</p>
        </div>
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 bg-black/60 backdrop-blur-xl rounded-full p-3 shadow-2xl">
          <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-gray-700'}`}>
            {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </button>
          <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'}`}>
            {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
          </button>
          <button onClick={toggleScreenShare} className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
            <Monitor className="w-5 h-5 text-white" />
          </button>
          <button onClick={onEndCall} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// REAL AUDIO CALL (WebRTC)
// ============================================
function AudioCall({ onEndCall, currentUser, roomId, callerName }) {
  const [localStream, setLocalStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const audioRef = useRef(null)
  const peerConnection = useRef(null)
  const callChannelRef = useRef(null)

  useEffect(() => {
    initCall()
    const timer = setInterval(() => setCallDuration(d => d + 1), 1000)
    return () => {
      clearInterval(timer)
      if (localStream) localStream.getTracks().forEach(track => track.stop())
      if (peerConnection.current) peerConnection.current.close()
      if (callChannelRef.current) supabase.removeChannel(callChannelRef.current)
    }
  }, [])

  const initCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setLocalStream(stream)
      
      const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
      const pc = new RTCPeerConnection(configuration)
      peerConnection.current = pc
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
      
      pc.ontrack = (event) => {
        if (audioRef.current) audioRef.current.srcObject = event.streams[0]
        setConnectionStatus('connected')
      }
      
      pc.onicecandidate = (event) => {
        if (event.candidate) sendSignal({ type: 'candidate', candidate: event.candidate })
      }
      
      const channel = supabase.channel(`call_${roomId}`)
      callChannelRef.current = channel
      
      channel.on('broadcast', { event: 'signal' }, async (payload) => {
        const { type, offer, answer, candidate } = payload.payload
        if (!peerConnection.current) return
        try {
          if (type === 'offer') {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await peerConnection.current.createAnswer()
            await peerConnection.current.setLocalDescription(answer)
            sendSignal({ type: 'answer', answer })
          } else if (type === 'answer') {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer))
          } else if (type === 'candidate' && candidate) {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
          }
        } catch (err) { console.error("Signal error:", err) }
      })
      channel.subscribe()
      
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendSignal({ type: 'offer', offer })
    } catch (err) { console.error("Audio call error:", err) }
  }

  const sendSignal = async (signal) => {
    if (callChannelRef.current) {
      await callChannelRef.current.send({ type: 'broadcast', event: 'signal', payload: signal })
    }
  }

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled)
      setIsMuted(!isMuted)
    }
  }

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-slate-900 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 max-w-md w-full">
        <audio ref={audioRef} autoPlay playsInline />
        <div className="w-28 h-28 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Phone className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl text-white font-bold mb-2">Audio Call</h2>
        <p className="text-gray-400 mb-2">Call with <span className="text-emerald-400">{currentUser}</span></p>
        <p className="text-3xl text-emerald-400 font-mono mb-8">{formatTime(callDuration)}</p>
        <div className="flex gap-4 justify-center">
          <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-gray-700'}`}>
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>
          <button onClick={onEndCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
        {connectionStatus === 'connecting' && <p className="text-gray-500 text-xs mt-4">Connecting...</p>}
      </div>
    </div>
  )
}

// ============================================
// INCOMING CALL COMPONENT
// ============================================
function IncomingCall({ caller, onAnswer, onDecline, callType }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl p-8 max-w-md w-full text-center border border-emerald-500/30 shadow-2xl">
        <div className={`w-20 h-20 ${callType === 'video' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-purple-500 to-pink-600'} rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-red`}>
          {callType === 'video' ? <Video className="w-10 h-10 text-white" /> : <Phone className="w-10 h-10 text-white" />}
        </div>
        <h2 className="text-2xl text-white font-bold mb-2">Incoming {callType === 'video' ? 'Video' : 'Audio'} Call</h2>
        <p className="text-gray-400 mb-6">from <span className="text-emerald-400 font-semibold">{caller}</span></p>
        <div className="flex gap-4 justify-center">
          <button onClick={onAnswer} className="px-6 py-3 bg-emerald-500 rounded-xl text-white font-medium hover:bg-emerald-600 transition flex items-center gap-2 shadow-lg">
            <Phone className="w-5 h-5" /> Answer
          </button>
          <button onClick={onDecline} className="px-6 py-3 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition flex items-center gap-2 shadow-lg">
            <PhoneOff className="w-5 h-5" /> Decline
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// FLOATING NOTIFICATION
// ============================================
function FloatingNotification({ notification, onClick }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById(`notif-${notification.id}`)
      if (el) el.remove()
    }, 5000)
    return () => clearTimeout(timer)
  }, [notification.id])

  return (
    <div id={`notif-${notification.id}`} className="fixed top-20 right-4 z-50 animate-bubblePop cursor-pointer" onClick={() => onClick(notification)}>
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-4 shadow-2xl max-w-sm border border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            {notification.type === 'message' ? <MessageCircle className="w-5 h-5 text-white" /> : <Phone className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{notification.title}</p>
            <p className="text-white/80 text-xs">{notification.body}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// TYPING INDICATOR
// ============================================
function TypingIndicator({ typingUsers }) {
  if (Object.keys(typingUsers).length === 0) return null
  const names = Object.values(typingUsers)
  let text = names.length === 1 ? `${names[0]} is typing...` : `${names.length} people are typing...`
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 bg-black/20 rounded-lg">
      <div className="flex gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-typing"></span><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></span><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></span></div>
      <span>{text}</span>
    </div>
  )
}

// ============================================
// FILE PREVIEW
// ============================================
function FilePreview({ fileUrl, fileName, onClose }) {
  const [isImage, setIsImage] = useState(false)
  const [isVideo, setIsVideo] = useState(false)
  const [isAudio, setIsAudio] = useState(false)
  const [isPdf, setIsPdf] = useState(false)
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    setIsImage(['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext))
    setIsVideo(['mp4', 'webm', 'avi'].includes(ext))
    setIsAudio(['mp3', 'wav', 'ogg'].includes(ext))
    setIsPdf(ext === 'pdf')
  }, [fileName])

  const togglePlay = () => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.pause() : audioRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-4xl w-full max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <span className="text-white font-medium truncate">{fileName}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          {isImage && <img src={fileUrl} alt={fileName} className="max-w-full max-h-[70vh] mx-auto rounded-lg" />}
          {isVideo && <video controls autoPlay className="max-w-full max-h-[70vh] mx-auto rounded-lg"><source src={fileUrl} /></video>}
          {isAudio && (
            <div className="text-center p-8">
              <div className="w-32 h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6"><Music className="w-12 h-12 text-white" /></div>
              <audio ref={audioRef} src={fileUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
              <button onClick={togglePlay} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto">{isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}</button>
              <a href={fileUrl} download className="mt-4 inline-block text-emerald-400 text-sm hover:underline">Download</a>
            </div>
          )}
          {isPdf && <iframe src={fileUrl} className="w-full h-[70vh] rounded-lg" title={fileName} />}
        </div>
      </div>
    </div>
  )
}

// ============================================
// AUDIO RECORDER
// ============================================
function AudioRecorder({ onRecordingComplete, onClose }) {
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => setAudioChunks(prev => [...prev, event.data])
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        onRecordingComplete(new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' }))
        stream.getTracks().forEach(track => track.stop())
        setAudioChunks([])
      }
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch (err) { alert("Please allow microphone access") }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      clearInterval(timerRef.current)
      setRecordingTime(0)
      onClose()
    }
  }

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}>
          <Mic className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">{isRecording ? 'Recording...' : 'Ready to Record'}</h3>
        {isRecording && <p className="text-3xl font-mono text-emerald-400 mb-4">{formatTime(recordingTime)}</p>}
        <div className="flex gap-3 justify-center">
          {!isRecording ? <button onClick={startRecording} className="px-6 py-3 bg-emerald-500 rounded-xl text-white">Start</button> : <button onClick={stopRecording} className="px-6 py-3 bg-red-500 rounded-xl text-white">Stop & Send</button>}
          <button onClick={onClose} className="px-6 py-3 bg-gray-700 rounded-xl text-white">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN CHAT COMPONENT
// ============================================
export function Chat({ session, onLogout, onToggleTheme, isDarkMode }) {
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [currentRoom, setCurrentRoom] = useState(null)
  const [rooms, setRooms] = useState([])
  const [users, setUsers] = useState([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [editMessage, setEditMessage] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [privateChatUser, setPrivateChatUser] = useState(null)
  const [privateMessages, setPrivateMessages] = useState({})
  const [activeTab, setActiveTab] = useState('public')
  const [publicChannel, setPublicChannel] = useState(null)
  const [privateChannel, setPrivateChannel] = useState(null)
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isAudioCall, setIsAudioCall] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [callWith, setCallWith] = useState(null)
  const [callRoomId, setCallRoomId] = useState(null)
  const [callerName, setCallerName] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [floatingNotifications, setFloatingNotifications] = useState([])
  const [typingUsers, setTypingUsers] = useState({})

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const ADMIN_EMAIL = 'senyiblazi@gmail.com'
  const isAdminUser = session.user?.email === ADMIN_EMAIL

  useEffect(() => {
    const saved = localStorage.getItem(`unread_${session.user.id}`)
    if (saved) setUnreadCounts(JSON.parse(saved))
  }, [session.user.id])
  useEffect(() => { localStorage.setItem(`unread_${session.user.id}`, JSON.stringify(unreadCounts)) }, [unreadCounts, session.user.id])

  const markAsRead = (id, type) => setUnreadCounts(prev => ({ ...prev, [`${type}_${id}`]: 0 }))

  const addNotification = (title, body, type, data) => {
    const id = Date.now()
    setFloatingNotifications(prev => [...prev, { id, title, body, type, data }])
    setTimeout(() => setFloatingNotifications(prev => prev.filter(n => n.id !== id)), 5000)
  }

  const handleNotificationClick = (notif) => {
    if (notif.type === 'message' && notif.data) {
      if (notif.data.type === 'public') { setActiveTab('public'); setCurrentRoom(rooms.find(r => r.id === notif.data.roomId)); setPrivateChatUser(null); markAsRead(notif.data.roomId, 'public') }
      else { setActiveTab('private'); setPrivateChatUser(users.find(u => u.id === notif.data.userId)); setCurrentRoom(null); markAsRead(notif.data.userId, 'private') }
    }
  }

  useEffect(() => {
    const checkMobile = () => { setIsMobile(window.innerWidth < 768); if (window.innerWidth < 768) setSidebarOpen(false) }
    checkMobile(); window.addEventListener('resize', checkMobile); return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { loadRooms(); loadUsers() }, [])
  useEffect(() => { setupSubscriptions(); return () => { if (publicChannel) supabase.removeChannel(publicChannel); if (privateChannel) supabase.removeChannel(privateChannel) } }, [currentRoom, privateChatUser])
  useEffect(() => { if (activeTab === 'public' && currentRoom) { loadPublicMessages(currentRoom.id); markAsRead(currentRoom.id, 'public') } }, [currentRoom, activeTab])
  useEffect(() => { if (activeTab === 'private' && privateChatUser) { loadPrivateMessages(privateChatUser.id); markAsRead(privateChatUser.id, 'private') } }, [privateChatUser, activeTab])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const setupSubscriptions = async () => {
    if (publicChannel) await supabase.removeChannel(publicChannel)
    if (privateChannel) await supabase.removeChannel(privateChannel)

    const newPublic = supabase.channel('public-messages')
    newPublic.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
      const newMsg = payload.new
      if (currentRoom?.id === newMsg.room_id) setMessages(prev => [...prev, newMsg])
      if (newMsg.user_id !== session.user.id) {
        setUnreadCounts(prev => ({ ...prev, [`public_${newMsg.room_id}`]: (prev[`public_${newMsg.room_id}`] || 0) + 1 }))
        const room = rooms.find(r => r.id === newMsg.room_id)
        addNotification(`💬 New message in ${room?.name || 'Chat'}`, `${getUserName(newMsg.user_id)}: ${newMsg.message?.slice(0, 50)}`, 'message', { type: 'public', roomId: newMsg.room_id })
      }
    })
    newPublic.subscribe()
    setPublicChannel(newPublic)

    const newPrivate = supabase.channel('private-messages')
    newPrivate.on('broadcast', { event: 'private-message' }, (payload) => {
      const { message, fromUserId, toUserId } = payload.payload
      if (toUserId === session.user.id) {
        if (privateChatUser?.id === fromUserId) setMessages(prev => [...prev, message])
        setUnreadCounts(prev => ({ ...prev, [`private_${fromUserId}`]: (prev[`private_${fromUserId}`] || 0) + 1 }))
        addNotification(`💌 Message from ${getUserName(fromUserId)}`, message.message?.slice(0, 50), 'message', { type: 'private', userId: fromUserId })
        const key = [session.user.id, fromUserId].sort().join('-')
        const stored = JSON.parse(localStorage.getItem(`privchat_${key}`) || '[]')
        localStorage.setItem(`privchat_${key}`, JSON.stringify([...stored, message]))
      }
    })
    newPrivate.on('broadcast', { event: 'typing' }, (payload) => {
      const { from, username, isTyping } = payload.payload
      if (from !== session.user.id) setTypingUsers(prev => isTyping ? { ...prev, [from]: username } : { ...prev, [from]: undefined })
    })
    newPrivate.on('broadcast', { event: 'call-request' }, (payload) => {
      const { from, type, fromUsername, roomId } = payload.payload
      if (from !== session.user.id) {
        setIncomingCall({ from, type, fromUser: { username: fromUsername, id: from }, roomId })
        addNotification(`📞 Incoming ${type} call`, `From: ${fromUsername}`, 'call', null)
      }
    })
    newPrivate.subscribe()
    setPrivateChannel(newPrivate)
  }

  async function loadRooms() {
    const { data } = await supabase.from('chat_rooms').select('*').eq('is_private', false).order('created_at')
    if (data?.length) setRooms(data)
    else { const { data: newRoom } = await supabase.from('chat_rooms').insert([{ name: 'General', is_private: false }]).select(); if (newRoom) setRooms(newRoom) }
    if (data?.length && !currentRoom) setCurrentRoom(data[0])
  }
  async function loadUsers() { const { data } = await supabase.from('users').select('*'); if (data) setUsers(data.filter(u => u.id !== session.user.id)) }
  async function loadPublicMessages(roomId) { const { data } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true }).limit(200); if (data) setMessages(data) }
  async function loadPrivateMessages(userId) { const key = [session.user.id, userId].sort().join('-'); const stored = localStorage.getItem(`privchat_${key}`); setMessages(stored ? JSON.parse(stored) : []) }

  const sendPrivateMessage = async (text) => {
    if (!text.trim() || !privateChatUser) return
    const newMsg = { id: Date.now(), user_id: session.user.id, message: text, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, newMsg])
    if (privateChannel) await privateChannel.send({ type: 'broadcast', event: 'private-message', payload: { message: newMsg, fromUserId: session.user.id, toUserId: privateChatUser.id } })
    const key = [session.user.id, privateChatUser.id].sort().join('-')
    const stored = JSON.parse(localStorage.getItem(`privchat_${key}`) || '[]')
    localStorage.setItem(`privchat_${key}`, JSON.stringify([...stored, newMsg]))
    setMessageText('')
  }

  async function uploadFileAndSend(file, isPrivate = false) {
    if (!file) return
    setUploading(true)
    const roomId = isPrivate ? 'private' : currentRoom?.id
    const path = `uploads/${roomId}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('projects').upload(path, file)
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('projects').getPublicUrl(path)
      if (isPrivate) {
        const newMsg = { id: Date.now(), user_id: session.user.id, message: `📎 ${file.name}`, created_at: new Date().toISOString(), file_url: publicUrl, file_name: file.name }
        setMessages(prev => [...prev, newMsg])
        if (privateChannel) await privateChannel.send({ type: 'broadcast', event: 'private-message', payload: { message: newMsg, fromUserId: session.user.id, toUserId: privateChatUser.id } })
        const key = [session.user.id, privateChatUser.id].sort().join('-')
        const stored = JSON.parse(localStorage.getItem(`privchat_${key}`) || '[]')
        localStorage.setItem(`privchat_${key}`, JSON.stringify([...stored, newMsg]))
      } else await supabase.from('messages').insert([{ user_id: session.user.id, room_id: currentRoom.id, message: `📎 ${file.name}`, file_url: publicUrl, file_name: file.name }])
    }
    setUploading(false)
    setUploadFile(null)
  }

  async function sendPublicMessage(fileUrl = null, fileName = null) {
    if ((!messageText.trim() && !uploadFile && !fileUrl) || !currentRoom) return
    if (uploadFile && !fileUrl) { await uploadFileAndSend(uploadFile, false); setUploadFile(null); setMessageText(''); return }
    const data = { user_id: session.user.id, room_id: currentRoom.id, message: messageText || (fileUrl ? `📎 ${fileName}` : '') }
    if (fileUrl) data.file_url = fileUrl; if (fileName) data.file_name = fileName
    if (replyTo) data.reply_to = replyTo.id
    if (editMessage) { await supabase.from('messages').update({ message: messageText, edited: true }).eq('id', editMessage.id); setEditMessage(null) }
    else if (messageText.trim() || fileUrl) await supabase.from('messages').insert([data])
    setMessageText(''); setReplyTo(null)
  }

  async function deleteMessage(id) { if (confirm('Delete?')) { if (activeTab === 'public') await supabase.from('messages').delete().eq('id', id); else { const updated = messages.filter(m => m.id !== id); setMessages(updated); const key = [session.user.id, privateChatUser.id].sort().join('-'); localStorage.setItem(`privchat_${key}`, JSON.stringify(updated)) } } }

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    setIsTyping(true)
    if (privateChannel && privateChatUser) privateChannel.send({ type: 'broadcast', event: 'typing', payload: { from: session.user.id, to: privateChatUser.id, username: getUserName(session.user.id) } })
    typingTimeoutRef.current = setTimeout(() => { setIsTyping(false); if (privateChannel && privateChatUser) privateChannel.send({ type: 'broadcast', event: 'typing', payload: { from: session.user.id, to: privateChatUser.id, username: getUserName(session.user.id), isTyping: false } }) }, 1000)
  }

  const startVideoCall = (user) => {
    const roomId = `call_${Date.now()}_${session.user.id}_${user.id}`
    setCallWith(user); setCallRoomId(roomId); setCallerName(user.username); setIsVideoCall(true)
    if (privateChannel) privateChannel.send({ type: 'broadcast', event: 'call-request', payload: { from: session.user.id, to: user.id, type: 'video', fromUsername: getUserName(session.user.id), roomId } })
  }
  const startAudioCall = (user) => {
    const roomId = `call_${Date.now()}_${session.user.id}_${user.id}`
    setCallWith(user); setCallRoomId(roomId); setCallerName(user.username); setIsAudioCall(true)
    if (privateChannel) privateChannel.send({ type: 'broadcast', event: 'call-request', payload: { from: session.user.id, to: user.id, type: 'audio', fromUsername: getUserName(session.user.id), roomId } })
  }
  const answerCall = () => { setIsVideoCall(true); setIsAudioCall(true); setIncomingCall(null) }
  const declineCall = () => setIncomingCall(null)
  const endCall = () => { setIsVideoCall(false); setIsAudioCall(false); setCallWith(null); setCallRoomId(null); setCallerName(null) }

  const getUserName = (id) => users.find(u => u.id === id)?.username || id?.slice(0, 8)
  const getUserAvatar = (id) => `https://ui-avatars.com/api/?name=${getUserName(id)}&background=10b981&color=fff`
  const getCurrentUserName = () => getUserName(session.user.id)
  const filteredUsers = users.filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase()))

  const getSortedRooms = () => [...rooms].sort((a,b) => (unreadCounts[`public_${b.id}`]||0) - (unreadCounts[`public_${a.id}`]||0))
  const getSortedUsers = () => [...users].sort((a,b) => (unreadCounts[`private_${b.id}`]||0) - (unreadCounts[`private_${a.id}`]||0))

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950' : 'bg-gradient-to-br from-gray-100 via-purple-100 to-gray-100'}`}>
      {floatingNotifications.map(n => <FloatingNotification key={n.id} notification={n} onClick={handleNotificationClick} />)}
      {isVideoCall && callWith && <VideoCall onEndCall={endCall} currentUser={callWith.username} roomId={callRoomId} callerName={callerName} />}
      {isAudioCall && callWith && <AudioCall onEndCall={endCall} currentUser={callWith.username} roomId={callRoomId} callerName={callerName} />}
      {incomingCall && <IncomingCall caller={incomingCall.fromUser?.username} callType={incomingCall.type} onAnswer={answerCall} onDecline={declineCall} />}
      {previewFile && <FilePreview fileUrl={previewFile.url} fileName={previewFile.name} onClose={() => setPreviewFile(null)} />}
      {showAudioRecorder && <AudioRecorder onRecordingComplete={(f) => { uploadFileAndSend(f, activeTab === 'private'); setShowAudioRecorder(false) }} onClose={() => setShowAudioRecorder(false)} />}

      {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 z-30 p-2 bg-white/10 rounded-xl md:hidden"><Menu className="w-5 h-5 text-white" /></button>}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full ${isDarkMode ? 'bg-black/60' : 'bg-white/60'} backdrop-blur-2xl border-r border-white/10 transition-all duration-300 z-20 ${sidebarOpen ? 'w-80' : '-translate-x-full md:translate-x-0 md:w-20'} overflow-y-auto custom-scroll`}>
        <div className="p-5 flex justify-between border-b border-white/10 sticky top-0 bg-inherit">
          {sidebarOpen && <div className="flex items-center gap-3"><Logo size="md" /><span className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>IGIKOKO</span></div>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400"><Menu className="w-5 h-5" /></button>
        </div>
        <div className="p-3">
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
          <div className="flex gap-2 mb-4 bg-black/30 rounded-xl p-1">
            <button onClick={() => { setActiveTab('public'); setPrivateChatUser(null); setMessages([]) }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'public' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'text-gray-400'}`}><Hash className="w-4 h-4 inline mr-1" /> Public</button>
            <button onClick={() => { setActiveTab('private'); setCurrentRoom(null); setMessages([]) }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'private' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'text-gray-400'}`}><Users className="w-4 h-4 inline mr-1" /> Private</button>
          </div>
          {activeTab === 'public' && (<div className="space-y-1 max-h-[300px] overflow-y-auto custom-scroll"><h3 className="text-xs text-gray-400 px-3 py-2">CHAT ROOMS</h3>{getSortedRooms().map(room => (<button key={room.id} onClick={() => { setCurrentRoom(room); markAsRead(room.id, 'public') }} className={`w-full flex items-center justify-between px-3 py-3 rounded-xl ${currentRoom?.id === room.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-gray-400 hover:bg-white/10'}`}><div className="flex items-center gap-3"><Hash className="w-5 h-5" />{sidebarOpen && <span>{room.name}</span>}</div>{unreadCounts[`public_${room.id}`] > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse-red">{unreadCounts[`public_${room.id}`]}</span>}</button>))}</div>)}
          {activeTab === 'private' && (<div className="space-y-1 max-h-[300px] overflow-y-auto custom-scroll"><h3 className="text-xs text-gray-400 px-3 py-2">USERS</h3>{getSortedUsers().filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (<div key={user.id} className="flex items-center gap-2 mb-1"><button onClick={() => { setPrivateChatUser(user); markAsRead(user.id, 'private') }} className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-xl ${privateChatUser?.id === user.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-gray-400 hover:bg-white/10'}`}><img src={getUserAvatar(user.id)} className="w-8 h-8 rounded-full" />{sidebarOpen && (<div className="flex-1 text-left"><p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.username}</p><p className="text-xs text-gray-500">{user.email}</p></div>)}</button>{sidebarOpen && (<div className="flex gap-1"><button onClick={() => startVideoCall(user)} className="p-2 bg-emerald-500/20 rounded-lg"><Video className="w-4 h-4 text-emerald-400" /></button><button onClick={() => startAudioCall(user)} className="p-2 bg-purple-500/20 rounded-lg"><Phone className="w-4 h-4 text-purple-400" /></button></div>)}</div>))}</div>)}
          <button onClick={onToggleTheme} className="w-full flex items-center gap-3 px-3 py-3 mt-4 rounded-xl text-gray-400 hover:bg-white/10">{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}{sidebarOpen && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}</button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-inherit"><div className="flex items-center gap-3"><img src={getUserAvatar(session.user.id)} className="w-10 h-10 rounded-full ring-2 ring-emerald-500" />{sidebarOpen && (<div className="flex-1"><p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getCurrentUserName()}</p><p className="text-gray-400 text-xs">{session.user.email}</p>{isAdminUser && <span className="text-xs text-emerald-500">Admin</span>}</div>)}<button onClick={onLogout} className="text-gray-400 hover:text-red-400"><LogOut className="w-5 h-5" /></button></div></div>
      </div>

      {/* Main Chat Area */}
      <div className={`transition-all duration-300 ${sidebarOpen && !isMobile ? 'ml-80' : 'ml-0 md:ml-20'}`}>
        <div className="p-4 md:p-6 pb-24 md:pb-6">
          {(activeTab === 'public' && currentRoom) || (activeTab === 'private' && privateChatUser) ? (
            <>
              <div className={`${isDarkMode ? 'bg-white/5' : 'bg-black/5'} rounded-2xl p-4 border border-white/10 mb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activeTab === 'public' ? <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center"><Hash className="w-6 h-6 text-white" /></div> : <img src={getUserAvatar(privateChatUser.id)} className="w-12 h-12 rounded-full ring-2 ring-emerald-500" />}
                    <div><h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeTab === 'public' ? currentRoom.name : privateChatUser.username}</h2><p className="text-gray-400 text-sm">{activeTab === 'public' ? 'Public Channel' : 'Private Chat'}</p></div>
                  </div>
                  {activeTab === 'private' && privateChatUser && (<div className="flex gap-2"><button onClick={() => startVideoCall(privateChatUser)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white text-sm"><Video className="w-4 h-4" /> Video</button><button onClick={() => startAudioCall(privateChatUser)} className="px-4 py-2 bg-purple-500/20 rounded-xl text-purple-400 text-sm"><Phone className="w-4 h-4" /> Audio</button></div>)}
                </div>
                <TypingIndicator typingUsers={typingUsers} />
              </div>
              <div className={`${isDarkMode ? 'bg-black/40' : 'bg-white/40'} rounded-2xl border border-white/10 mb-4 overflow-hidden`}>
                <div className="h-[450px] overflow-y-auto p-4 space-y-3 custom-scroll">
                  {messages.length === 0 && <div className="flex items-center justify-center h-full text-gray-500"><div className="text-center"><MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No messages yet</p></div></div>}
                  {messages.map((msg) => (<div key={msg.id} className={`flex gap-2 group ${msg.user_id === session.user.id ? 'flex-row-reverse' : ''}`}><img src={getUserAvatar(msg.user_id)} className="w-8 h-8 rounded-full" /><div className={`max-w-[70%] rounded-2xl p-3 relative ${msg.user_id === session.user.id ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>{msg.user_id !== session.user.id && <p className="text-xs text-emerald-400 mb-1">{getUserName(msg.user_id)}</p>}{msg.reply_to && <div className="text-xs opacity-70 mb-1">↩️ Replying</div>}<p className="text-sm">{msg.message}</p>{msg.file_url && (<button onClick={() => setPreviewFile({ url: msg.file_url, name: msg.file_name })} className="mt-2 flex items-center gap-2 text-xs bg-black/30 rounded-lg px-2 py-1"><Eye className="w-3 h-3" /> {msg.file_name}</button>)}<p className="text-[10px] opacity-50 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p><div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 flex gap-1"><button onClick={() => setReplyTo(msg)} className="bg-gray-700 rounded-full p-1"><Reply className="w-3 h-3 text-white" /></button>{msg.user_id === session.user.id && <button onClick={() => { setEditMessage(msg); setMessageText(msg.message) }} className="bg-gray-700 rounded-full p-1"><Edit2 className="w-3 h-3 text-white" /></button>}</div>{(msg.user_id === session.user.id || isAdminUser) && <button onClick={() => deleteMessage(msg.id)} className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 rounded-full p-1"><Trash2 className="w-3 h-3 text-white" /></button>}</div></div>))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="fixed bottom-0 left-0 right-0 md:relative bg-white/5 rounded-t-2xl md:rounded-2xl p-3 border-t md:border border-white/10">
                {replyTo && <div className="mb-2 p-2 bg-emerald-500/20 rounded-lg flex justify-between"><span className="text-xs text-emerald-400">Replying to: {replyTo.message?.slice(0, 50)}</span><button onClick={() => setReplyTo(null)}><X className="w-3 h-3" /></button></div>}
                {editMessage && <div className="mb-2 p-2 bg-yellow-500/20 rounded-lg flex justify-between"><span className="text-xs text-yellow-400">Editing...</span><button onClick={() => { setEditMessage(null); setMessageText('') }}><X className="w-3 h-3" /></button></div>}
                <div className="flex gap-2"><input type="file" ref={fileInputRef} onChange={(e) => setUploadFile(e.target.files[0])} className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/10 rounded-xl"><Paperclip className="w-5 h-5 text-gray-400" /></button><button onClick={() => setShowAudioRecorder(true)} className="p-2 bg-white/10 rounded-xl"><Mic className="w-5 h-5 text-gray-400" /></button><button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 bg-white/10 rounded-xl relative"><Smile className="w-5 h-5 text-gray-400" />{showEmojiPicker && <EmojiPicker onSelectEmoji={(e) => setMessageText(prev => prev + e)} onClose={() => setShowEmojiPicker(false)} />}</button><input type="text" value={messageText} onChange={(e) => { setMessageText(e.target.value); handleTyping() }} onKeyPress={(e) => e.key === 'Enter' && (activeTab === 'public' ? sendPublicMessage() : sendPrivateMessage(messageText))} placeholder="Type a message..." className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" /><button onClick={() => activeTab === 'public' ? sendPublicMessage() : sendPrivateMessage(messageText)} disabled={uploading} className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl">{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white" />}</button></div>
                {uploadFile && <div className="mt-2 p-2 bg-emerald-500/20 rounded-lg flex justify-between"><span className="text-xs text-emerald-400">{uploadFile.name}</span><button onClick={() => setUploadFile(null)}><X className="w-3 h-3" /></button></div>}
              </div>
            </>
          ) : (<div className={`${isDarkMode ? 'bg-white/5' : 'bg-black/5'} rounded-2xl p-8 text-center border border-white/10`}><Logo size="xl" className="mx-auto mb-4" /><p className="text-gray-400">Select a chat room or user to start messaging</p></div>)}
        </div>
      </div>
    </div>
  )
}
