"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { VideoPlayer } from "@/components/video-player"


export default function VidesoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [video, setVideo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { id } = use(params)

  useEffect(() => {
    const fetchVideo = async () => {
      const token = localStorage.getItem("token") || ""
      try {
        const res = await api.videos.getById(id, token)
        console.log(res)
        setVideo(res.video || res)
      } catch {
        router.replace("/404")
      } finally {
        setLoading(false)
      }
    }
    fetchVideo() //vl het cuu:))
  }, [id, router])

  if (loading) return <div>Đang tải...</div>
  if (!video) return <div>Không tìm thấy video.</div>

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
      <VideoPlayer video={video} onBack={() => router.back()} />
      <div className="mt-4 text-gray-700">{video.description}</div>
      <div className="mt-2 text-sm text-gray-500">Trạng thái: {video.status}</div>
    </div>
  )
} 