import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Package, Download, UploadCloud, FileArchive, Loader2, Search, 
  Trash2, X, Calendar, HardDrive, Zap, Tag, Sparkles,
  Grid3x3, List, ArrowUpDown, Eye, Copy, CheckCircle,
  Edit2, Save, RefreshCw, ChevronLeft, ChevronRight,
  Cloud, Rocket, AlertCircle
} from 'lucide-react'
import { Logo } from './Logo'

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
  const [stats, setStats] = useState({ total: 0, totalSize: 0, categories: [], totalDownloads: 0 })
  const [loading, setLoading] = useState(false)
  
  // Edit mode state
  const [editingProject, setEditingProject] = useState(null)
  const [editForm, setEditForm] = useState({
    project_name: '',
    description: '',
    version: '',
    category: ''
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const ADMIN_EMAIL = 'senyiblazi@gmail.com'
  const isAdminUser = session.user?.email === ADMIN_EMAIL

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    calculateStats()
  }, [projects])

  // READ - Load projects
  async function loadProjects() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('project_uploads')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
      showToast('Error loading projects', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  async function calculateStats() {
    const total = projects.length
    const totalSize = projects.reduce((acc, p) => acc + (p.file_size || 0), 0)
    const categories = [...new Set(projects.map(p => p.category).filter(Boolean))]
    const totalDownloads = projects.reduce((acc, p) => acc + (p.download_count || 0), 0)
    setStats({ total, totalSize, categories, totalDownloads })
  }

  // Show toast notification
  function showToast(message, type = 'success') {
    const colors = {
      success: 'from-emerald-500 to-teal-600',
      error: 'from-red-500 to-rose-500',
      info: 'from-blue-500 to-cyan-500',
      warning: 'from-yellow-500 to-orange-500'
    }
    const toast = document.createElement('div')
    toast.className = `fixed bottom-4 right-4 bg-gradient-to-r ${colors[type]} text-white px-4 py-2 rounded-xl shadow-2xl z-50`
    toast.innerHTML = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  // DOWNLOAD - Download project with counter
  async function downloadProject(project) {
    try {
      showToast('⚡ Downloading...', 'info')
      
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
      
      // Update download count
      const { error } = await supabase
        .from('project_uploads')
        .update({ download_count: (project.download_count || 0) + 1 })
        .eq('id', project.id)
      
      if (!error) {
        await loadProjects()
        showToast('✨ Download complete!', 'success')
      }
    } catch (error) {
      const link = document.createElement('a')
      link.href = project.zip_file_url
      link.download = project.project_name
      link.click()
      showToast('📦 Download started!', 'success')
    }
  }

  // CREATE - Upload new project
  async function uploadProject() {
    if (!projectFile || !projectName) {
      showToast('Please fill all required fields', 'warning')
      return
    }
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const fileExt = projectFile.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `projects/${fileName}`
      
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('projects')
        .upload(filePath, projectFile)
      
      clearInterval(interval)
      setUploadProgress(100)
      
      if (uploadError) throw uploadError
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('projects')
        .getPublicUrl(filePath)
      
      // Insert into database - only columns that exist
      const { error: insertError } = await supabase
        .from('project_uploads')
        .insert([{ 
          user_id: session.user.id, 
          project_name: projectName, 
          zip_file_url: publicUrl, 
          description, 
          version, 
          category, 
          file_size: projectFile.size, 
          download_count: 0 
        }])
      
      if (insertError) throw insertError
      
      await loadProjects()
      resetForm()
      showToast('🎉 Project uploaded successfully!', 'success')
      
    } catch (error) {
      console.error('Upload error:', error)
      showToast('Upload failed: ' + error.message, 'error')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // UPDATE - Edit project
  async function updateProject() {
    if (!editingProject) return
    
    setIsUpdating(true)
    
    try {
      // Only update columns that exist in the schema
      const updateData = {
        project_name: editForm.project_name,
        description: editForm.description,
        version: editForm.version,
        category: editForm.category
      }
      
      const { error } = await supabase
        .from('project_uploads')
        .update(updateData)
        .eq('id', editingProject.id)
      
      if (error) throw error
      
      await loadProjects()
      setShowEditModal(false)
      setEditingProject(null)
      resetEditForm()
      showToast('✏️ Project updated successfully!', 'success')
      
    } catch (error) {
      console.error('Update error:', error)
      showToast('Update failed: ' + error.message, 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  // DELETE - Delete project
  async function deleteProject(id) {
    try {
      const project = projects.find(p => p.id === id)
      
      if (project) {
        // Extract filename from URL
        const urlParts = project.zip_file_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const filePath = `projects/${fileName}`
        
        // Delete from storage (optional - handle error gracefully)
        await supabase.storage.from('projects').remove([filePath])
      }
      
      // Delete from database
      const { error } = await supabase
        .from('project_uploads')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      await loadProjects()
      setShowDeleteModal(false)
      setDeleteId(null)
      showToast('🗑️ Project deleted successfully!', 'success')
      
    } catch (error) {
      console.error('Delete error:', error)
      showToast('Delete failed: ' + error.message, 'error')
    }
  }

  // Reset upload form
  function resetForm() {
    setProjectName('')
    setProjectFile(null)
    setDescription('')
    setVersion('1.0.0')
    setCategory('')
  }

  // Reset edit form
  function resetEditForm() {
    setEditForm({
      project_name: '',
      description: '',
      version: '',
      category: ''
    })
  }

  // Open edit modal
  function openEditModal(project) {
    setEditingProject(project)
    setEditForm({
      project_name: project.project_name,
      description: project.description || '',
      version: project.version || '1.0.0',
      category: project.category || ''
    })
    setShowEditModal(true)
  }

  // Copy link
  async function copyLink(url) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      showToast('Link copied to clipboard!', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      showToast('Failed to copy link', 'error')
    }
  }

  // Format file size
  function formatFileSize(bytes) {
    if (!bytes) return 'Unknown'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  // Format date
  function formatDate(date) {
    if (!date) return 'Unknown'
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Get sorted and filtered projects
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
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage)
  const paginatedProjects = sortedProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

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
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-800 rounded-xl text-gray-300 hover:bg-gray-700 transition">Cancel</button>
              <button onClick={() => deleteProject(deleteId)} className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl text-white hover:from-red-600 hover:to-rose-600 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl p-6 max-w-lg w-full border border-emerald-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Edit2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Edit Project</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Project Name *</label>
                <input 
                  type="text" 
                  value={editForm.project_name} 
                  onChange={(e) => setEditForm({ ...editForm, project_name: e.target.value })} 
                  className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Version</label>
                  <input 
                    type="text" 
                    value={editForm.version} 
                    onChange={(e) => setEditForm({ ...editForm, version: e.target.value })} 
                    className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Category</label>
                  <input 
                    type="text" 
                    value={editForm.category} 
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} 
                    className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Description</label>
                <textarea 
                  value={editForm.description} 
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                  rows="4" 
                  className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 bg-gray-800 rounded-xl text-gray-300 hover:bg-gray-700 transition">Cancel</button>
              <button onClick={updateProject} disabled={isUpdating} className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white hover:from-emerald-600 hover:to-teal-700 transition flex items-center justify-center gap-2">
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                {isUpdating ? 'Saving...' : 'Save Changes'}
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
              <Logo size="lg" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Project Archive</h1>
                <p className="text-gray-400 text-sm mt-1">Browse, download and manage community projects</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                <HardDrive className="w-3 h-3 text-emerald-400" /> {stats.total} projects
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                <Download className="w-3 h-3 text-emerald-400" /> {stats.totalDownloads} downloads
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                <Zap className="w-3 h-3 text-emerald-400" /> High-speed CDN
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
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }} 
                className="w-full sm:w-64 bg-gray-800/50 rounded-xl py-2 pl-10 pr-4 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="bg-gray-800/50 rounded-xl px-4 py-2 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="popular">Most Downloaded</option>
                <option value="name">Name A-Z</option>
              </select>
              
              <div className="flex bg-gray-800/50 rounded-xl p-1 border border-gray-700">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md' : 'text-gray-500'}`}>
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md' : 'text-gray-500'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button onClick={loadProjects} className="p-2 bg-gray-800/50 rounded-xl text-gray-400 hover:text-emerald-400 transition border border-gray-700" title="Refresh">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Upload Section - CREATE */}
      {isAdminUser && (
        <div className="bg-gradient-to-br from-gray-900/80 to-slate-900/80 rounded-2xl p-5 md:p-6 mb-6 border border-gray-800 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <UploadCloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Create New Project</h3>
                <p className="text-xs text-emerald-400">Admin Only • Share your work</p>
              </div>
            </div>
            {isUploading && <span className="text-emerald-400 text-sm font-mono">{uploadProgress}%</span>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Project Name *</label>
              <input 
                type="text" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)} 
                placeholder="Project name" 
                className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Version</label>
              <input 
                type="text" 
                value={version} 
                onChange={(e) => setVersion(e.target.value)} 
                placeholder="1.0.0" 
                className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Category</label>
              <input 
                type="text" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                placeholder="Category" 
                className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="text-gray-400 text-sm mb-1 block">ZIP File *</label>
            <label className="flex items-center gap-3 w-full bg-gray-800/50 rounded-xl px-4 py-3 text-gray-400 cursor-pointer hover:bg-gray-700/50 transition border border-gray-700">
              <FileArchive className="w-5 h-5 text-emerald-400" />
              <span className="flex-1 truncate">{projectFile ? projectFile.name : 'Click to select ZIP file'}</span>
              <input type="file" accept=".zip,.rar,.7z" onChange={(e) => setProjectFile(e.target.files[0])} className="hidden" />
            </label>
          </div>
          
          <div className="mt-4">
            <label className="text-gray-400 text-sm mb-1 block">Description</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe your project..." 
              rows="3" 
              className="w-full bg-gray-800/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-700" 
            />
          </div>
          
          {isUploading && (
            <div className="mt-4">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">Uploading to cloud storage...</p>
            </div>
          )}
          
          <button 
            onClick={uploadProject} 
            disabled={isUploading || !projectFile || !projectName} 
            className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
            {isUploading ? `Uploading ${uploadProgress}%` : 'Publish Project'}
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-xl p-3 text-center border border-gray-800 shadow-xl">
          <Package className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Projects</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-xl p-3 text-center border border-gray-800 shadow-xl">
          <Download className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{stats.totalDownloads}</p>
          <p className="text-xs text-gray-500">Total Downloads</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-xl p-3 text-center border border-gray-800 shadow-xl">
          <HardDrive className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{formatFileSize(stats.totalSize)}</p>
          <p className="text-xs text-gray-500">Storage Used</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-xl p-3 text-center border border-gray-800 shadow-xl">
          <Cloud className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">CDN</p>
          <p className="text-xs text-gray-500">Fast Delivery</p>
        </div>
      </div>

      {/* Projects Grid/List - READ */}
      <div className="bg-gradient-to-br from-gray-900/50 to-slate-900/50 rounded-2xl p-4 md:p-6 border border-gray-800 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg text-white">
            All Projects ({sortedProjects.length})
            {searchTerm && <span className="text-sm text-gray-400 ml-2">(filtered)</span>}
          </h3>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-sm text-emerald-400 hover:text-emerald-300">
              Clear filter
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedProjects.map(project => (
              <div 
                key={project.id} 
                className="group bg-gradient-to-br from-gray-800/50 to-slate-800/50 rounded-xl p-4 border border-gray-700 hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
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
                      <>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(project) }} 
                          className="p-2 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); setShowDeleteModal(true) }} 
                          className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-base mb-1 truncate text-white">{project.project_name}</h4>
                <p className="text-gray-400 text-xs mb-2 line-clamp-2">{project.description || 'No description'}</p>
                <div className="flex flex-wrap items-center gap-1 mb-2">
                  {project.version && <span className="px-1.5 py-0.5 bg-emerald-500/20 rounded text-emerald-400 text-xs">v{project.version}</span>}
                  {project.category && <span className="px-1.5 py-0.5 bg-purple-500/20 rounded text-purple-400 text-xs">{project.category}</span>}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{formatDate(project.created_at)}</span></div>
                  <div className="flex items-center gap-1"><Download className="w-3 h-3" /><span>{project.download_count || 0}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedProjects.map(project => (
              <div 
                key={project.id} 
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700 hover:border-emerald-500/50 transition-all hover:bg-gray-800/50 cursor-pointer"
                onClick={() => setSelectedProject(project)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileArchive className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm md:text-base truncate text-white">{project.project_name}</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-gray-400 text-xs truncate">{project.description || 'No description'} • {formatDate(project.created_at)}</p>
                      {project.version && <span className="text-xs text-emerald-400">v{project.version}</span>}
                      {project.category && <span className="text-xs text-purple-400">{project.category}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500"><Download className="w-3 h-3" /><span>{project.download_count || 0}</span></div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); downloadProject(project) }} 
                    className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg text-white text-xs hover:from-emerald-600 hover:to-teal-700 transition flex items-center gap-1 shadow-md"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                  {isAdminUser && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEditModal(project) }} 
                        className="p-1.5 bg-blue-500/20 rounded-lg text-blue-400 hover:bg-blue-500/30 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); setShowDeleteModal(true) }} 
                        className="p-1.5 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {sortedProjects.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-12">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No projects found</p>
            {searchTerm && <p className="text-sm mt-1">Try a different search term</p>}
            {!searchTerm && isAdminUser && <p className="text-sm mt-1">Click "Upload Project" to add your first project</p>}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6 pt-4 border-t border-gray-700">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-gray-800/50 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm transition ${currentPage === pageNum ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'}`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 bg-gray-800/50 rounded-lg text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
          <div className="bg-gradient-to-br from-gray-900 to-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-gray-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-br from-gray-900 to-slate-900 p-4 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
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
              
              {isAdminUser && (
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => { openEditModal(selectedProject); setSelectedProject(null) }}
                    className="flex-1 bg-blue-500/20 text-blue-400 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500/30 transition border border-blue-500/30"
                  >
                    <Edit2 className="w-5 h-5" /> Edit Project
                  </button>
                  <button 
                    onClick={() => { setDeleteId(selectedProject.id); setShowDeleteModal(true); setSelectedProject(null) }}
                    className="flex-1 bg-red-500/20 text-red-400 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/30 transition border border-red-500/30"
                  >
                    <Trash2 className="w-5 h-5" /> Delete Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}