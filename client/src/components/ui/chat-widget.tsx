import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'

interface ChatMessage {
  id: string
  role: 'child' | 'agent'
  content: string
  timestamp: string
  type?: string
}

interface ChatWidgetProps {
  childId: string
  childName: string
}

export function ChatWidget({ childId, childName }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const ws = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  // Load chat history when widget opens
  useEffect(() => {
    if (isOpen && childId) {
      loadChatHistory()
      connectWebSocket()
    }
    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [isOpen, childId])

  const loadChatHistory = async () => {
    try {
      const response = await apiRequest('GET', `/api/chat/history?childId=${childId}&limit=50`)
      if (response.ok) {
        const history = await response.json()
        setMessages(history.reverse()) // Most recent at bottom
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const connectWebSocket = () => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`
    
    try {
      ws.current = new WebSocket(wsUrl)
      
      ws.current.onopen = () => {
        setIsConnected(true)
        // Authenticate the connection
        ws.current?.send(JSON.stringify({
          type: 'auth',
          childId
        }))
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'agent_message') {
            const newMessage: ChatMessage = {
              id: Date.now().toString(),
              role: 'agent',
              content: data.content,
              timestamp: data.timestamp || new Date().toISOString(),
              type: data.messageType
            }
            setMessages(prev => [...prev, newMessage])
          } else if (data.type === 'error') {
            toast({
              title: "Chat Error",
              description: data.content,
              variant: "destructive"
            })
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onclose = () => {
        setIsConnected(false)
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (isOpen) {
            connectWebSocket()
          }
        }, 3000)
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
      setIsConnected(false)
    }
  }

  const sendMessage = () => {
    if (!inputValue.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) {
      return
    }

    const message = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'child',
      content: message,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    // Send to agent via WebSocket
    ws.current.send(JSON.stringify({
      type: 'chat',
      childId,
      message
    }))

    // Reset loading state after a short delay
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full w-14 h-14 shadow-lg transition-all duration-200 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        }`}
        data-testid="chat-toggle-button"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-500 text-white text-xs">
                  CC
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm" data-testid="chat-agent-title">TaskTitan Agent</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isConnected ? '🟢 Online' : '🔴 Connecting...'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" data-testid="chat-messages">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'child' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.role === 'child'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                    data-testid={`chat-message-${message.role}`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'child' 
                        ? 'text-blue-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Hi ${childName}! Ask me anything...`}
                className="flex-1"
                disabled={!isConnected}
                data-testid="chat-input"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || !isConnected}
                size="sm"
                className="px-3"
                data-testid="chat-send-button"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}