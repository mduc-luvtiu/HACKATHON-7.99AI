"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface VideoManagementProps {
  onNavigate: (view: string) => void
  onSelectVideo: (video: any) => void
}

export function VideoManagement({ onNavigate, onSelectVideo }: VideoManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterStatus, setFilterStatus] = useState("all")
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast();

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
      video.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterStatus === "all" || video.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed":
        return "bg-green-500"
      case "processing":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "processed":
        return "Đã xử lý"
      case "processing":
        return "Đang xử lý"
      case "error":
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
      // Có thể show toast lỗi ở đây
      setDeleteId(null)
      toast({ title: "Xóa video thất bại!", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Video của tôi</h1>
          <p className="text-gray-600 mt-1">Quản lý và tổ chức tất cả video của bạn</p>
        </div>
        <Button onClick={() => onNavigate("add-video")}>Thêm video mới</Button>
      </div>

      {/* Search and Filters */}
      <Card>
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
                  <DropdownMenuItem onClick={() => setFilterStatus("processed")}>Đã xử lý</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("processing")}>Đang xử lý</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("error")}>Lỗi</DropdownMenuItem>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{videos.length}</div>
            <p className="text-sm text-gray-600">Tổng video</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {videos.filter((v) => v.status === "processed").length}
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
            <div className="text-2xl font-bold text-blue-600">
              {videos.reduce((sum, v) => sum + v.views, 0).toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Tổng lượt xem</p>
          </CardContent>
        </Card>
      </div>

      {/* Videos Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={video.thumbnail || "/placeholder.svg"}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
                <Badge className={`absolute top-2 left-2 ${getStatusColor(video.status)}`}>
                  {getStatusText(video.status)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-75"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="w-4 h-4 mr-2" />
                      Chia sẻ
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Tải về
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(video.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{video.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.aiSummary}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {(video.tags?.slice(0, 2) || []).map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {video.tags?.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{video.tags.length - 2}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {Number.isFinite(Number(video.views)) ? Number(video.views).toLocaleString() : '0'}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(video.uploadDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    onSelectVideo(video)
                    onNavigate("video-player")
                  }}
                  disabled={video.status !== "processed"}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {video.status === "processed" ? "Xem video" : "Đang xử lý..."}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredVideos.map((video) => (
                <div key={video.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        className="w-24 h-16 object-cover rounded"
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                        {video.duration}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{video.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{video.aiSummary}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {Number.isFinite(Number(video.views)) ? Number(video.views).toLocaleString() : '0'}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(video.uploadDate).toLocaleDateString("vi-VN")}
                        </span>
                        <Badge className={`${getStatusColor(video.status)} text-white`}>
                          {getStatusText(video.status)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(video.tags || []).map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          onSelectVideo(video)
                          onNavigate("video-player")
                        }}
                        disabled={video.status !== "processed"}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Xem
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="w-4 h-4 mr-2" />
                            Chia sẻ
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Tải về
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteId(video.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredVideos.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy video</h3>
            <p className="text-gray-600 mb-4">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
            <Button onClick={() => setSearchTerm("")}>Xóa bộ lọc</Button>
          </CardContent>
        </Card>
      )}

      {/* Popup xác nhận xóa */}
      <Dialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bạn có chắc muốn xóa video này?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
