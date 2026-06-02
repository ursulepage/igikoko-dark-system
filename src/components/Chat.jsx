import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Send, Paperclip, Smile, Download, Trash2, Reply, Edit2, X, Loader2, 
  Phone, Video, Hash, Users, LogOut, Menu, Search, Moon, Sun, MessageCircle,
  Mic, MicOff, VideoOff, PhoneOff, Monitor, Maximize, Minimize,
  Image, FileText, Music, FileArchive, Eye, Play, Pause, Volume2,
  Check, CheckCheck, Clock, Bell, BellRing
} from 'lucide-react'
import { Logo } from './Logo'
import { EmojiPicker } from './EmojiPicker'

// ============================================
// CUSTOM SCROLLBAR CSS
// ============================================
const scrollbarStyles = `
  .custom-scroll::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  .custom-scroll::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
  }
  .custom-scroll::-webkit-scrollbar-thumb {
    background: rgba(16, 185, 129, 0.5);
    border-radius: 10px;
  }
  .custom-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(16, 185, 129, 0.8);
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = scrollbarStyles
  document.head.appendChild(style)
}

// ============================================
// FILE PREVIEW COMPONENT
// ============================================
function FilePreview({ fileUrl, fileName, onClose }) {
  const [isImage, setIsImage] = useState(false)
  const [isVideo, setIsVideo] = useState(false)
  const [isAudio, setIsAudio] = useState(false)
  const [isPdf, setIsPdf] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    setIsImage(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext))
    setIsVideo(['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext))
    setIsAudio(['mp3', 'wav', 'ogg', 'm4a', 'webm'].includes(ext))
    setIsPdf(ext === 'pdf')
  }, [fileName])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause()
      else audioRef.current.play()
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-4xl w-full max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isImage && <Image className="w-5 h-5 text-emerald-400" />}
            {isVideo && <Video className="w-5 h-5 text-emerald-400" />}
            {isAudio && <Music className="w-5 h-5 text-emerald-400" />}
            {isPdf && <FileText className="w-5 h-5 text-emerald-400" />}
            <span className="text-white font-medium truncate">{fileName}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          {isImage && <img src={fileUrl} alt={fileName} className="max-w-full max-h-[70vh] mx-auto rounded-lg" />}
          {isVideo && <video controls autoPlay className="max-w-full max-h-[70vh] mx-auto rounded-lg"><source src={fileUrl} /></video>}
          {isAudio && (
            <div className="text-center p-8">
              <div className="w-32 h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Music className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-white font-medium mb-4">{fileName}</h3>
              <audio ref={audioRef} src={fileUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
              <button onClick={togglePlay} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto hover:bg-emerald-600 transition">
                {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
              </button>
              <a href={fileUrl} download className="mt-4 inline-block text-emerald-400 text-sm hover:underline">Download file</a>
            </div>
          )}
          {isPdf && <iframe src={fileUrl} className="w-full h-[70vh] rounded-lg" title={fileName} />}
        </div>
      </div>
    </div>
  )
}

// ============================================
// AUDIO RECORDER COMPONENT
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
        const audioFile = new File([audioBlob], `recording_${Date.now()}.webm`, { type: 'audio/webm' })
        onRecordingComplete(audioFile)
        stream.getTracks().forEach(track => track.stop())
        setAudioChunks([])
      }
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch (err) { alert("Please allow microphone access to record audio") }
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

  const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}>
          <Mic className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">{isRecording ? 'Recording...' : 'Ready to Record'}</h3>
        {isRecording && <p className="text-3xl font-mono text-emerald-400 mb-4">{formatTime(recordingTime)}</p>}
        <div className="flex gap-3 justify-center">
          {!isRecording ? (
            <button onClick={startRecording} className="px-6 py-3 bg-emerald-500 rounded-xl text-white font-medium hover:bg-emerald-600 transition">Start Recording</button>
          ) : (
            <button onClick={stopRecording} className="px-6 py-3 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition">Stop & Send</button>
          )}
          <button onClick={onClose} className="px-6 py-3 bg-gray-700 rounded-xl text-white hover:bg-gray-600 transition">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// VIDEO CALL COMPONENT
// ============================================
function VideoCall({ onEndCall, currentUser, onAnswer, onDecline, isIncoming }) {
  const [localStream, setLocalStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const localVideoRef = useRef(null)

  useEffect(() => {
    if (!isIncoming) startCall()
    const timer = setInterval(() => setCallDuration(d => d + 1), 1000)
    return () => {
      clearInterval(timer)
      if (localStream) localStream.getTracks().forEach(track => track.stop())
    }
  }, [])

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setLocalStream(stream)
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
    } catch (err) { console.error("Camera error:", err) }
  }

  const toggleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream
        setIsSharingScreen(true)
      } else {
        setIsSharingScreen(false)
        if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream
      }
    } catch (err) { console.error("Screen share error:", err) }
  }

  const formatDuration = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

  if (isIncoming) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Phone className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl text-white font-bold mb-2">Incoming Video Call</h2>
          <p className="text-gray-400 mb-6">from <span className="text-emerald-400">{currentUser}</span></p>
          <div className="flex gap-4 justify-center">
            <button onClick={onAnswer} className="px-6 py-3 bg-emerald-500 rounded-xl text-white font-medium hover:bg-emerald-600 transition flex items-center gap-2"><Phone className="w-5 h-5" /> Answer</button>
            <button onClick={onDecline} className="px-6 py-3 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition flex items-center gap-2"><PhoneOff className="w-5 h-5" /> Decline</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="relative w-full max-w-6xl">
        <div className="bg-gray-900 rounded-2xl overflow-hidden aspect-video">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 bg-black/60 backdrop-blur-xl rounded-full p-3 shadow-2xl">
          <button onClick={() => { localStream?.getAudioTracks().forEach(t => t.enabled = !t.enabled); setIsMuted(!isMuted) }} className={`w-12 h-12 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-gray-700'}`}>
            {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </button>
          <button onClick={() => { localStream?.getVideoTracks().forEach(t => t.enabled = !t.enabled); setIsVideoOff(!isVideoOff) }} className={`w-12 h-12 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'}`}>
            {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
          </button>
          <button onClick={toggleScreenShare} className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center"><Monitor className="w-5 h-5 text-white" /></button>
          <button onClick={onEndCall} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse"><PhoneOff className="w-5 h-5 text-white" /></button>
        </div>
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-xl rounded-full px-4 py-2"><p className="text-white text-sm">Call with {currentUser} • {formatDuration(callDuration)}</p></div>
      </div>
    </div>
  )
}

