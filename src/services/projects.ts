import { apiClient } from "./api";
import {
  Project,
  FileNode,
  FileTreeNode,
  WorkspaceEntry,
  OpenDialogResult,
} from "../types";

export const projectService = {
  async listProjects(): Promise<string[]> {
    return apiClient.get<string[]>("/api/projects");
  },

  async openFolderDialog(): Promise<OpenDialogResult> {
    return apiClient.post<OpenDialogResult>("/api/workspaces/open-dialog");
  },

  async openWorkspace(
    path: string,
    customRoot?: string,
  ): Promise<WorkspaceEntry> {
    return apiClient.post<WorkspaceEntry>("/api/workspaces/open", {
      path,
      custom_root: customRoot,
    });
  },

  async getRecentWorkspaces(): Promise<WorkspaceEntry[]> {
    return apiClient.get<WorkspaceEntry[]>("/api/workspaces/recent");
  },

  async removeRecentWorkspace(
    workspaceId: string,
  ): Promise<{ status: string; removed_id: string }> {
    return apiClient.delete<{ status: string; removed_id: string }>(
      `/api/workspaces/${encodeURIComponent(workspaceId)}`,
    );
  },

  async createProject(name: string): Promise<Project> {
    return apiClient.post<Project>("/api/projects", { name });
  },

  async getProjectFiles(projectName: string): Promise<FileNode[]> {
    return apiClient.get<FileNode[]>(
      `/api/projects/${encodeURIComponent(projectName)}/files`,
    );
  },

  async getProjectTree(projectName: string): Promise<FileTreeNode[]> {
    return apiClient.get<FileTreeNode[]>(
      `/api/projects/${encodeURIComponent(projectName)}/tree`,
    );
  },

  async createFolder(
    projectName: string,
    folderPath: string,
  ): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/folders`,
      { path: folderPath },
    );
  },

  async createFile(
    projectName: string,
    filePath: string,
    content = "",
  ): Promise<{ success: boolean; message?: string }> {
    return apiClient.post<{ success: boolean; message?: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files`,
      { path: filePath, content },
    );
  },

  async readFile(projectName: string, filePath: string): Promise<string> {
    const res = await apiClient.get<{ content: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(filePath)}`,
    );
    return res.content;
  },

  async saveFile(
    projectName: string,
    filePath: string,
    content: string,
  ): Promise<{ success: boolean; message?: string }> {
    return apiClient.put<{ success: boolean; message?: string }>(
      `/api/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(filePath)}`,
      { content },
    );
  },

  async deleteFile(
    projectName: string,
    filePath: string,
  ): Promise<{ success: boolean; message?: string; path?: string }> {
    return apiClient.delete<{
      success: boolean;
      message?: string;
      path?: string;
    }>(
      `/api/projects/${encodeURIComponent(projectName)}/files/${encodeURIComponent(filePath)}`,
    );
  },
};
