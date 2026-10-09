import { apiClient } from './api'
import { AIRepairRequest, AIRepairResponse } from '../types'

export const aiService = {
  async fixError(request: AIRepairRequest): Promise<AIRepairResponse> {
    return apiClient.post<AIRepairResponse>('/api/ai/fix-error', request)
  },

  async askAssistant(prompt: string, context?: string): Promise<{ text: string; code?: string }> {
    return apiClient.post<{ text: string; code?: string }>('/api/ai/chat', { prompt, context })
  },
}
