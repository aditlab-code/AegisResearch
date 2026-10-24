import { GitCommitNode, GitLogResponse } from "../../../types";

export const LANE_COLORS = [
  "#4078f2",
  "#98c379",
  "#e5c07b",
  "#c678dd",
  "#e06c75",
  "#56b6c2",
];

export const LANE_WIDTH = 12;
export const ROW_HEIGHT = 34;

export interface GitFileChange {
  status: string;
  path: string;
  staged: boolean;
}

export interface GitStatusData {
  isGitRepo: boolean;
  branch: string | null;
  modifiedCount: number;
  files: GitFileChange[];
  staged: GitFileChange[];
  unstaged: GitFileChange[];
}

export interface GitBranchesData {
  branches: string[];
  current: string;
}

export interface GitCommitGraphNode extends GitCommitNode {}

export interface GraphMetrics {
  laneWidth: number;
  rowHeight: number;
  nodeRadius: number;
}

export type { GitCommitNode, GitLogResponse };
