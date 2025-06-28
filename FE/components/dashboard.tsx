"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Plus, Clock, MessageCircle, Brain, Video, Mic, FileText } from "lucide-react"

interface DashboardProps {
  onNavigate: (view: string) => void
  onSelectVideo: (video: any) => void
}

export function Dashboard({ onNavigate, onSelectVideo }: DashboardProps) {
  const recentVideos = [
    {
      id: 1,
      title: "Học Machine Learning cơ bản",
      thumbnail: "/placeholder.svg?height=120&width=200",
      duration: "45:30",
      views: 1250,
      aiSummary: "Video giới thiệu các khái niệm cơ bản về ML...",
      status: "processed",
    },
    {
      id: 2,
      title: "React Hooks Tutorial",
      thumbnail: "/placeholder.svg?height=120&width=200",
      duration: "32:15",
      views: 890,
      aiSummary: "Hướng dẫn sử dụng React Hooks hiệu quả...",
      status: "processing",
    },
    {
      id: 3,
      title: "Python Data Science",
      thumbnail: "/placeholder.svg?height=120&width=200",
      duration: "1:12:45",
      views: 2100,
      aiSummary: "Khóa học Python cho Data Science...",
      status: "processed",
    },
  ]

  const stats = [
    { label: "Tổng video", value: "24", icon: Video, color: "text-blue-600" },
    { label: "Giờ xem", value: "156h", icon: Clock, color: "text-green-600" },
    { label: "AI Chat", value: "89", icon: MessageCircle, color: "text-purple-600" },
    { label: "Thuyết minh", value: "45", icon: Mic, color: "text-orange-600" },
  ]

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Chào mừng trở lại! Quản lý video và AI của bạn</p>
        </div>
        <Button onClick={() => onNavigate("add-video")} className="bg-gradient-to-r from-blue-500 to-purple-600">
          <Plus className="w-4 h-4 mr-2" />
          Thêm video mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="w-5 h-5 mr-2 text-purple-600" />
            Tính năng AI nổi bật
          </CardTitle>
          <CardDescription>Khám phá các tính năng AI mạnh mẽ của platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <Mic className="w-8 h-8 text-blue-600 mb-2" />
              <h3 className="font-semibold">Thuyết minh Real-time</h3>
              <p className="text-sm text-gray-600">AI thuyết minh video theo thời gian thực</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <FileText className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-semibold">Tóm tắt thông minh</h3>
              <p className="text-sm text-gray-600">Tự động tóm tắt nội dung video</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <MessageCircle className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold">Chat đa phương tiện</h3>
              <p className="text-sm text-gray-600">Chat với AI về nội dung video</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Videos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Video gần đây</CardTitle>
              <CardDescription>Các video bạn đã xem và tương tác</CardDescription>
            </div>
            <Button variant="outline" onClick={() => onNavigate("my-videos")}>
              Xem tất cả
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentVideos.map((video) => (
              <div key={video.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <img
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.title}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                  <Badge
                    className={`absolute top-2 left-2 ${
                      video.status === "processed" ? "bg-green-500" : "bg-yellow-500"
                    }`}
                  >
                    {video.status === "processed" ? "Đã xử lý" : "Đang xử lý"}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{video.title}</h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{video.aiSummary}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{video.views} lượt xem</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        onSelectVideo(video)
                        onNavigate("video-player")
                      }}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Xem
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
