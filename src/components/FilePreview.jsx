import { useState, useRef, useEffect } from 'react'
import { Image, Video, Music, FileText, FileArchive, X, Download, Play, Pause } from 'lucide-react'

export function FilePreview({ fileUrl, fileName, onClose }) {
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