import { apiClient } from './api'
import { SearchResponse } from '../types'

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
}
