"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Mic,
  MicOff,
  FileText,
  MessageCircle,
  Settings,
  Download,
  Share,
  Heart,
  Clock,
  Users,
  Brain,
} from "lucide-react"
import { api } from "@/lib/api"
import { Progress } from "@/components/ui/progress"

interface VideoPlayerProps {
  video: any
  onBack: () => void
}

function extractYouTubeId(url: string) {
  const match = url.match(/(?:v=|be\/|embed\/)([\w-]{11})/);
  return match ? match[1] : "";
}

// Hàm chuyển đổi Google Drive URL thành direct link
function getGoogleDriveDirectUrl(url: string): string {
  // Nếu là Google Drive sharing URL
  if (url.includes('drive.google.com/file/d/')) {
    const fileId = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)?.[1];
    if (fileId) {
      // Sử dụng export=preview để phát trực tiếp
      // return `https://drive.google.com/uc?export=preview&id=${fileId}`;
      return `https://drive.google.com/file/d/${fileId}/preview`
    }
  }
  // Nếu là direct URL với id
  if (url.includes('uc?export=download') || url.includes('uc?export=preview')) {
    // Đảm bảo dùng export=preview
    return url.replace('export=download', 'export=preview');
  }
  // Nếu là Google Drive view URL
  if (url.includes('drive.google.com/open?id=')) {
    const fileId = url.match(/id=([a-zA-Z0-9-_]+)/)?.[1];
    if (fileId) {
      return `https://drive.google.com/uc?export=preview&id=${fileId}`;
    }
  }
  return url;
}

