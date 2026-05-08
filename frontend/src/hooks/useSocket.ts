import { useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

let socketInstance: Socket | null = null

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

export function useSocket() {
  const socket = getSocket()

  const on = useCallback(<T>(event: string, handler: (data: T) => void) => {
    socket.on(event, handler)
    return () => { socket.off(event, handler) }
  }, [socket])

  const emit = useCallback((event: string, data?: unknown) => {
    socket.emit(event, data)
  }, [socket])

  return { socket, on, emit, connected: socket.connected }
}
