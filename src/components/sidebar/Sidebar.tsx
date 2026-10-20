import React from "react";
import {
  Doc,
  PanelType,
  ChatMessage,
  FileNode,
  OutlineNode,
  WorkspaceEntry,
} from "../../types";
import { FileTree } from "./FileTree";
import { OutlineView } from "./OutlineView";
import { AIAssistantPanel } from "./AIAssistantPanel";
import { SearchPanel } from "./SearchPanel";
import { ReviewNotesPanel } from "./ReviewNotesPanel";
import { GitTrackPanel } from "./GitTrackPanel";

export interface SidebarProps {
  panel: PanelType;
  docs: Doc[];
  activeDocIndex: number;
  activeDocName?: string;
  outlineTree?: OutlineNode[];
  onNavigateOutline?: (lineNumber: number) => void;
  chat: ChatMessage[];
  projectName?: string;
  searchQuery?: string;
  onSelectDoc: (index: number) => void;
  onSelectFile?: (file: FileNode) => void;
  onSelectProject?: (project: string) => void;
  onCreateProject?: (name: string) => Promise<void>;
  onSendMessage: (text: string) => void;
  onInsertCodeSnippet: (code: string) => void;
  onChangeSearch?: (val: string) => void;
  onSelectSearchResult?: (filePath: string, lineNumber: number) => void;
  activeDocContent?: string;
  onJumpToNoteLine?: (line: number) => void;
  onDeleteFile?: (filePath: string) => void;
  onRefreshDocs?: () => void;
  onOpenWorkspace?: (workspace: WorkspaceEntry) => void;
  rootDocument?: string;
  onSetRootDocument?: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  panel,
  docs,
  activeDocIndex,
  activeDocName,
  outlineTree = [],
  onNavigateOutline,
  chat,
  projectName,
  searchQuery,
  onSelectDoc,
  onSelectFile,
  onSelectProject,
  onCreateProject,
  onSendMessage,
  onInsertCodeSnippet,
  onChangeSearch,
  onSelectSearchResult,
  activeDocContent = "",
  onJumpToNoteLine = () => {},
  onDeleteFile,
  onRefreshDocs,
  onOpenWorkspace,
  rootDocument,
  onSetRootDocument,
}) => {
  return (
    <aside className="w-full h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-3 text-sm flex flex-col overflow-hidden text-zinc-800 dark:text-zinc-200">
      <div className="flex-1 overflow-auto min-h-0">
        <div className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold mb-2">
          {panel === "ai"
            ? "AI Assistant (Coming Soon)"
            : panel === "git"
              ? "Track Changes (Git)"
              : panel === "review"
                ? "Review Notes & TODOs"
                : panel}
        </div>
        {panel === "files" && (
          <FileTree
            docs={docs}
            activeDocIndex={activeDocIndex}
            projectName={projectName}
            onSelectDoc={onSelectDoc}
            onSelectFile={onSelectFile}
            onSelectProject={onSelectProject}
            onCreateProject={onCreateProject}
            onDeleteFile={onDeleteFile}
            onOpenWorkspace={onOpenWorkspace}
            rootDocument={rootDocument}
            onSetRootDocument={onSetRootDocument}
          />
        )}
        {panel === "outline" && (
          <OutlineView
            outlineTree={outlineTree}
            onNavigate={onNavigateOutline}
            activeDocName={activeDocName}
          />
        )}
        {panel === "ai" && (
          <AIAssistantPanel
            chat={chat}
            onSendMessage={onSendMessage}
            onInsertCodeSnippet={onInsertCodeSnippet}
          />
        )}
        {panel === "search" && (
          <SearchPanel
            value={searchQuery}
            projectName={projectName}
            onChange={onChangeSearch}
            onSelectMatch={onSelectSearchResult}
            onRefreshDocs={onRefreshDocs}
          />
        )}
        {panel === "review" && (
          <ReviewNotesPanel
            content={activeDocContent}
            onJumpToLine={onJumpToNoteLine}
          />
        )}
        {panel === "git" && (
          <GitTrackPanel
            projectName={projectName || "template-thesis"}
            onSelectFile={(fp) => {
              const found = docs.find(
                (d) => d.name === fp || d.name.endsWith(fp),
              );
              if (found && onSelectFile) {
                onSelectFile({ name: found.name, path: fp, kind: found.kind });
              }
            }}
          />
        )}
      </div>

      {/* Pinned Centered Copyright Footer */}
      <footer className="pt-2.5 mt-2 border-t border-zinc-200 dark:border-zinc-800 shrink-0 text-center select-none">
        <a
          href="https://github.com/aditlab-code"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors font-mono"
        >
          <span>github.com/aditlab-code</span>
        </a>
      </footer>
    </aside>
  );
};
