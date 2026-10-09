import { apiClient } from './api'
import { SearchResponse, SearchReplaceRequest, SearchReplaceResponse } from '../types'

export const searchService = {
  async searchProject(
    projectName: string,
    query: string,
    caseSensitive: boolean = false,
  ): Promise<SearchResponse> {
    const stripped = query.trim()
    if (stripped.length < 5) {
      return {
        query: stripped,
        totalMatches: 0,
        fileCount: 0,
        results: [],
      }
    }

    return apiClient.get<SearchResponse>(
      `/api/projects/${encodeURIComponent(projectName)}/search?q=${encodeURIComponent(
        stripped,
      )}&case_sensitive=${caseSensitive}`,
    )
  },

  async replaceMatches(
    projectName: string,
    req: SearchReplaceRequest,
  ): Promise<SearchReplaceResponse> {
    return apiClient.post<SearchReplaceResponse>(
      `/api/projects/${encodeURIComponent(projectName)}/search/replace`,
      req,
    )
  },
}
