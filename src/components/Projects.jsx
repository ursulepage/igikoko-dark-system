import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Package, Download, UploadCloud, FileArchive, Loader2, Search, 
  Trash2, Edit2, Check, X, Eye, Clock, User, Tag, 
  Heart, Share2, Copy, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Filter, Grid3x3, List,
  ArrowUpDown, Calendar, HardDrive, Zap, Sparkles,
  TrendingUp, Star, Award, Rocket, Shield, Cloud,
  Gem, Crown, Brain, Compass, Feather, Infinity
} from 'lucide-react'

export function Projects({ session, isDarkMode }) {
  const [projects, setProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectFile, setProjectFile] = useState(null)
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('1.0.0')
  const [category, setCategory] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedProject, setSelectedProject] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState({ total: 0, totalSize: 0, categories: [] })

  const ADMIN_EMAIL = 'senyiblazi@gmail.com'
  const isAdminUser = session.user?.email === ADMIN_EMAIL

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [projects])

  async function loadProjects() {
    const { data } = await supabase.from('project_uploads').select('*').order('created_at', { ascending: false })
    if (data) setProjects(data)
  }

  async function calculateStats() {
    const total = projects.length
    const totalSize = projects.reduce((acc, p) => acc + (p.file_size || 0), 0)
    const categories = [...new Set(projects.map(p => p.category).filter(Boolean))]
    setStats({ total, totalSize, categories })
  }

  async function downloadProject(project) {
    try {
      const toast = document.createElement('div')
      toast.className = 'fixed bottom-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl shadow-2xl z-50 animate-pulse'
      toast.innerHTML = '⚡ Downloading...'
      document.body.appendChild(toast)
      
      const response = await fetch(project.zip_file_url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = project.project_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      await supabase.from('project_uploads').update({ 
        download_count: (project.download_count || 0) + 1 
      }).eq('id', project.id)
      
      toast.innerHTML = '✨ Download complete!'
      setTimeout(() => toast.remove(), 2000)
    } catch (error) {
      const link = document.createElement('a')
      link.href = project.zip_file_url
      link.download = project.project_name
      link.click()
    }
  }

  async function uploadProject() {
    if (!projectFile || !projectName) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    const filePath = `projects/${Date.now()}_${projectFile.name}`
    
    const interval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 200)
    
    const { error } = await supabase.storage.from('projects').upload(filePath, projectFile)
    
    clearInterval(interval)
    setUploadProgress(100)
    
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('projects').getPublicUrl(filePath)
      await supabase.from('project_uploads').insert([{ 
        user_id: session.user.id, 
        project_name: projectName, 
        zip_file_url: publicUrl, 
        description,
        version,
        category,
        file_size: projectFile.size,
        download_count: 0
      }])
      await loadProjects()
      setProjectName('')
      setProjectFile(null)
      setDescription('')
      setVersion('1.0.0')
      setCategory('')
      
      const toast = document.createElement('div')
      toast.className = 'fixed bottom-4 right-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl shadow-2xl z-50'
      toast.innerHTML = '🎉 Project uploaded successfully!'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
    }
    
    setTimeout(() => {
      setIsUploading(false)
      setUploadProgress(0)
    }, 500)
  }

  async function deleteProject(id) {
    await supabase.from('project_uploads').delete().eq('id', id)
    await loadProjects()
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  function copyLink(url) {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatFileSize(bytes) {
    if (!bytes) return 'Unknown'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getSortedProjects = () => {
    let filtered = projects.filter(p => 
      p.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    switch(sortBy) {
      case 'oldest':
        return [...filtered].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      case 'popular':
        return [...filtered].sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
      case 'name':
        return [...filtered].sort((a, b) => a.project_name.localeCompare(b.project_name))
      default:
        return filtered
    }
  }

  const sortedProjects = getSortedProjects()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 p-4 md:p-6 pb-24">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl p-6 max-w-md w-full border border-red-500/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Project?</h3>
            </div>
            <p className="text-gray-400 mb-6">This action cannot be undone. The project will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-800 rounded-xl text-gray-300 hover:bg-gray-700 transition font-medium">
                Cancel
              </button>
              <button onClick={() => deleteProject(deleteId)} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl text-white hover:from-red-600 hover:to-rose-600 transition font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-gray-800 shadow-2xl mb-6">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-emerald-500/30">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Project Archive
                </h1>
                <p className="text-gray-400 text-sm mt-1">Browse and download community projects</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                <HardDrive className="w-3 h-3 text-emerald-400" /> {stats.total} projects
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                <Zap className="w-3 h-3 text-emerald-400" /> High-speed downloads
              </div>
              {stats.categories.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                  <Tag className="w-3 h-3 text-emerald-400" /> {stats.categories.length} categories
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full sm:w-64 bg-gray-800/50 rounded-xl py-2 pl-10 pr-4 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-800/50 rounded-xl px-4 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer border border-gray-700"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="popular">Most Downloaded</option>
                  <option value="name">Name A-Z</option>
                </select>
                <ArrowUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
              
              <div className="flex bg-gray-800/50 rounded-xl p-1 border border-gray-700">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'text-gray-500'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Upload Section - Professional Dark Design */}
      {isAdminUser && (
        <div className="bg-gradient-to-br from-gray-900/80 to-slate-900/80 rounded-2xl p-5 md:p-6 mb-6 border border-gray-800 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-emerald-500/30">
                <UploadCloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Upload New Project</h3>
                <p className="text-xs text-emerald-400">Admin Only • Share your work with the community</p>
              </div>
            </div>
            {isUploading && (
              <div className="text-right">
                <span className="text-emerald-400 text-sm font-mono">{uploadProgress}%</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Project Name *</label>
              <input 
                type="text" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)} 
                placeholder="e.g., IGIKOKO Dark System" 
                className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-gray-200 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Version</label>
              <input 
                type="text" 
                value={version} 
                onChange={(e) => setVersion(e.target.value)} 
                placeholder="1.0.0" 
                className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-gray-200 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Category</label>
              <input 
                type="text" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                placeholder="e.g., Web App, Mobile, Desktop" 
                className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-gray-200 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">ZIP File *</label>
              <label className="flex items-center gap-3 w-full bg-gray-800/50 rounded-xl px-4 py-3 text-gray-400 cursor-pointer hover:bg-gray-700/50 transition border border-gray-700">
                <FileArchive className="w-5 h-5 text-emerald-400" />
                <span className="flex-1 truncate">{projectFile ? projectFile.name : 'Click to select ZIP file'}</span>
                <input type="file" accept=".zip,.rar,.7z" onChange={(e) => setProjectFile(e.target.files[0])} className="hidden" />
              </label>
            </div>
          </div>
          
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe your project..." 
              rows="3" 
              className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-gray-200 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
            />
          </div>
          
          {isUploading && (
            <div className="mb-4">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">Uploading... {uploadProgress}%</p>
            </div>
          )}
          
          <button 
            onClick={uploadProject} 
            disabled={isUploading || !projectFile || !projectName} 
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isUploading ? `Uploading ${uploadProgress}%` : 'Publish Project'}
          </button>
        </div>
      )}

      {/* Stats Bar - Dark Wisdom */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-xl p-3 text-center border border-gray-800 shadow-xl">
          <Package className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Projects</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-xl p-3 text-center border border-gray-800 shadow-xl">
          <Download className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">
            {projects.reduce((acc, p) => acc + (p.download_count || 0), 0)}
          </p>
          <p className="text-xs text-gray-500">Total Downloads</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-xl p-3 text-center border border-gray-800 shadow-xl">
          <HardDrive className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">
            {formatFileSize(stats.totalSize)}
          </p>
          <p className="text-xs text-gray-500">Storage Used</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-xl p-3 text-center border border-gray-800 shadow-xl">
          <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">CDN</p>
          <p className="text-xs text-gray-500">Fast Delivery</p>
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 rounded-2xl p-4 md:p-6 border border-gray-800 shadow-2xl backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg text-white">
            All Projects ({sortedProjects.length})
          </h3>
          {searchTerm && (
            <p className="text-sm text-gray-500">Found {sortedProjects.length} results</p>
          )}
        </div>
        
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {sortedProjects.map(project => (
              <div 
                key={project.id} 
                className="group bg-gradient-to-br from-gray-800/50 to-slate-800/50 rounded-xl p-4 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer backdrop-blur-sm"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileArchive className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); downloadProject(project) }}
                      className="p-2 bg-emerald-500/20 rounded-lg hover:bg-emerald-500/30 transition"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                    </button>
                    {isAdminUser && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); setShowDeleteModal(true) }}
                        className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
                
                <h4 className="font-bold text-base mb-1 truncate text-white">
                  {project.project_name}
                </h4>
                
                <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                  {project.description || 'No description provided'}
                </p>
                
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {project.version && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 rounded-full text-emerald-400 border border-emerald-500/30">v{project.version}</span>
                  )}
                  {project.category && (
                    <span className="px-2 py-0.5 bg-purple-500/20 rounded-full text-purple-400 border border-purple-500/30">{project.category}</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    <span>{project.download_count || 0} downloads</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedProjects.map(project => (
              <div 
                key={project.id} 
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700 hover:border-emerald-500/50 transition-all hover:bg-gray-800/50 cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileArchive className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm md:text-base truncate text-white">
                      {project.project_name}
                    </h4>
                    <p className="text-gray-400 text-xs truncate">
                      {project.description || 'No description'} • {formatDate(project.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 ml-13 sm:ml-0">
                  {project.version && (
                    <span className="px-2 py-1 bg-emerald-500/20 rounded-lg text-emerald-400 text-xs border border-emerald-500/30">v{project.version}</span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Download className="w-3 h-3" />
                    <span>{project.download_count || 0}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); downloadProject(project) }}
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-white text-xs hover:from-emerald-600 hover:to-teal-700 transition flex items-center gap-1 shadow-md"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                  {isAdminUser && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); setShowDeleteModal(true) }}
                      className="p-1.5 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {sortedProjects.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No projects found</p>
            {searchTerm && <p className="text-sm mt-1">Try a different search term</p>}
            {!searchTerm && isAdminUser && <p className="text-sm mt-1">Click "Upload Project" to add your first project</p>}
          </div>
        )}
      </div>

      {/* Project Details Modal - Dark Wisdom */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
          <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-br from-gray-900 to-slate-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileArchive className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedProject.project_name}</h3>
                  <p className="text-gray-400 text-sm">Version {selectedProject.version || '1.0.0'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-white">Description</h4>
                <p className="text-gray-400">{selectedProject.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-white">Category</h4>
                  <p className="text-gray-400 text-sm">{selectedProject.category || 'Uncategorized'}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-white">File Size</h4>
                  <p className="text-gray-400 text-sm">{formatFileSize(selectedProject.file_size)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-white">Uploaded</h4>
                  <p className="text-gray-400 text-sm">{formatDate(selectedProject.created_at)}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-white">Downloads</h4>
                  <p className="text-gray-400 text-sm">{selectedProject.download_count || 0} times</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => downloadProject(selectedProject)}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-700 transition shadow-lg"
                >
                  <Download className="w-5 h-5" /> Download Now
                </button>
                <button 
                  onClick={() => copyLink(selectedProject.zip_file_url)}
                  className="px-4 py-3 bg-gray-800 rounded-xl text-gray-400 hover:text-emerald-400 transition flex items-center gap-2"
                >
                  {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}