export function Logo({ size = 'md', className = '' }) {
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