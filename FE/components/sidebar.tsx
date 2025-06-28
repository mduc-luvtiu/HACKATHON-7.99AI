"use client"

import { Button } from "@/components/ui/button"
import { Home, Video, Plus, MessageCircle, User, Brain, Mic } from "lucide-react"

interface SidebarProps {
  currentView: string
  onNavigate: (view: string) => void
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Trang chính", icon: Home },
    { id: "my-videos", label: "Video của tôi", icon: Video },
    { id: "add-video", label: "Thêm video", icon: Plus },
    { id: "chat", label: "Chat AI", icon: MessageCircle },
    { id: "profile", label: "Cá nhân", icon: User },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Multimedia Supporter</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">Nền tảng video thông minh</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => onNavigate(item.id)}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Mic className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">AI Features</span>
          </div>
          <p className="text-xs text-gray-600">Thuyết minh real-time, tóm tắt nội dung, chat thông minh</p>
        </div>
      </div>
    </div>
  )
}
