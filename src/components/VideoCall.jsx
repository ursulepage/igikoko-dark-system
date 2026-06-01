import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Minimize, Maximize } from 'lucide-react'

export function VideoCall({ onEndCall, currentUser, callType }) {
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