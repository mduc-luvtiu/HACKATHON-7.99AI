"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Youtube, Upload, Link, FileVideo, CheckCircle, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useRouter } from 'next/navigation'

interface AddVideoProps {
  onBack: () => void
  onSelectVideo: (video: { type: string; url: string }) => void
}

export function AddVideo({ onBack, onSelectVideo }: AddVideoProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [tab, setTab] = useState('upload')

  const handleYouTubeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!youtubeUrl.trim()) return
    setStatus("loading")
    setMessage("")
    setTimeout(() => {
      setStatus("success")
      setMessage("Đã chuyển sang xem video YouTube!")
      onSelectVideo({ type: "youtube", url: youtubeUrl })
    }, 1000)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 5) {
      setUploadProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    setTimeout(() => {
      setIsUploading(false)
      setUploadProgress(0)
      onBack()
    }, 1000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setTab('upload')
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title.trim()) return
    setUploadStatus("loading")
    setUploadMessage("")
    setUploadProgress(0)
    try {
      const token = localStorage.getItem('token')
      const form = new FormData()
      form.append('file', file)
      form.append('title', title)
      form.append('description', description)
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/videos/upload`
      console.log('Uploading to:', apiUrl)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', apiUrl, true)
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
        }
      }
      xhr.onload = () => {
        console.log('XHR loaded:', xhr.status, xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadStatus("success")
          setUploadMessage("Tải video thành công! Đang chuyển hướng...")
          setFile(null)
          setTitle("")
          setDescription("")
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.hash = '';
            }
            if (typeof onBack === 'function') {
              onBack();
            }
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('navigateToMyVideos'));
            }
          }, 1200)
        } else {
          setUploadStatus("error")
          let msg = "Tải video thất bại!"
          try {
            const data = JSON.parse(xhr.responseText)
            msg = data.message || msg
          } catch (e) {
            // Nếu không phải JSON, giữ nguyên msg mặc định
          }
          setUploadMessage(msg)
        }
      }
      xhr.onerror = () => {
        console.log('XHR error')
        setUploadStatus("error")
        setUploadMessage("Tải video thất bại!")
      }
      xhr.send(form)
    } catch (err: any) {
      setUploadStatus("error")
      setUploadMessage(err.message || "Tải video thất bại!")
    }
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thêm video mới</h1>
          <p className="text-gray-600 mt-1">Kết nối YouTube hoặc tải lên video từ máy tính</p>
        </div>
      </div>

      <div className="max-w-4xl">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="youtube" className="flex items-center">
              <Youtube className="w-4 h-4 mr-2" />
              YouTube Link
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Tải lên file
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Youtube className="w-5 h-5 mr-2 text-red-600" />
                  Kết nối YouTube
                </CardTitle>
                <CardDescription>Nhập link YouTube để AI phân tích và xử lý video</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleYouTubeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL YouTube</label>
                    <div className="relative">
                      <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="pl-10"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ghi chú (tùy chọn)</label>
                    <Textarea
                      placeholder="Thêm ghi chú về video này..."
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Đang xử lý video...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {status === "loading" && <div className="text-blue-600 mt-2">Đang xử lý...</div>}
                  {status === "success" && <div className="text-green-600 mt-2">{message}</div>}
                  {status === "error" && <div className="text-red-600 mt-2">{message}</div>}

                  <Button type="submit" disabled={!youtubeUrl.trim() || status === "loading"} className="w-full">
                    {status === "loading" ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Thêm video
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* YouTube Features */}
            <Card>
              <CardHeader>
                <CardTitle>Tính năng AI cho YouTube</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Tự động tóm tắt</h4>
                      <p className="text-sm text-gray-600">AI sẽ tự động tóm tắt nội dung video</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Thuyết minh real-time</h4>
                      <p className="text-sm text-gray-600">Thuyết minh bằng giọng nói tự nhiên</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Chat thông minh</h4>
                      <p className="text-sm text-gray-600">Hỏi đáp về nội dung video</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Phân tích cảm xúc</h4>
                      <p className="text-sm text-gray-600">Hiểu cảm xúc và đề xuất nội dung</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileVideo className="w-5 h-5 mr-2 text-blue-600" />
                  Tải lên video
                </CardTitle>
                <CardDescription>Tải lên video từ máy tính để AI xử lý và phân tích</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleUploadSubmit}>
                  <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center">
                    {file ? (
                      <div className="mb-2">{file.name}</div>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">📹</div>
                        <div className="mb-2">Kéo thả video vào đây</div>
                        <Button type="button" onClick={() => fileInputRef.current?.click()}>Chọn file video</Button>
                        <input type="file" accept="video/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                      </>
                    )}
                  </div>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tiêu đề cho video..." required />
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả nội dung video..." />
                  {uploadStatus === "loading" && (
                    <div className="text-blue-600 mt-2">Đang tải lên...</div>
                  )}
                  {uploadStatus === "success" && (
                    <div className="text-green-600 mt-2">{uploadMessage}</div>
                  )}
                  {uploadStatus === "error" && (
                    <div className="text-red-600 mt-2">{uploadMessage}</div>
                  )}
                  <Button type="submit" disabled={!file || !title.trim() || uploadStatus === "loading"}>
                    {uploadStatus === "loading" ? "Đang tải lên..." : "Tải lên video"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
