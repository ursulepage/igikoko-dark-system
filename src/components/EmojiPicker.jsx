export function EmojiPicker({ onSelectEmoji, onClose }) {
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