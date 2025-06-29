"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Download,
  BarChart3,
  Clock,
  Video,
  MessageCircle,
  Brain,
  Crown,
  Star,
  TrendingUp,
} from "lucide-react"
import { api } from "@/lib/api"
import { MESSAGES } from "@/lib/messages"

interface ProfileProps {
  user: any
  onLogout: () => void
}

export function Profile({ user, onLogout }: ProfileProps) {
  const [notifications, setNotifications] = useState({
    aiSummary: true,
    newVideos: true,
    chatMessages: false,
    weeklyReport: true,
  })

  // Controlled state cho form
  const [fullName, setFullName] = useState(user?.full_name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [bio, setBio] = useState(user?.bio || "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Nếu user thay đổi (do login/logout), cập nhật lại form
  useEffect(() => {
    setFullName(user?.full_name || "")
    setEmail(user?.email || "")
    setBio(user?.bio || "")
    setAvatarUrl(user?.avatar_url || "")
  }, [user])

  // Lưu thay đổi
  const handleSave = async () => {
    setSaving(true)
    setMessage("")
    try {
      // Lấy token từ localStorage
      const token = localStorage.getItem('token')
      if (!token) throw new Error(MESSAGES.AUTH.NOT_LOGGED_IN)
      // Gọi API cập nhật
      await api.auth.updateProfile(token, {
        full_name: fullName,
        email,
        bio,
      })
      setMessage(MESSAGES.USER.PROFILE_UPDATED)
    } catch (err: any) {
      setMessage(err.message || MESSAGES.USER.PROFILE_UPDATE_FAILED)
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]  
    if (!file) return
    const formData = new FormData()
    formData.append('avatar', file)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/auth/avatar', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setAvatarUrl(data.data.avatar_url)
      } else {
        alert(data.message || MESSAGES.USER.AVATAR_UPDATE_FAILED)
      }
    } catch {
      alert(MESSAGES.USER.AVATAR_UPDATE_FAILED)
    }
  }

  const userStats = [
    { label: "Video đã xem", value: "156", icon: Video, trend: "+12%" },
    { label: "Giờ học", value: "89h", icon: Clock, trend: "+8%" },
    { label: "AI Chat", value: "234", icon: MessageCircle, trend: "+25%" },
    { label: "Điểm AI", value: "1,250", icon: Brain, trend: "+15%" },
  ]

  const achievements = [
    { name: "Video Explorer", description: "Xem 100+ video", icon: "🎬", earned: true },
    { name: "AI Enthusiast", description: "Sử dụng AI 50+ lần", icon: "🤖", earned: true },
    { name: "Chat Master", description: "Gửi 500+ tin nhắn", icon: "💬", earned: true },
    { name: "Learning Streak", description: "Học 30 ngày liên tiếp", icon: "🔥", earned: false },
    { name: "Content Creator", description: "Upload 10+ video", icon: "📹", earned: false },
    { name: "Community Helper", description: "Giúp đỡ 20+ người", icon: "🤝", earned: false },
  ]

  const recentActivity = [
    { action: "Xem video", content: "Machine Learning cơ bản", time: "2 giờ trước" },
    { action: "AI Chat", content: "Hỏi về Deep Learning", time: "3 giờ trước" },
    { action: "Upload video", content: "React Hooks Tutorial", time: "1 ngày trước" },
    { action: "Tóm tắt AI", content: "Python Data Science", time: "2 ngày trước" },
    { action: "Chia sẻ", content: "Next.js App Router", time: "3 ngày trước" },
  ]

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
          <p className="text-gray-600 mt-1">Quản lý thông tin và cài đặt tài khoản</p>
        </div>
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <Crown className="w-4 h-4 mr-1" />
          Premium
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 relative group">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
                <button
                  className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow group-hover:scale-110 transition"
                  onClick={() => fileInputRef.current?.click()}
                  title="Đổi avatar"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h18" /></svg>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user?.full_name || "Chưa có tên"}</h2>
              <p className="text-gray-600">{user?.email || "Chưa có email"}</p>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <Badge variant="secondary">AI Enthusiast</Badge>
                <Badge className="bg-yellow-500">Level 5</Badge>
              </div>
              <Button className="w-full mt-4" onClick={onLogout}>Đăng xuất</Button>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Thống kê
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="text-sm text-gray-600">{stat.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{stat.value}</div>
                      <div className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {stat.trend}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="settings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="settings">Cài đặt</TabsTrigger>
              <TabsTrigger value="activity">Hoạt động</TabsTrigger>
              <TabsTrigger value="achievements">Thành tích</TabsTrigger>
              <TabsTrigger value="subscription">Gói dịch vụ</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                  <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Họ và tên</label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Giới thiệu về bản thân..." />
                  </div>
                  <Button onClick={handleSave} disabled={saving}>Lưu thay đổi</Button>
                  {message && <div className="text-green-600 mt-2">{message}</div>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Thông báo
                  </CardTitle>
                  <CardDescription>Quản lý các thông báo bạn muốn nhận</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Tóm tắt AI</h4>
                      <p className="text-sm text-gray-600">Nhận thông báo khi AI hoàn thành tóm tắt video</p>
                    </div>
                    <Switch
                      checked={notifications.aiSummary}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, aiSummary: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Video mới</h4>
                      <p className="text-sm text-gray-600">Thông báo về video mới được thêm</p>
                    </div>
                    <Switch
                      checked={notifications.newVideos}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, newVideos: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Tin nhắn chat</h4>
                      <p className="text-sm text-gray-600">Thông báo tin nhắn mới trong chat</p>
                    </div>
                    <Switch
                      checked={notifications.chatMessages}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, chatMessages: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Báo cáo hàng tuần</h4>
                      <p className="text-sm text-gray-600">Nhận báo cáo hoạt động hàng tuần</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReport}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReport: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Bảo mật
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full bg-transparent">
                    Đổi mật khẩu
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    Xác thực 2 bước
                  </Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    Quản lý phiên đăng nhập
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hoạt động gần đây</CardTitle>
                  <CardDescription>Lịch sử hoạt động của bạn trên platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{activity.action}</span>
                            <span className="text-sm text-gray-600">•</span>
                            <span className="text-sm text-gray-600">{activity.content}</span>
                          </div>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Tải xuống dữ liệu
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thành tích</CardTitle>
                  <CardDescription>Các thành tích bạn đã đạt được và đang theo đuổi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement, index) => (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg ${
                          achievement.earned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-medium">{achievement.name}</h3>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                          {achievement.earned && (
                            <Badge className="bg-green-500">
                              <Star className="w-3 h-3 mr-1" />
                              Đạt được
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Gói dịch vụ hiện tại
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Crown className="w-6 h-6 text-yellow-600" />
                        <h3 className="text-xl font-bold text-gray-900">Premium Plan</h3>
                      </div>
                      <Badge className="bg-yellow-500 text-white">Đang hoạt động</Badge>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Truy cập không giới hạn tất cả tính năng AI, thuyết minh real-time, và chat thông minh
                    </p>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Ngày gia hạn</p>
                        <p className="font-semibold">15/02/2024</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Giá</p>
                        <p className="font-semibold">299,000 VNĐ/tháng</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline">Quản lý thanh toán</Button>
                      <Button variant="outline">Hủy gói</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tính năng Premium</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium">Thuyết minh AI không giới hạn</h4>
                        <p className="text-sm text-gray-600">Sử dụng tính năng thuyết minh cho tất cả video</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium">Chat AI nâng cao</h4>
                        <p className="text-sm text-gray-600">Phân tích cảm xúc và gợi ý thông minh</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium">Upload video không giới hạn</h4>
                        <p className="text-sm text-gray-600">Tải lên video với dung lượng lớn</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium">Báo cáo chi tiết</h4>
                        <p className="text-sm text-gray-600">Phân tích học tập và tiến độ cá nhân</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
