import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Send, Paperclip, Smile, Download, Trash2, Reply, Edit2, X, Loader2, 
  Phone, Video, Hash, Users, LogOut, Menu, Search, Moon, Sun, MessageCircle,
  Mic, MicOff, VideoOff, PhoneOff, Monitor, Maximize, Minimize, Camera,
  Share2, Volume2, VolumeX, Plus, Minus, User, Settings, Bell, Grid3x3, List,
  Image, FileText, Music, FileArchive, Eye, Play, Pause, Volume1, Volume2 as VolumeIcon,
  Mic as MicIcon, Square, Clock, Record
} from 'lucide-react'

// ============================================
// LOGO COMPONENT
// ============================================
function Logo({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  
  return (
    <div className={`relative ${className}`}>
      <img 
        src="/inyamaswa.png" 
        alt="IGIKOKO Logo" 
        className={`${sizeClasses[size]} object-contain rounded-xl`}
        onError={(e) => {
          e.target.onerror = null
          e.target.src = `https://ui-avatars.com/api/?name=IGIKOKO&background=0ea5e9&color=fff`
        }}
      />
    </div>
  )
}

// ============================================
// EMOJI PICKER COMPONENT
// ============================================
function EmojiPicker({ onSelectEmoji, onClose }) {
  const emojis = ['😀', '😂', '🥰', '😎', '🤔', '😭', '😡', '🥳', '👍', '❤️', '🔥', '🎉', '✨', '💀', '👀', '🙏']

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-2xl p-3 shadow-2xl z-50 w-64">
      <div className="grid grid-cols-8 gap-1">
        {emojis.map(emoji => (
          <button
            key={emoji}
            onClick={() => {
              onSelectEmoji(emoji)
              onClose()
            }}
            className="w-8 h-8 hover:bg-gray-700 rounded-lg text-xl transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

// ============================================
// FILE PREVIEW COMPONENT
// ============================================
function FilePreview({ fileUrl, fileName, onClose }) {
  const [isImage, setIsImage] = useState(false)
  const [isVideo, setIsVideo] = useState(false)
  const [isAudio, setIsAudio] = useState(false)
  const [isPdf, setIsPdf] = useState(false)
  const [isZip, setIsZip] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    setIsImage(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext))
    setIsVideo(['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext))
    setIsAudio(['mp3', 'wav', 'ogg', 'm4a'].includes(ext))
    setIsPdf(ext === 'pdf')
    setIsZip(['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
  }, [fileName])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
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
            {isZip && <FileArchive className="w-5 h-5 text-emerald-400" />}
            <span className="text-white font-medium truncate">{fileName}</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {isImage && (
            <img src={fileUrl} alt={fileName} className="max-w-full max-h-[70vh] mx-auto rounded-lg" />
          )}
          
          {isVideo && (
            <video controls autoPlay className="max-w-full max-h-[70vh] mx-auto rounded-lg">
              <source src={fileUrl} />
              Your browser does not support video.
            </video>
          )}
          
          {isAudio && (
            <div className="text-center p-8">
              <div className="w-32 h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Music className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-white font-medium mb-4">{fileName}</h3>
              <audio ref={audioRef} src={fileUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
              <button 
                onClick={togglePlay}
                className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto hover:bg-emerald-600 transition"
              >
                {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white" />}
              </button>
              <a href={fileUrl} download className="mt-4 inline-block text-emerald-400 text-sm hover:underline">
                Download file
              </a>
            </div>
          )}
          
          {isPdf && (
            <iframe src={fileUrl} className="w-full h-[70vh] rounded-lg" title={fileName} />
          )}
          
          {isZip && (
            <div className="text-center p-8">
              <div className="w-32 h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileArchive className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-white font-medium mb-2">{fileName}</h3>
              <p className="text-gray-400 text-sm mb-4">Archive file - Download to extract</p>
              <a 
                href={fileUrl} 
                download 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition"
              >
                <Download className="w-5 h-5" /> Download File
              </a>
            </div>
          )}
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
      
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
        setAudioChunks([...audioChunks])
      }
      
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
      
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    } catch (err) {
      console.error("Microphone error:", err)
      alert("Please allow microphone access to record audio")
    }
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full text-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}>
          <MicIcon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2">
          {isRecording ? 'Recording...' : 'Ready to Record'}
        </h3>
        {isRecording && (
          <p className="text-3xl font-mono text-emerald-400 mb-4">{formatTime(recordingTime)}</p>
        )}
        <div className="flex gap-3 justify-center">
          {!isRecording ? (
            <button onClick={startRecording} className="px-6 py-3 bg-emerald-500 rounded-xl text-white font-medium hover:bg-emerald-600 transition">
              Start Recording
            </button>
          ) : (
            <button onClick={stopRecording} className="px-6 py-3 bg-red-500 rounded-xl text-white font-medium hover:bg-red-600 transition">
              Stop & Send
            </button>
          )}
          <button onClick={onClose} className="px-6 py-3 bg-gray-700 rounded-xl text-white hover:bg-gray-600 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// VIDEO CALL COMPONENT
// ============================================
function VideoCall({ onEndCall, currentUser, callType }) {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const screenVideoRef = useRef(null)

  useEffect(() => {
    startCall()
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
        if (screenVideoRef.current) screenVideoRef.current.srcObject = screenStream
        screenStream.getVideoTracks()[0].onended = () => {
          setIsSharingScreen(false)
          if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream
        }
        setIsSharingScreen(true)
      } else {
        setIsSharingScreen(false)
        if (screenVideoRef.current) screenVideoRef.current.srcObject = null
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

  const toggleFullscreen = () => {
    if (!isFullscreen) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
    setIsFullscreen(!isFullscreen)
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

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
                <p className="text-gray-400">Waiting for {currentUser} to join...</p>
                <p className="text-sm text-gray-500 mt-2">{formatDuration(callDuration)}</p>
              </div>
            </div>
          )}
        </div>

        {isSharingScreen && (
          <div className="absolute top-4 left-4 w-80 h-60 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-emerald-500 z-10">
            <video ref={screenVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-black/50 rounded-lg px-2 py-1 text-xs text-white">Screen Share</div>
          </div>
        )}

        <div className="absolute bottom-24 right-4 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-emerald-500 cursor-pointer hover:scale-105 transition-transform">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-600" />
            </div>
          )}
          {isMuted && (
            <div className="absolute bottom-2 left-2 bg-red-500 rounded-full p-1">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-xl rounded-full px-4 py-2">
          <p className="text-white text-sm">{callType === 'video' ? '📹 Video Call' : '🎙️ Audio Call'} • {formatDuration(callDuration)}</p>
        </div>

        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 bg-black/60 backdrop-blur-xl rounded-full p-3 shadow-2xl">
          <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
            {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
          </button>
          {callType === 'video' && (
            <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
              {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
            </button>
          )}
          {callType === 'video' && (
            <button onClick={toggleScreenShare} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSharingScreen ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
              <Monitor className="w-5 h-5 text-white" />
            </button>
          )}
          <button onClick={onEndCall} className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all animate-pulse shadow-lg">
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
          <button onClick={toggleFullscreen} className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-all">
            {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
          </button>
        </div>

        <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-xl rounded-full px-4 py-2">
          <p className="text-emerald-400 text-sm">Calling {currentUser}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// AUDIO CALL COMPONENT
// ============================================
function AudioCall({ onEndCall, currentUser }) {
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
  const [channel, setChannel] = useState(null)
  const [isVideoCall, setIsVideoCall] = useState(false)
  const [isAudioCall, setIsAudioCall] = useState(false)
  const [callWith, setCallWith] = useState(null)
  const [callType, setCallType] = useState('video')
  const [previewFile, setPreviewFile] = useState(null)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const ADMIN_EMAIL = 'senyiblazi@gmail.com'
  const isAdminUser = session.user?.email === ADMIN_EMAIL

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
  }, [])

  useEffect(() => {
    if (activeTab === 'public' && currentRoom) {
      loadPublicMessages(currentRoom.id)
      subscribeToRoom(currentRoom.id)
    }
  }, [currentRoom, activeTab])

  useEffect(() => {
    if (activeTab === 'private' && privateChatUser) {
      loadPrivateMessages(privateChatUser.id)
    }
  }, [privateChatUser, activeTab])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const subscribeToRoom = async (roomId) => {
    if (channel) await supabase.removeChannel(channel)
    
    const newChannel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, 
        (payload) => setMessages(prev => [...prev, payload.new])
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'messages' }, 
        (payload) => setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      )
      .subscribe()
    
    setChannel(newChannel)
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

  async function loadPublicMessages(roomId) {
    const { data } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true }).limit(200)
    if (data) setMessages(data)
  }

  async function loadPrivateMessages(userId) {
    const key = [session.user.id, userId].sort().join('-')
    const stored = localStorage.getItem(`privchat_${key}`)
    setMessages(stored ? JSON.parse(stored) : [])
  }

  async function uploadAndSendFile(file) {
    if (!file) return
    
    setUploading(true)
    const filePath = `uploads/${currentRoom?.id || 'private'}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('projects').upload(filePath, file)
    
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('projects').getPublicUrl(filePath)
      await sendPublicMessage(publicUrl, file.name)
    }
    setUploading(false)
    setUploadFile(null)
  }

  async function sendPublicMessage(fileUrl = null, fileName = null) {
    if ((!messageText.trim() && !uploadFile && !fileUrl) || !currentRoom) return
    
    let finalFileUrl = fileUrl, finalFileName = fileName
    
    if (uploadFile && !fileUrl) {
      await uploadAndSendFile(uploadFile)
      setUploadFile(null)
      setMessageText('')
      return
    }
    
    const messageData = { 
      user_id: session.user.id, 
      room_id: currentRoom.id, 
      message: messageText || (finalFileUrl ? `📎 ${finalFileName}` : ''), 
      file_url: finalFileUrl, 
      file_name: finalFileName 
    }
    if (replyTo) messageData.reply_to = replyTo.id
    if (editMessage) {
      await supabase.from('messages').update({ message: messageText, edited: true }).eq('id', editMessage.id)
      setEditMessage(null)
    } else if (messageText.trim() || finalFileUrl) {
      await supabase.from('messages').insert([messageData])
    }
    
    setMessageText('')
    setReplyTo(null)
  }

  async function sendPrivateMessage() {
    if (!messageText.trim() || !privateChatUser) return
    
    const newMsg = {
      id: Date.now(),
      user_id: session.user.id,
      message: messageText,
      created_at: new Date().toISOString(),
      receiverId: privateChatUser.id
    }
    
    const updatedMessages = [...messages, newMsg]
    setMessages(updatedMessages)
    const key = [session.user.id, privateChatUser.id].sort().join('-')
    localStorage.setItem(`privchat_${key}`, JSON.stringify(updatedMessages))
    setMessageText('')
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

  async function downloadFile(url, name) {
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
  }

  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    setIsTyping(true)
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000)
  }

  const startVideoCall = (user) => {
    setCallWith(user.username)
    setCallType('video')
    setIsVideoCall(true)
  }

  const startAudioCall = (user) => {
    setCallWith(user.username)
    setCallType('audio')
    setIsAudioCall(true)
  }

  const endCall = () => {
    setIsVideoCall(false)
    setIsAudioCall(false)
    setCallWith(null)
  }

  const handleAudioRecordingComplete = async (audioFile) => {
    await uploadAndSendFile(audioFile)
    setShowAudioRecorder(false)
  }

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <Image className="w-4 h-4 text-emerald-400" />
    if (['mp4', 'webm', 'avi'].includes(ext)) return <Video className="w-4 h-4 text-emerald-400" />
    if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music className="w-4 h-4 text-emerald-400" />
    if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-emerald-400" />
    if (['zip', 'rar', '7z'].includes(ext)) return <FileArchive className="w-4 h-4 text-emerald-400" />
    return <Paperclip className="w-4 h-4 text-emerald-400" />
  }

  const getUserName = (userId) => users.find(u => u.id === userId)?.username || userId?.slice(0, 8)
  const getUserAvatar = (userId) => `https://ui-avatars.com/api/?name=${getUserName(userId)}&background=0ea5e9&color=fff`
  const getCurrentUserName = () => users.find(u => u.id === session.user.id)?.username || session.user.email?.split('@')[0] || 'User'
  const filteredUsers = users.filter(u => u.username?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950' : 'bg-gradient-to-br from-gray-100 via-purple-100 to-gray-100'}`}>
      {isVideoCall && <VideoCall onEndCall={endCall} currentUser={callWith} callType="video" />}
      {isAudioCall && <AudioCall onEndCall={endCall} currentUser={callWith} />}
      {previewFile && <FilePreview fileUrl={previewFile.url} fileName={previewFile.name} onClose={() => setPreviewFile(null)} />}
      {showAudioRecorder && <AudioRecorder onRecordingComplete={handleAudioRecordingComplete} onClose={() => setShowAudioRecorder(false)} />}

      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 z-30 p-2 bg-white/10 backdrop-blur-xl rounded-xl md:hidden">
          <Menu className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full ${isDarkMode ? 'bg-black/60 backdrop-blur-2xl' : 'bg-white/60 backdrop-blur-2xl'} border-r border-white/10 transition-all duration-300 z-20 ${sidebarOpen ? 'w-80' : '-translate-x-full md:translate-x-0 md:w-20'} overflow-y-auto`}>
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
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div className="flex gap-2 mb-4 bg-black/30 rounded-xl p-1">
            <button onClick={() => { setActiveTab('public'); setPrivateChatUser(null) }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'public' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'text-gray-400'}`}>
              <Hash className="w-4 h-4 inline mr-1" /> Public
            </button>
            <button onClick={() => { setActiveTab('private'); setCurrentRoom(null) }} className={`flex-1 py-2 rounded-lg text-sm font-medium ${activeTab === 'private' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'text-gray-400'}`}>
              <Users className="w-4 h-4 inline mr-1" /> Private
            </button>
          </div>

          {activeTab === 'public' && (
            <div className="space-y-1">
              <h3 className="text-xs text-gray-400 px-3 py-2">CHAT ROOMS</h3>
              {rooms.map(room => (
                <button key={room.id} onClick={() => setCurrentRoom(room)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${currentRoom?.id === room.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-gray-400 hover:bg-white/10'}`}>
                  <Hash className="w-5 h-5" />
                  {sidebarOpen && <span>{room.name}</span>}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'private' && (
            <div className="space-y-1">
              <h3 className="text-xs text-gray-400 px-3 py-2">USERS - CLICK TO CHAT</h3>
              {filteredUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setPrivateChatUser(user)}
                    className={`flex-1 flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${privateChatUser?.id === user.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'text-gray-400 hover:bg-white/10'}`}
                  >
                    <img src={getUserAvatar(user.id)} className="w-8 h-8 rounded-full" />
                    {sidebarOpen && (
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    )}
                  </button>
                  {sidebarOpen && (
                    <div className="flex gap-1">
                      <button onClick={() => startVideoCall(user)} className="p-2 bg-emerald-500/20 rounded-lg hover:bg-emerald-500/30 transition" title="Video Call">
                        <Video className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button onClick={() => startAudioCall(user)} className="p-2 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition" title="Audio Call">
                        <Phone className="w-4 h-4 text-purple-400" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
          {/* Chat Header */}
          {(activeTab === 'public' && currentRoom) || (activeTab === 'private' && privateChatUser) ? (
            <div className={`${isDarkMode ? 'bg-white/5' : 'bg-black/5'} backdrop-blur-2xl rounded-2xl p-4 border border-white/10 mb-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {activeTab === 'public' ? (
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <Hash className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <img src={getUserAvatar(privateChatUser.id)} className="w-12 h-12 rounded-full ring-2 ring-emerald-500" />
                  )}
                  <div>
                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {activeTab === 'public' ? currentRoom.name : privateChatUser.username}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {activeTab === 'public' ? 'Public Channel • Everyone can see' : 'Private Chat • Encrypted'}
                    </p>
                  </div>
                </div>
                {activeTab === 'private' && privateChatUser && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => startVideoCall(privateChatUser)} 
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white text-sm flex items-center gap-2 hover:from-emerald-600 hover:to-teal-700 transition shadow-md"
                    >
                      <Video className="w-4 h-4" /> Video Call
                    </button>
                    <button 
                      onClick={() => startAudioCall(privateChatUser)} 
                      className="px-4 py-2 bg-purple-500/20 rounded-xl text-purple-400 text-sm flex items-center gap-2 hover:bg-purple-500/30 transition"
                    >
                      <Phone className="w-4 h-4" /> Audio Call
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={`${isDarkMode ? 'bg-white/5' : 'bg-black/5'} backdrop-blur-2xl rounded-2xl p-8 text-center border border-white/10 mb-4`}>
              <Logo size="xl" className="mx-auto mb-4" />
              <p className="text-gray-400">Select a chat room or user to start messaging</p>
            </div>
          )}
          
          {/* Messages Area */}
          {(activeTab === 'public' && currentRoom) || (activeTab === 'private' && privateChatUser) ? (
            <>
              <div className={`${isDarkMode ? 'bg-black/40' : 'bg-white/40'} backdrop-blur-2xl rounded-2xl border border-white/10 mb-4 overflow-hidden`}>
                <div className="h-[450px] overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>No messages yet</p>
                        <p className="text-xs mt-1">Start the conversation!</p>
                      </div>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-2 group ${msg.user_id === session.user.id ? 'flex-row-reverse' : ''}`}>
                      <img src={getUserAvatar(msg.user_id)} className="w-8 h-8 rounded-full" />
                      <div className={`max-w-[70%] rounded-2xl p-3 relative ${msg.user_id === session.user.id ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : isDarkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                        {msg.user_id !== session.user.id && <p className="text-xs text-emerald-400 mb-1">{getUserName(msg.user_id)}</p>}
                        {msg.reply_to && <div className="text-xs opacity-70 mb-1 border-l-2 border-emerald-400 pl-2">↩️ Replying</div>}
                        <p className="text-sm">{msg.message}</p>
                        {msg.file_url && (
                          <div className="mt-2">
                            <button 
                              onClick={() => setPreviewFile({ url: msg.file_url, name: msg.file_name })}
                              className="flex items-center gap-2 text-xs bg-black/30 rounded-lg px-2 py-1 hover:bg-black/50 transition"
                            >
                              {getFileIcon(msg.file_name)}
                              <span className="truncate max-w-[150px]">{msg.file_name}</span>
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <p className="text-[10px] opacity-50 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                        <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                          <button onClick={() => setReplyTo(msg)} className="bg-gray-700 rounded-full p-1"><Reply className="w-3 h-3 text-white" /></button>
                          {msg.user_id === session.user.id && (
                            <button onClick={() => { setEditMessage(msg); setMessageText(msg.message) }} className="bg-gray-700 rounded-full p-1"><Edit2 className="w-3 h-3 text-white" /></button>
                          )}
                        </div>
                        {(msg.user_id === session.user.id || isAdminUser) && (
                          <button onClick={() => deleteMessage(msg.id)} className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 bg-red-500 rounded-full p-1">
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Input Area */}
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
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition" title="Attach file">
                    <Paperclip className="w-5 h-5 text-gray-400" />
                  </button>
                  <button onClick={() => setShowAudioRecorder(true)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition" title="Record Audio">
                    <MicIcon className="w-5 h-5 text-gray-400" />
                  </button>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 relative">
                    <Smile className="w-5 h-5 text-gray-400" />
                    {showEmojiPicker && <EmojiPicker onSelectEmoji={(e) => setMessageText(prev => prev + e)} onClose={() => setShowEmojiPicker(false)} />}
                  </button>
                  <input 
                    type="text" 
                    value={messageText} 
                    onChange={(e) => { setMessageText(e.target.value); handleTyping() }} 
                    onKeyPress={(e) => e.key === 'Enter' && (activeTab === 'public' ? sendPublicMessage() : sendPrivateMessage())} 
                    placeholder="Type a message..." 
                    className="flex-1 bg-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                  <button 
                    onClick={() => activeTab === 'public' ? sendPublicMessage() : sendPrivateMessage()} 
                    disabled={uploading} 
                    className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-white" />}
                  </button>
                </div>
                {isTyping && <p className="text-xs text-emerald-400 mt-2 animate-pulse">Someone is typing...</p>}
                {uploadFile && (
                  <div className="mt-2 p-2 bg-emerald-500/20 rounded-lg flex justify-between">
                    <div className="flex items-center gap-2">
                      {getFileIcon(uploadFile.name)}
                      <span className="text-xs text-emerald-400">{uploadFile.name}</span>
                    </div>
                    <button onClick={() => setUploadFile(null)}><X className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}