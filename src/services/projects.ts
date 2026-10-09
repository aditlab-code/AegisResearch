import { apiClient } from './api'
import { Project, FileNode, FileTreeNode } from '../types'

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

  async getProjectTree(projectName: string): Promise<FileTreeNode[]> {
    return apiClient.get<FileTreeNode[]>(`/api/projects/${encodeURIComponent(projectName)}/tree`)
  },

  async createFolder(
    projectName: string,
    folderPath: string,
  ): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/folders`,
      { path: folderPath },
    )
  },

  async createFile(
    projectName: string,
    filePath: string,
    content = '',
  ): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files`,
      { path: filePath, content },
    )
  },

  async readFile(projectName: string, filePath: string): Promise<string> {
    const res = await apiClient.get<{ content: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(filePath)}`,
    )
    return res.content
  },

  async saveFile(
    projectName: string,
    filePath: string,
    content: string,
  ): Promise<{ success: boolean; message?: string }> {
    return apiClient.put<{ success: boolean; message?: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(filePath)}`,
      { content },
    )
  },
}
