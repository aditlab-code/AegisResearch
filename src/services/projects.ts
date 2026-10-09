import { apiClient } from './api'
import { Project, FileNode } from '../types'

export const projectService = {
  async listProjects(): Promise<string[]> {
    return apiClient.get<string[]>('/api/projects')
  },

  async createProject(name: string): Promise<Project> {
    return apiClient.post<Project>('/api/projects', { name })
  },

  async getProjectFiles(projectName: string): Promise<FileNode[]> {
    return apiClient.get<FileNode[]>(`/api/projects/${encodeURIComponent(projectName)}/files`)
  },

  async readFile(projectName: string, filePath: string): Promise<string> {
    return apiClient.get<string>(
      `/api/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(filePath)}`,
    )
  },

  async saveFile(projectName: string, filePath: string, content: string): Promise<{ success: boolean }> {
    return apiClient.put<{ success: boolean }>(
      `/api/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(filePath)}`,
      { content },
    )
  },
}
