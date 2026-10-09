export interface GitCommitNode {
  hash: string
  parents: string[]
  refs: string[]
  isHead: boolean
  message: string
  author: string
  date: string
  graphPrefix: string
  lane: number
}

export interface GitLogResponse {
  commits: GitCommitNode[]
}
