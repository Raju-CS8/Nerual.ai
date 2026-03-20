import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socketInstance = null

export const useSocket = (workspaceId, userName, callbacks) => {
  const callbacksRef = useRef(callbacks)

  // ✅ Fix — update ref inside useEffect not during render
  useEffect(() => {
    callbacksRef.current = callbacks
  })

  useEffect(() => {
    if (!workspaceId) return

    if (socketInstance) {
      socketInstance.disconnect()
      socketInstance = null
    }

    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })

    const socket = socketInstance

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      socket.emit('join_workspace', { workspaceId, userName })
    })

    socket.on('new_message', (data) => callbacksRef.current.onNewMessage(data))
    socket.on('users_online', (data) => callbacksRef.current.onUsersOnline(data))
    socket.on('user_joined', (data) => callbacksRef.current.onUserJoined(data))
    socket.on('user_left', (data) => callbacksRef.current.onUserLeft(data))
    socket.on('user_typing', (data) => callbacksRef.current.onUserTyping(data))
    socket.on('user_stop_typing', () => callbacksRef.current.onUserStopTyping())
    socket.on('workspace_updated', (data) => callbacksRef.current.onWorkspaceUpdated(data))

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message)
    })

    return () => {
      socket.disconnect()
      socketInstance = null
    }
  }, [workspaceId, userName])

  const emitMessage = (event, data) => {
    if (socketInstance?.connected) {
      socketInstance.emit(event, data)
    }
  }

  return { emitMessage }
}