export function VideoPlayer({ video: initialVideo, onBack }: VideoPlayerProps) {
  const [video, setVideo] = useState(initialVideo)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(180) // 3 minutes for demo
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [isNarrating, setIsNarrating] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)

  // Polling trạng thái video
  useEffect(() => {
    if (!video?.id || video.status === 'processed') return;
    const token = localStorage.getItem('token') || '';
    const interval = setInterval(async () => {
      try {
        const res = await api.videos.getStatus(video.id, token)
        if (res?.video?.status === 'processed') {
          setVideo((v: any) => ({ ...v, status: 'processed' }))
          clearInterval(interval)
        }
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [video?.id, video?.status])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const aiSummary = {
    overview:
      "Video này giới thiệu các khái niệm cơ bản về Machine Learning, bao gồm supervised learning, unsupervised learning và reinforcement learning.",
    keyPoints: [
      "Định nghĩa và phân loại Machine Learning",
      "Các thuật toán cơ bản: Linear Regression, Decision Tree",
      "Ứng dụng thực tế trong đời sống",
      "Tools và frameworks phổ biến",
    ],
    timestamps: [
      { time: "0:30", content: "Giới thiệu Machine Learning" },
      { time: "5:15", content: "Supervised Learning" },
      { time: "12:45", content: "Unsupervised Learning" },
      { time: "20:30", content: "Reinforcement Learning" },
      { time: "28:00", content: "Ứng dụng thực tế" },
    ],
  }

  const handleDownloadTranscript = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/videos/${video.id}/transcript`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Không tìm thấy transcript');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript_${video.id}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Tải xuống thất bại!');
    }
  };

 //
  
  // Xác định video source //bug j o da
  const getVideoSource = () => {
    if (video?.type === "youtube") {
      return null; // Sẽ render iframe riêng
    }
    if (video?.file_url) {
      return getGoogleDriveDirectUrl(video.file_url);
    }
    if (video?.type === "local") {
      return video.file_url
    }
    
    // Fallback về API stream
    if (video?.id) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/videos/${video.id}/stream?token=${localStorage.getItem('token') || ''}`;
    }
    //cho no chieu len do
    return null;
  };

  const videoSource = getVideoSource();
  console.log(video)

  if (video?.type === "youtube") {
    const videoId = extractYouTubeId(video.url);
    return (
      <div>
        <button onClick={onBack}>Quay lại</button>
        <iframe
          width="100%"
          height="480"
          src={`https://www.youtube.com/embed/${videoId}`}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="YouTube video"
        />
        {/* Các phần tóm tắt, chat, timeline để sau */}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{video?.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {video?.duration}
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {video?.views} lượt xem
              </span>
              <Badge variant="secondary">AI Processed</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Heart className="w-4 h-4 mr-2" />
            Yêu thích
          </Button>
          <Button variant="outline" size="sm" disabled={video.status !== 'processed'}>
            <Share className="w-4 h-4 mr-2" />
            Chia sẻ
          </Button>
          <Button variant="outline" size="sm" disabled={video.status !== 'processed'}>
            <Download className="w-4 h-4 mr-2" />
            Tải về
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="relative bg-black rounded-lg overflow-hidden">
                {video.status==="processing" && video.processing_progress === 0 && !videoSource ? (
                  <div className="flex flex-col items-center justify-center h-64 text-lg text-gray-500 w-full">
                    <Progress value={video.processing_progress || 0} className="w-1/2 mb-4" />
                    <div>
                      Đang xử lý... {video.processing_progress ? `${video.processing_progress}%` : ""}
                    </div>
                    <div className="text-sm mt-2">
                      {video.processing_started_at && (
                        <span>Bắt đầu lúc: {new Date(video.processing_started_at).toLocaleTimeString()}</span>
                      )}
                      {video.estimated_finish_at && (
                        <span> - Ước tính xong lúc: {new Date(video.estimated_finish_at).toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                ) : videoSource ? (
                  videoSource.includes('drive.google.com') ? (
                    <iframe
                      src={videoSource}
                      className="w-full aspect-video"
                      allow="autoplay"
                      allowFullScreen
                    />
                  ) : (
                    <video 
                      ref={videoRef} 
                      className="w-full aspect-video" 
                      poster={video?.thumbnail_url || video?.thumbnail} 
                      controls
                      onLoadedMetadata={() => {
                        if (videoRef.current) {
                          setDuration(videoRef.current.duration);
                        }
                      }}
                      onTimeUpdate={() => {
                        if (videoRef.current) {
                          setCurrentTime(videoRef.current.currentTime);
                        }
                      }}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    >
                      <source src={videoSource} type="video/mp4" />
                      <source src={videoSource} type="video/webm" />
                      <source src={videoSource} type="video/ogg" />
                      Trình duyệt của bạn không hỗ trợ video.
                    </video>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-lg text-gray-500 w-full">
                    <div>Không thể phát video</div>
                    <div className="text-sm mt-2">URL video không hợp lệ hoặc không có quyền truy cập</div>
                  </div>
                )}

                {/* Video Controls */}
                {!videoSource?.includes('drive.google.com') && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="space-y-2">
                      {/* Progress Bar */}
                      <Slider
                        value={[currentTime]}
                        max={duration}
                        step={1}
                        className="w-full"
                        onValueChange={(value) => {
                          setCurrentTime(value[0]);
                          if (videoRef.current) {
                            videoRef.current.currentTime = value[0];
                          }
                        }}
                      />

                      {/* Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                            onClick={() => {
                              if (videoRef.current) {
                                if (isPlaying) {
                                  videoRef.current.pause();
                                } else {
                                  videoRef.current.play();
                                }
                              }
                            }}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>

                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-white hover:bg-white/20"
                              onClick={() => {
                                if (videoRef.current) {
                                  videoRef.current.muted = !isMuted;
                                  setIsMuted(!isMuted);
                                }
                              }}
                            >
                              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                            </Button>
                            <Slider
                              value={[volume]}
                              max={100}
                              step={1}
                              className="w-20"
                              onValueChange={(value) => {
                                setVolume(value[0]);
                                if (videoRef.current) {
                                  videoRef.current.volume = value[0] / 100;
                                }
                              }}
                            />
                          </div>

                          <span className="text-white text-sm">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                            <Maximize className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                Điều khiển AI
              </CardTitle>
              <CardDescription>Sử dụng các tính năng AI để tăng cường trải nghiệm xem video</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant={isNarrating ? "default" : "outline"}
                  onClick={() => setIsNarrating(!isNarrating)}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  {isNarrating ? <MicOff className="w-6 h-6 mb-2" /> : <Mic className="w-6 h-6 mb-2" />}
                  <span className="text-sm">{isNarrating ? "Tắt thuyết minh" : "Bật thuyết minh"}</span>
                </Button>

                <Button
                  variant={showSummary ? "default" : "outline"}
                  onClick={() => setShowSummary(!showSummary)}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <FileText className="w-6 h-6 mb-2" />
                  <span className="text-sm">Tóm tắt AI</span>
                </Button>

                <Button variant="outline" className="flex flex-col items-center p-4 h-auto bg-transparent">
                  <MessageCircle className="w-6 h-6 mb-2" />
                  <span className="text-sm">Chat AI</span>
                </Button>
              </div>

              {isNarrating && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🎙️ AI đang thuyết minh: "Trong phần này, chúng ta sẽ tìm hiểu về khái niệm Machine Learning và các
                    ứng dụng thực tế..."
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Tóm tắt</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg font-bold">Tóm tắt AI</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-base font-semibold mt-4 mb-1">Tổng quan</h3>
                  <p className="text-base text-gray-600 mb-4">{aiSummary.overview}</p>
                  <h3 className="text-base font-semibold mt-4 mb-1">Điểm chính</h3>
                  <ul className="text-base text-gray-700 list-disc pl-5 space-y-1">
                    {aiSummary.keyPoints.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chat với AI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 h-64 overflow-y-auto">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="text-sm">Bạn có thể hỏi tôi bất cứ điều gì về video này!</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg ml-4">
                      <p className="text-sm">Machine Learning khác gì với AI?</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="text-sm">
                        Machine Learning là một tập con của AI, tập trung vào việc dạy máy tính học từ dữ liệu mà không cần lập trình rõ ràng.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <input
                      type="text"
                      placeholder="Nhập câu hỏi..."
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    <Button size="sm">Gửi</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiSummary.timestamps.map((timestamp, idx) => (
                      <div key={idx} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {timestamp.time}
                        </span>
                        <span className="text-sm text-gray-700">{timestamp.content}</span>
                      </div>
                    ))}
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
