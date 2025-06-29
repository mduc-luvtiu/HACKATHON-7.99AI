"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  MoreVertical,
  Play,
  Edit,
  Trash2,
  Download,
  Share,
  Eye,
  Calendar,
  Grid,
  List,
  ArrowLeft,
  Video,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

export default function VideosPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterStatus, setFilterStatus] = useState("all")
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token") || ""
        const res = await api.videos.getAll(token)
        setVideos(res.videos || res.data || res)
      } catch {
        setVideos([])
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.tags && video.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    const matchesFilter = filterStatus === "all" || video.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed":
      case "completed":
        return "bg-green-500"
      case "processing":
        return "bg-yellow-500"
      case "error":
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "processed":
      case "completed":
        return "Đã xử lý"
      case "processing":
        return "Đang xử lý"
      case "error":
      case "failed":
        return "Lỗi"
      default:
        return "Không xác định"
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true)
    try {
      const token = localStorage.getItem("token") || ""
      const res = await api.videos.delete(deleteId, token)
      setVideos(videos => videos.filter(v => v.id !== deleteId))
      setDeleteId(null)
      if (res.driveDeleteError) {
        toast({
          title: "Xóa video thành công, nhưng không xóa được file trên Google Drive!",
          description: res.driveDeleteError,
          variant: "destructive"
        })
      } else {
        toast({ title: "Xóa video thành công!" })
      }
    } catch {
      setDeleteId(null)
      toast({ title: "Xóa video thất bại!", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const handleVideoClick = (video: any) => {
    router.push(`/videos/${video.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-4">
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Video của tôi</h1>
              <p className="text-gray-600 mt-1">Quản lý và tổ chức tất cả video của bạn</p>
            </div>
          </div>
          <Button onClick={() => router.push("/add-video")}>Thêm video mới</Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm video, tags..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" />
                      Trạng thái
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilterStatus("all")}>Tất cả</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("completed")}>Đã xử lý</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("processing")}>Đang xử lý</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus("failed")}>Lỗi</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">{videos.length}</div>
              <p className="text-sm text-gray-600">Tổng video</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {videos.filter((v) => v.status === "completed").length}
              </div>
              <p className="text-sm text-gray-600">Đã xử lý</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {videos.filter((v) => v.status === "processing").length}
              </div>
              <p className="text-sm text-gray-600">Đang xử lý</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {videos.filter((v) => v.status === "failed").length}
              </div>
              <p className="text-sm text-gray-600">Lỗi</p>
            </CardContent>
          </Card>
        </div>

        {/* Videos Grid/List */}
        {filteredVideos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Không có video nào</h3>
                <p className="text-sm mb-4">
                  {searchTerm ? "Không tìm thấy video phù hợp với từ khóa tìm kiếm." : "Bạn chưa có video nào. Hãy thêm video đầu tiên!"}
                </p>
                {!searchTerm && (
                  <Button onClick={() => router.push("/add-video")}>
                    Thêm video đầu tiên
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <Play className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  
                  <Badge className={`absolute top-2 left-2 ${getStatusColor(video.status)}`}>
                    {getStatusText(video.status)}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0 bg-black bg-opacity-50 hover:bg-opacity-70"
                      >
                        <MoreVertical className="w-4 h-4 text-white" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleVideoClick(video)}>
                        <Play className="w-4 h-4 mr-2" />
                        Xem video
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Tải xuống
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share className="w-4 h-4 mr-2" />
                        Chia sẻ
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setDeleteId(video.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 cursor-pointer hover:text-blue-600" 
                      onClick={() => handleVideoClick(video)}>
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(video.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleVideoClick(video)}
                      disabled={video.status !== "completed"}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Xem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa video</DialogTitle>
            </DialogHeader>
            <p>Bạn có chắc chắn muốn xóa video này? Hành động này không thể hoàn tác.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                Hủy
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 