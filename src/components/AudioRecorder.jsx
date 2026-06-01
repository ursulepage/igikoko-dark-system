import { useState, useRef } from 'react'
import { Mic, Square } from 'lucide-react'

export function AudioRecorder({ onRecordingComplete, onClose }) {
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
        setAudioChunks(prev => [...prev, event.data])
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
          <Mic className="w-10 h-10 text-white" />
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