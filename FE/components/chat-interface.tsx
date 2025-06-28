"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  ImageIcon,
  Paperclip,
  Mic,
  MicOff,
  Bot,
  User,
  Heart,
  ThumbsUp,
  Share,
  Smile,
  Camera,
} from "lucide-react"

export function ChatInterface() {
  const [message, setMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [selectedChat, setSelectedChat] = useState("ai-assistant")

  const chatHistory = [
    {
      id: 1,
      type: "ai",
      message:
        "Xin chào! Tôi là AI Assistant của bạn. Tôi có thể giúp bạn phân tích video, trả lời câu hỏi về nội dung, và đưa ra gợi ý dựa trên sở thích của bạn. Bạn muốn tôi giúp gì?",
      timestamp: "10:30",
      reactions: [],
    },
    {
      id: 2,
      type: "user",
      message: "Tôi vừa xem video về Machine Learning. Bạn có thể giải thích thêm về Deep Learning không?",
      timestamp: "10:32",
      reactions: [],
    },
    {
      id: 3,
      type: "ai",
      message:
        "Deep Learning là một nhánh con của Machine Learning, sử dụng mạng neural nhân tạo với nhiều lớp ẩn để học các đặc trưng phức tạp từ dữ liệu. Dựa trên video bạn vừa xem, tôi có thể thấy bạn quan tâm đến các khái niệm cơ bản. Bạn có muốn tôi gợi ý một số video về Deep Learning phù hợp với trình độ hiện tại không?",
      timestamp: "10:33",
      reactions: [{ type: "like", count: 1 }],
      suggestions: ["Gợi ý video Deep Learning cơ bản", "So sánh ML vs DL", "Ứng dụng thực tế của Deep Learning"],
    },
    {
      id: 4,
      type: "user",
      message: "Có, tôi muốn xem video về Deep Learning cơ bản",
      timestamp: "10:35",
      reactions: [],
    },
    {
      id: 5,
      type: "ai",
      message: "Tuyệt vời! Dựa trên phân tích cảm xúc và sở thích của bạn, tôi đề xuất 3 video phù hợp:",
      timestamp: "10:36",
      reactions: [],
      videoSuggestions: [
        {
          title: "Deep Learning cho người mới bắt đầu",
          duration: "35:20",
          difficulty: "Cơ bản",
          thumbnail: "/placeholder.svg?height=80&width=120",
        },
        {
          title: "Neural Networks explained",
          duration: "42:15",
          difficulty: "Trung bình",
          thumbnail: "/placeholder.svg?height=80&width=120",
        },
      ],
    },
  ]

  const activeChats = [
    {
      id: "ai-assistant",
      name: "AI Assistant",
      type: "ai",
      lastMessage: "Tôi đề xuất 3 video phù hợp...",
      timestamp: "10:36",
      unread: 0,
      avatar: "🤖",
    },
    {
      id: "video-ml-basic",
      name: "ML Basic Discussion",
      type: "group",
      lastMessage: "Ai có thể giải thích về overfitting?",
      timestamp: "10:25",
      unread: 3,
      avatar: "👥",
    },
    {
      id: "react-hooks-chat",
      name: "React Hooks Chat",
      type: "group",
      lastMessage: "useEffect dependency array...",
      timestamp: "09:45",
      unread: 1,
      avatar: "⚛️",
    },
  ]

  const handleSendMessage = () => {
    if (message.trim()) {
      // Add message logic here
      setMessage("")
    }
  }

  const handleReaction = (messageId: number, reactionType: string) => {
    // Add reaction logic here
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chat AI</h1>
          <p className="text-gray-600 mt-1">Tương tác thông minh với nội dung video</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Chat List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Cuộc trò chuyện</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {activeChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 ${
                      selectedChat === chat.id ? "border-blue-500 bg-blue-50" : "border-transparent"
                    }`}
                    onClick={() => setSelectedChat(chat.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{chat.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm truncate">{chat.name}</h3>
                          <span className="text-xs text-gray-500">{chat.timestamp}</span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">{chat.lastMessage}</p>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {chat.type === "ai" ? "AI" : "Nhóm"}
                          </Badge>
                          {chat.unread > 0 && <Badge className="bg-red-500 text-white text-xs">{chat.unread}</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🤖</div>
                  <div>
                    <CardTitle className="text-lg">AI Assistant</CardTitle>
                    <CardDescription>Trợ lý AI thông minh</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-500">Online</Badge>
                </div>
              </div>
            </CardHeader>

            {/* Chat Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] ${msg.type === "user" ? "order-2" : "order-1"}`}>
                    <div
                      className={`p-3 rounded-lg ${
                        msg.type === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>

                      {/* AI Suggestions */}
                      {msg.suggestions && (
                        <div className="mt-3 space-y-2">
                          {msg.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="w-full text-left justify-start bg-white text-gray-700 hover:bg-gray-50"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Video Suggestions */}
                      {msg.videoSuggestions && (
                        <div className="mt-3 space-y-2">
                          {msg.videoSuggestions.map((video, index) => (
                            <div key={index} className="bg-white p-3 rounded border">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={video.thumbnail || "/placeholder.svg"}
                                  alt={video.title}
                                  className="w-16 h-10 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm text-gray-900">{video.title}</h4>
                                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                                    <span>{video.duration}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {video.difficulty}
                                    </Badge>
                                  </div>
                                </div>
                                <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                                  Xem
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{msg.timestamp}</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(msg.id, "like")}
                          className="h-6 px-2"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          {msg.reactions?.find((r) => r.type === "like")?.count || ""}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReaction(msg.id, "heart")}
                          className="h-6 px-2"
                        >
                          <Heart className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          <Share className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                      msg.type === "user" ? "order-1 mr-2 bg-blue-500 text-white" : "order-2 ml-2 bg-gray-300"
                    }`}
                  >
                    {msg.type === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                </div>
              ))}
            </CardContent>

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ImageIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Camera className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="w-4 h-4" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    placeholder="Nhập tin nhắn hoặc hỏi về video..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="pr-12"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRecording(!isRecording)}
                  className={isRecording ? "text-red-500" : ""}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>

                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {isRecording && (
                <div className="mt-2 p-2 bg-red-50 rounded-lg flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-700">Đang ghi âm...</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
