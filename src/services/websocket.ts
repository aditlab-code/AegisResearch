type Listener = (data: any) => void

class WorkspaceWebSocketService {
  private ws: WebSocket | null = null
  private listeners: Set<Listener> = new Set()
  private currentProject: string | null = null
  private reconnectTimer: any = null
  private pingTimer: any = null

  connect(projectName: string) {
    if (this.currentProject === projectName && this.ws && this.ws.readyState === WebSocket.OPEN) {
      return
    }

    this.disconnect()
    this.currentProject = projectName

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // By default proxy or localhost:8000
    const host = window.location.hostname || 'localhost'
    const port = '8000'
    const wsUrl = `${protocol}//${host}:${port}/api/ws/workspace/${encodeURIComponent(projectName)}`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        // Start ping heartbeat every 20 seconds
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('ping')
          }
        }, 20000)
      }

      this.ws.onmessage = (event) => {
        try {
          if (event.data === 'pong') return
          const payload = JSON.parse(event.data)
          this.listeners.forEach((listener) => listener(payload))
        } catch {
          // ignore non-json messages
        }
      }

      this.ws.onclose = () => {
        this.cleanupTimers()
        // Reconnect after 3s if still on this project
        if (this.currentProject === projectName) {
          this.reconnectTimer = setTimeout(() => {
            this.connect(projectName)
          }, 3000)
        }
      }

      this.ws.onerror = () => {
        // Handled via onclose
      }
    } catch (err) {
      console.warn('WebSocket connection error:', err)
    }
  }

  disconnect() {
    this.cleanupTimers()
    this.currentProject = null
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        // ignore
      }
      this.ws = null
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private cleanupTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }
}

export const workspaceWsService = new WorkspaceWebSocketService()
