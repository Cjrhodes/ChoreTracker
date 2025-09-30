import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'

interface AppChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  createdAt: string
  type?: string
}

interface UniversalChatWidgetProps {
  partyType: 'parent' | 'child'
  partyId: string
  userName: string
}

export function UniversalChatWidget({ partyType, partyId, userName }: UniversalChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<AppChatMessage[]>([])
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

  useEffect(() => {
    if (isOpen && partyId) {
      loadChatHistory()
      connectWebSocket()
    }
    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [isOpen, partyId, partyType])

  const loadChatHistory = async () => {
    try {
      const response = await apiRequest('GET', `/api/app-chat/history?partyType=${partyType}&partyId=${partyId}&limit=50`)
      if (response.ok) {
        const history = await response.json()
        setMessages(history.reverse())
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
        ws.current?.send(JSON.stringify({
          type: 'auth',
          partyType,
          partyId
        }))
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'agent_message') {
            const newMessage: AppChatMessage = {
              id: Date.now().toString(),
              role: 'agent',
              content: data.content,
              createdAt: data.timestamp || new Date().toISOString(),
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

    const userMessage: AppChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])

    ws.current.send(JSON.stringify({
      type: 'chat',
      message
    }))

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

  const placeholderText = partyType === 'child' 
    ? `Hi ${userName}! Ask me anything...`
    : `Hi! How can I help manage your family today?`

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-full w-14 h-14 shadow-lg transition-all duration-200 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
        }`}
        data-testid="universal-chat-toggle-button"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-500 text-white text-xs">
                  CC
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm" data-testid="universal-chat-agent-title">TaskTitan Agent</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isConnected ? '🟢 Online' : '🔴 Connecting...'}
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-3" data-testid="universal-chat-messages">
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                    data-testid={`universal-chat-message-${message.role}`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' 
                        ? 'text-blue-100' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTime(message.createdAt)}
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

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholderText}
                className="flex-1"
                disabled={!isConnected}
                data-testid="universal-chat-input"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || !isConnected}
                size="sm"
                className="px-3"
                data-testid="universal-chat-send-button"
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