// ============================================
// AUDIO CALL COMPONENT
// ============================================
function AudioCall({ onEndCall, currentUser, onAnswer, onDecline, isIncoming }) {
  const [duration, setDuration] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  if (isIncoming) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><Phone className="w-10 h-10 text-white" /></div>
          <h2 className="text-2xl text-white font-bold mb-2">Incoming Audio Call</h2>
          <p className="text-gray-400 mb-6">from <span className="text-emerald-400">{currentUser}</span></p>
          <div className="flex gap-4 justify-center">
            <button onClick={onAnswer} className="px-6 py-3 bg-emerald-500 rounded-xl text-white font-medium hover:bg-emerald-600 transition flex items-center gap-2"><Phone className="w-5 h-5" /> Answer</button>
            <button onClick={onDecline} className="px-6 py-3 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition flex items-center gap-2"><PhoneOff className="w-5 h-5" /> Decline</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-slate-900 backdrop-blur-xl z-50 flex items-center justify-center">
      <div className="text-center p-8 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 max-w-md w-full">
        <div className="w-28 h-28 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><Phone className="w-12 h-12 text-white" /></div>
        <h2 className="text-2xl text-white font-bold mb-2">Audio Call</h2>
        <p className="text-gray-400 mb-2">Call with <span className="text-emerald-400">{currentUser}</span></p>
        <p className="text-3xl text-emerald-400 font-mono mb-8">{formatTime(duration)}</p>
        <button onClick={onEndCall} className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse"><PhoneOff className="w-6 h-6 text-white" /></button>
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
  const [callType, setCallType] = useState('video')
  const [previewFile, setPreviewFile] = useState(null)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [lastReadTimes, setLastReadTimes] = useState({})
  const [publicMessagesChannel, setPublicMessagesChannel] = useState(null)
  const [privateMessagesChannel, setPrivateMessagesChannel] = useState(null)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const ADMIN_EMAIL = 'senyiblazi@gmail.com'
  const isAdminUser = session.user?.email === ADMIN_EMAIL

  // Load unread counts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`unread_${session.user.id}`)
    if (saved) setUnreadCounts(JSON.parse(saved))
    const savedTimes = localStorage.getItem(`lastRead_${session.user.id}`)
    if (savedTimes) setLastReadTimes(JSON.parse(savedTimes))
  }, [session.user.id])

  // Save unread counts
  useEffect(() => {
    localStorage.setItem(`unread_${session.user.id}`, JSON.stringify(unreadCounts))
  }, [unreadCounts, session.user.id])

  useEffect(() => {
    localStorage.setItem(`lastRead_${session.user.id}`, JSON.stringify(lastReadTimes))
  }, [lastReadTimes, session.user.id])

  // Mark conversation as read
  const markAsRead = (conversationId, type) => {
    const key = `${type}_${conversationId}`
    setUnreadCounts(prev => ({ ...prev, [key]: 0 }))
    setLastReadTimes(prev => ({ ...prev, [key]: Date.now() }))
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) setSidebarOpen(false)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadRooms()
    loadUsers()
    loadPrivateChats()
    setupRealtimeSubscriptions()
    
    // Cleanup on unmount
    return () => {
      if (publicMessagesChannel) supabase.removeChannel(publicMessagesChannel)
      if (privateMessagesChannel) supabase.removeChannel(privateMessagesChannel)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'public' && currentRoom) {
      loadPublicMessages(currentRoom.id)
      markAsRead(currentRoom.id, 'public')
    }
  }, [currentRoom, activeTab])

  useEffect(() => {
    if (activeTab === 'private' && privateChatUser) {
      loadPrivateMessages(privateChatUser.id)
      markAsRead(privateChatUser.id, 'private')
    }
  }, [privateChatUser, activeTab])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const setupRealtimeSubscriptions = async () => {
    // Clean up existing channels
    if (publicMessagesChannel) await supabase.removeChannel(publicMessagesChannel)
    if (privateMessagesChannel) await supabase.removeChannel(privateMessagesChannel)

    // Public channel for real-time messages - ADD EVENTS BEFORE SUBSCRIBE
    const publicRealtime = supabase
      .channel('public-messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        (payload) => {
          const newMsg = payload.new
          setMessages(prev => [...prev, newMsg])
          if (currentRoom?.id === newMsg.room_id && newMsg.user_id !== session.user.id) {
            // Already in this room, message appears
          } else if (newMsg.user_id !== session.user.id) {
            const key = `public_${newMsg.room_id}`
            setUnreadCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
          }
        }
      )
    
    // Subscribe AFTER adding events
    publicRealtime.subscribe()
    setPublicMessagesChannel(publicRealtime)

    // Private messages via broadcast - ADD EVENTS BEFORE SUBSCRIBE
    const privateRealtime = supabase
      .channel('private-messages')
      .on('broadcast', { event: 'private-message' }, (payload) => {
        const { message, fromUserId, toUserId } = payload.payload
        if (toUserId === session.user.id) {
          if (privateChatUser?.id === fromUserId) {
            setMessages(prev => [...prev, message])
          }
          const key = `private_${fromUserId}`
          if (privateChatUser?.id !== fromUserId) {
            setUnreadCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
          }
          // Save to localStorage
          const storageKey = [session.user.id, fromUserId].sort().join('-')
          const stored = JSON.parse(localStorage.getItem(`privchat_${storageKey}`) || '[]')
          localStorage.setItem(`privchat_${storageKey}`, JSON.stringify([...stored, message]))
        }
      })
      .on('broadcast', { event: 'call-request' }, (payload) => {
        const { from, type } = payload.payload
        if (from !== session.user.id) {
          setIncomingCall({ from, type, fromUser: users.find(u => u.id === from) })
        }
      })
    
    // Subscribe AFTER adding events
    privateRealtime.subscribe()
    setPrivateMessagesChannel(privateRealtime)
  }

  async function loadRooms() {
    const { data } = await supabase.from('chat_rooms').select('*').eq('is_private', false).order('created_at')
    if (data && data.length > 0) {
      setRooms(data)
      if (!currentRoom) setCurrentRoom(data[0])
    } else {
      const { data: newRoom } = await supabase.from('chat_rooms').insert([{ name: 'General', is_private: false }]).select()
      if (newRoom) { setRooms(newRoom); setCurrentRoom(newRoom[0]) }
    }
  }

  async function loadUsers() {
    const { data } = await supabase.from('users').select('*')
    if (data) setUsers(data.filter(u => u.id !== session.user.id))
  }

  async function loadPrivateChats() {
    const { data } = await supabase.from('users').select('*')
    if (data) setUsers(data.filter(u => u.id !== session.user.id))
  }

  async function loadPublicMessages(roomId) {
    const { data } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true }).limit(200)
    if (data) setMessages(data)
  }

  async function loadPrivateMessages(userId) {
    const key = [session.user.id, userId].sort().join('-')
    const stored = localStorage.getItem(`privchat_${key}`)
    setMessages(stored ? JSON.parse(stored) : [])
  }

  const sendPrivateMessageRealTime = async (text) => {
    if (!text.trim() || !privateChatUser) return
    
    const newMsg = {
      id: Date.now(),
      user_id: session.user.id,
      message: text,
      created_at: new Date().toISOString(),
      file_url: null,
      file_name: null
    }
    
    setMessages(prev => [...prev, newMsg])
    
    // Send via broadcast
    if (privateMessagesChannel) {
      await privateMessagesChannel.send({
        type: 'broadcast',
        event: 'private-message',
        payload: { message: newMsg, fromUserId: session.user.id, toUserId: privateChatUser.id }
      })
    }
    
    // Store in localStorage
    const key = [session.user.id, privateChatUser.id].sort().join('-')
    const stored = JSON.parse(localStorage.getItem(`privchat_${key}`) || '[]')
    localStorage.setItem(`privchat_${key}`, JSON.stringify([...stored, newMsg]))
    setMessageText('')
  }

  async function uploadAndSendFile(file, isPrivate = false) {
    if (!file) return
    setUploading(true)
    const roomId = isPrivate ? 'private' : currentRoom?.id
    const filePath = `uploads/${roomId}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('projects').upload(filePath, file)
    
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('projects').getPublicUrl(filePath)
      if (isPrivate) {
        const newMsg = {
          id: Date.now(),
          user_id: session.user.id,
          message: `📎 ${file.name}`,
          created_at: new Date().toISOString(),
          file_url: publicUrl,
          file_name: file.name
        }
        setMessages(prev => [...prev, newMsg])
        if (privateMessagesChannel) {
          await privateMessagesChannel.send({
            type: 'broadcast',
            event: 'private-message',
            payload: { message: newMsg, fromUserId: session.user.id, toUserId: privateChatUser.id }
          })
        }
        const key = [session.user.id, privateChatUser.id].sort().join('-')
        const stored = JSON.parse(localStorage.getItem(`privchat_${key}`) || '[]')
        localStorage.setItem(`privchat_${key}`, JSON.stringify([...stored, newMsg]))
      } else {
        await supabase.from('messages').insert([{ 
          user_id: session.user.id, room_id: currentRoom.id, 
          message: `📎 ${file.name}`, file_url: publicUrl, file_name: file.name 
        }])
      }
    }
    setUploading(false)
    setUploadFile(null)
  }

  async function sendPublicMessage(fileUrl = null, fileName = null) {
    if ((!messageText.trim() && !uploadFile && !fileUrl) || !currentRoom) return
    
    if (uploadFile && !fileUrl) {
      await uploadAndSendFile(uploadFile, false)
      setUploadFile(null)
      setMessageText('')
      return
    }
    
    const messageData = { 
      user_id: session.user.id, room_id: currentRoom.id, 
      message: messageText || (fileUrl ? `📎 ${fileName}` : ''), 
      file_url: fileUrl, file_name: fileName 
    }
    if (replyTo) messageData.reply_to = replyTo.id
    if (editMessage) {
      await supabase.from('messages').update({ message: messageText, edited: true }).eq('id', editMessage.id)
      setEditMessage(null)
    } else if (messageText.trim() || fileUrl) {
      await supabase.from('messages').insert([messageData])
    }
    setMessageText(''); setReplyTo(null)
  }

  async function deleteMessage(messageId) {
    if (confirm('Delete this message?')) {
      if (activeTab === 'public') {
        await supabase.from('messages').delete().eq('id', messageId)
      } else {
        const updated = messages.filter(m => m.id !== messageId)
        setMessages(updated)
        const key = [session.user.id, privateChatUser.id].sort().join('-')
        localStorage.setItem(`privchat_${key}`, JSON.stringify(updated))
      }
    }
  }

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    setIsTyping(true)
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000)
  }

  const startVideoCall = (user) => {
    setCallWith(user)
    setCallType('video')
    setIsVideoCall(true)
    if (privateMessagesChannel) {
      privateMessagesChannel.send({
        type: 'broadcast',
        event: 'call-request',
        payload: { from: session.user.id, to: user.id, type: 'video' }
      })
    }
  }

  const startAudioCall = (user) => {
    setCallWith(user)
    setCallType('audio')
    setIsAudioCall(true)
    if (privateMessagesChannel) {
      privateMessagesChannel.send({
        type: 'broadcast',
        event: 'call-request',
        payload: { from: session.user.id, to: user.id, type: 'audio' }
      })
    }
  }

  const answerCall = () => {
    setIsVideoCall(true)
    setIsAudioCall(true)
    setIncomingCall(null)
  }

  const declineCall = () => {
    setIncomingCall(null)
  }

  const endCall = () => {
    setIsVideoCall(false)
    setIsAudioCall(false)
    setCallWith(null)
  }

  const handleAudioRecordingComplete = async (audioFile) => {
    if (activeTab === 'public') {
      await uploadAndSendFile(audioFile, false)
    } else {
      await uploadAndSendFile(audioFile, true)
    }
    setShowAudioRecorder(false)
  }

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image className="w-4 h-4 text-emerald-400" />
    if (['mp4', 'webm', 'avi'].includes(ext)) return <Video className="w-4 h-4 text-emerald-400" />
    if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music className="w-4 h-4 text-emerald-400" />
    if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-emerald-400" />
    return <FileArchive className="w-4 h-4 text-emerald-400" />
  }

  const getUserName = (userId) => users.find(u => u.id === userId)?.username || userId?.slice(0, 8)
  const getUserAvatar = (userId) => `https://ui-avatars.com/api/?name=${getUserName(userId)}&background=10b981&color=fff`
  const getCurrentUserName = () => users.find(u => u.id === session.user.id)?.username || session.user.email?.split('@')[0] || 'User'
  const filteredUsers = users.filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase()))

  const renderFileContent = (msg) => {
    if (!msg.file_url) return null
    const ext = msg.file_name?.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return (
        <div className="mt-2">
          <img src={msg.file_url} alt={msg.file_name} className="max-w-[200px] max-h-[150px] rounded-lg cursor-pointer hover:opacity-90 transition" onClick={() => setPreviewFile({ url: msg.file_url, name: msg.file_name })} />
        </div>
      )
    }
    
    if (['mp3', 'wav', 'ogg'].includes(ext)) {
      return (
        <div className="mt-2 flex items-center gap-2 bg-black/30 rounded-lg p-2">
          <Music className="w-4 h-4 text-emerald-400" />
          <audio controls className="h-8 max-w-[200px]">
            <source src={msg.file_url} />
          </audio>
        </div>
      )
    }
    
    return (
      <button onClick={() => setPreviewFile({ url: msg.file_url, name: msg.file_name })} className="mt-2 flex items-center gap-2 text-xs bg-black/30 rounded-lg px-2 py-1 hover:bg-black/50 transition">
        {getFileIcon(msg.file_name)} <span className="truncate max-w-[150px]">{msg.file_name}</span> <Eye className="w-3 h-3" />
      </button>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950' : 'bg-gradient-to-br from-gray-100 via-purple-100 to-gray-100'}`}>
      {isVideoCall && callWith && <VideoCall onEndCall={endCall} currentUser={callWith.username} callType="video" />}
      {isAudioCall && callWith && <AudioCall onEndCall={endCall} currentUser={callWith.username} />}
      {incomingCall && (
        incomingCall.type === 'video' ? 
          <VideoCall isIncoming={true} currentUser={incomingCall.fromUser?.username} onAnswer={answerCall} onDecline={declineCall} /> :
          <AudioCall isIncoming={true} currentUser={incomingCall.fromUser?.username} onAnswer={answerCall} onDecline={declineCall} />
      )}
      {previewFile && <FilePreview fileUrl={previewFile.url} fileName={previewFile.name} onClose={() => setPreviewFile(null)} />}
      {showAudioRecorder && <AudioRecorder onRecordingComplete={handleAudioRecordingComplete} onClose={() => setShowAudioRecorder(false)} />}

      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 z-30 p-2 bg-white/10 backdrop-blur-xl rounded-xl md:hidden">
          <Menu className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full ${isDarkMode ? 'bg-black/60 backdrop-blur-2xl' : 'bg-white/60 backdrop-blur-2xl'} border-r border-white/10 transition-all duration-300 z-20 ${sidebarOpen ? 'w-80' : '-translate-x-full md:translate-x-0 md:w-20'} overflow-y-auto custom-scroll`}>
        <div className="p-5 flex justify-between items-center border-b border-white/10 sticky top-0 bg-inherit">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <span className={`font-bold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>IGIKOKO</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="p-3">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="flex gap-2 mb-4 bg-black/30 rounded-xl p-1">
            <button onClick={() => { setActiveTab('public'); setPrivateChatUser(null); setMessages([]); markAsRead(currentRoom?.id, 'public') }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'public' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'text-gray-400'}`}>
              <Hash className="w-4 h-4 inline mr-1" /> Public
            </button>
            <button onClick={() => { setActiveTab('private'); setCurrentRoom(null); setMessages([]) }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'private' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'text-gray-400'}`}>
              <Users className="w-4 h-4 inline mr-1" /> Private
            </button>
          </div>

          {activeTab === 'public' && (
            <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scroll">
              <h3 className="text-xs text-gray-400 px-3 py-2">CHAT ROOMS</h3>
              {rooms.map(room => {
                const unread = unreadCounts[`public_${room.id}`] || 0
                return (
                  <button 
                    key={room.id} 
                    onClick={() => { setCurrentRoom(room); markAsRead(room.id, 'public') }} 
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${currentRoom?.id === room.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-gray-400 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Hash className="w-5 h-5" />
                      {sidebarOpen && <span>{room.name}</span>}
                    </div>
                    {unread > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{unread}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {activeTab === 'private' && (
            <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scroll">
              <h3 className="text-xs text-gray-400 px-3 py-2">USERS - CLICK TO CHAT</h3>
              {filteredUsers.map(user => {
                const unread = unreadCounts[`private_${user.id}`] || 0
                return (
                  <div key={user.id} className="flex items-center gap-2 mb-1">
                    <button 
                      onClick={() => { setPrivateChatUser(user); markAsRead(user.id, 'private') }} 
                      className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${privateChatUser?.id === user.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-gray-400 hover:bg-white/10'}`}
                    >
                      <img src={getUserAvatar(user.id)} className="w-8 h-8 rounded-full" />
                      {sidebarOpen && (
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.username}</p>
                            {unread > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">{unread}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      )}
                    </button>
                    {sidebarOpen && (
                      <div className="flex gap-1">
                        <button onClick={() => startVideoCall(user)} className="p-2 bg-emerald-500/20 rounded-lg hover:bg-emerald-500/30 transition" title="Video Call"><Video className="w-4 h-4 text-emerald-400" /></button>
                        <button onClick={() => startAudioCall(user)} className="p-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition" title="Audio Call"><Phone className="w-4 h-4 text-purple-400" /></button>
                      </div>
                    )}
                  </div>
                )
              })}
              {filteredUsers.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No users found</p>}
            </div>
          )}

          <button onClick={onToggleTheme} className="w-full flex items-center gap-3 px-3 py-3 mt-4 rounded-xl text-gray-400 hover:bg-white/10">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            {sidebarOpen && <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-inherit">
          <div className="flex items-center gap-3">
            <img src={getUserAvatar(session.user.id)} className="w-10 h-10 rounded-full ring-2 ring-emerald-500" />
            {sidebarOpen && (
              <div className="flex-1">
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getCurrentUserName()}</p>
                <p className="text-gray-400 text-xs">{session.user.email}</p>
                {isAdminUser && <span className="text-xs text-emerald-500">Admin</span>}
              </div>
            )}
            <button onClick={onLogout} className="text-gray-400 hover:text-red-400"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className={`transition-all duration-300 ${sidebarOpen && !isMobile ? 'ml-80' : 'ml-0 md:ml-20'}`}>
        <div className="p-4 md:p-6 pb-24 md:pb-6">
          {(activeTab === 'public' && currentRoom) || (activeTab === 'private' && privateChatUser) ? (
            <>
              <div className={`${isDarkMode ? 'bg-white/5' : 'bg-black/5'} backdrop-blur-2xl rounded-2xl p-4 border border-white/10 mb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {activeTab === 'public' ? (
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center"><Hash className="w-6 h-6 text-white" /></div>
                    ) : (
                      <img src={getUserAvatar(privateChatUser.id)} className="w-12 h-12 rounded-full ring-2 ring-emerald-500" />
                    )}
                    <div>
                      <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{activeTab === 'public' ? currentRoom.name : privateChatUser.username}</h2>
                      <p className="text-gray-400 text-sm">{activeTab === 'public' ? 'Public Channel • Real-time' : 'Private Chat • Real-time • Encrypted'}</p>
                    </div>
                  </div>
                  {activeTab === 'private' && privateChatUser && (
                    <div className="flex gap-2">
                      <button onClick={() => startVideoCall(privateChatUser)} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white text-sm flex items-center gap-2 hover:from-emerald-600 hover:to-teal-700 transition shadow-md"><Video className="w-4 h-4" /> Video Call</button>
                      <button onClick={() => startAudioCall(privateChatUser)} className="px-4 py-2 bg-purple-500/20 rounded-xl text-purple-400 text-sm flex items-center gap-2 hover:bg-purple-500/30 transition"><Phone className="w-4 h-4" /> Audio Call</button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`${isDarkMode ? 'bg-black/40' : 'bg-white/40'} backdrop-blur-2xl rounded-2xl border border-white/10 mb-4 overflow-hidden`}>
                <div className="h-[450px] overflow-y-auto p-4 space-y-3 custom-scroll">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center"><MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No messages yet</p><p className="text-xs mt-1">Start the conversation!</p></div>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 group ${msg.user_id === session.user.id ? 'flex-row-reverse' : ''} animate-fadeIn`}>
                      <img src={getUserAvatar(msg.user_id)} className="w-8 h-8 rounded-full" />
                      <div className={`max-w-[70%] rounded-2xl p-3 relative ${msg.user_id === session.user.id ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                        {msg.user_id !== session.user.id && <p className="text-xs text-emerald-400 mb-1 font-semibold">{getUserName(msg.user_id)}</p>}
                        {msg.reply_to && <div className="text-xs opacity-70 mb-1 border-l-2 border-emerald-400 pl-2">↩️ Replying to message</div>}
                        <p className="text-sm break-words">{msg.message}</p>
                        {renderFileContent(msg)}
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] opacity-50">{new Date(msg.created_at).toLocaleTimeString()}</p>
                          {msg.user_id === session.user.id && <CheckCheck className="w-3 h-3 text-emerald-400" />}
                        </div>
                        <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                          <button onClick={() => setReplyTo(msg)} className="bg-gray-700 rounded-full p-1"><Reply className="w-3 h-3 text-white" /></button>
                          {msg.user_id === session.user.id && <button onClick={() => { setEditMessage(msg); setMessageText(msg.message) }} className="bg-gray-700 rounded-full p-1"><Edit2 className="w-3 h-3 text-white" /></button>}
                        </div>
                        {(msg.user_id === session.user.id || isAdminUser) && (
                          <button onClick={() => deleteMessage(msg.id)} className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 rounded-full p-1"><Trash2 className="w-3 h-3 text-white" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              <div className="fixed bottom-0 left-0 right-0 md:relative bg-white/5 backdrop-blur-2xl rounded-t-2xl md:rounded-2xl p-3 border-t md:border border-white/10">
                {replyTo && (
                  <div className="mb-2 p-2 bg-emerald-500/20 rounded-lg flex justify-between">
                    <span className="text-xs text-emerald-400">Replying to: {replyTo.message?.slice(0, 50)}</span>
                    <button onClick={() => setReplyTo(null)}><X className="w-3 h-3" /></button>
                  </div>
                )}
                {editMessage && (
                  <div className="mb-2 p-2 bg-yellow-500/20 rounded-lg flex justify-between">
                    <span className="text-xs text-yellow-400">Editing...</span>
                    <button onClick={() => { setEditMessage(null); setMessageText('') }}><X className="w-3 h-3" /></button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="file" ref={fileInputRef} onChange={(e) => setUploadFile(e.target.files[0])} className="hidden" multiple />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition" title="Attach file"><Paperclip className="w-5 h-5 text-gray-400" /></button>
                  <button onClick={() => setShowAudioRecorder(true)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition" title="Record Audio"><Mic className="w-5 h-5 text-gray-400" /></button>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 relative">
                    <Smile className="w-5 h-5 text-gray-400" />
                    {showEmojiPicker && <EmojiPicker onSelectEmoji={(e) => setMessageText(prev => prev + e)} onClose={() => setShowEmojiPicker(false)} />}
                  </button>
                  <input type="text" value={messageText} onChange={(e) => { setMessageText(e.target.value); handleTyping() }} onKeyPress={(e) => e.key === 'Enter' && (activeTab === 'public' ? sendPublicMessage() : sendPrivateMessageRealTime(messageText))} placeholder="Type a message..." className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button onClick={() => activeTab === 'public' ? sendPublicMessage() : sendPrivateMessageRealTime(messageText)} disabled={uploading} className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition">{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white" />}</button>
                </div>
                {isTyping && <p className="text-xs text-emerald-400 mt-2 animate-pulse">Someone is typing...</p>}
                {uploadFile && (
                  <div className="mt-2 p-2 bg-emerald-500/20 rounded-lg flex justify-between">
                    <div className="flex items-center gap-2">{getFileIcon(uploadFile.name)}<span className="text-xs text-emerald-400">{uploadFile.name}</span></div>
                    <button onClick={() => setUploadFile(null)}><X className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`${isDarkMode ? 'bg-white/5' : 'bg-black/5'} backdrop-blur-2xl rounded-2xl p-8 text-center border border-white/10 mb-4`}>
              <Logo size="xl" className="mx-auto mb-4" />
              <p className="text-gray-400">Select a chat room or user to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}