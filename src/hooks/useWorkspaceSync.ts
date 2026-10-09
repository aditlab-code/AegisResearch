import { useEffect } from 'react'
import { workspaceWsService } from '../services/websocket'

export function useWorkspaceSync(projectName: string, onFilesystemChange: () => void) {
  useEffect(() => {
    if (!projectName) return

    workspaceWsService.connect(projectName)

    const unsubscribe = workspaceWsService.subscribe((msg) => {
      if (msg.type === 'FS_CHANGED' && (!msg.project || msg.project === projectName)) {
        onFilesystemChange()
      }
    })

    return () => {
      unsubscribe()
      // Disconnect when switching project or unmounting
      workspaceWsService.disconnect()
    }
  }, [projectName, onFilesystemChange])
}
