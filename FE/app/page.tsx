"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { VideoPlayer } from "@/components/video-player"
import { VideoManagement } from "@/components/video-management"
import { AuthForm } from "@/components/auth-form"
import { AddVideo } from "@/components/add-video"
import { Profile } from "@/components/profile"
import { ChatInterface } from "@/components/chat-interface"

export default function Home() {
  const [currentView, setCurrentView] = useState("dashboard")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<{ type: string; url: string } | null>(null)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState("")

  // Check for existing authentication on component mount
  useEffect(() => {
    // Chỉ chạy ở client
    if (typeof window === 'undefined') return;
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (
      savedToken &&
      savedUser &&
      savedUser !== 'undefined'
    ) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
    // Lắng nghe sự kiện chuyển sang "Video của tôi"
    const handleNavigateToMyVideos = () => setCurrentView('my-videos');
    window.addEventListener('navigateToMyVideos', handleNavigateToMyVideos);
    return () => {
      window.removeEventListener('navigateToMyVideos', handleNavigateToMyVideos);
    }
  }, [])

  const handleAuth = (newToken: string, userData: any) => {
    setToken(newToken)
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken("")
    setUser(null)
    setIsAuthenticated(false)
    setCurrentView("dashboard")
  }

  if (!isAuthenticated) {
    return <AuthForm onAuth={handleAuth} />
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentView} onSelectVideo={setSelectedVideo} />
      case "video-player":
        return <VideoPlayer video={selectedVideo} onBack={() => setCurrentView("dashboard")} />
      case "my-videos":
        return <VideoManagement onNavigate={setCurrentView} onSelectVideo={setSelectedVideo} />
      case "add-video":
        return <AddVideo onBack={() => setCurrentView("my-videos")} onSelectVideo={setSelectedVideo} />
      case "chat":
        return <ChatInterface />
      case "profile":
        return <Profile user={user} onLogout={handleLogout} />
      default:
        return <Dashboard onNavigate={setCurrentView} onSelectVideo={setSelectedVideo} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 overflow-hidden">{renderContent()}</main>
    </div>
  )
}
