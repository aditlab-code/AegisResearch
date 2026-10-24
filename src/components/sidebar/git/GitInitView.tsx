import React from "react";
import { FolderGit2, PlusCircle, RefreshCw } from "lucide-react";

export interface GitInitViewProps {
  projectName: string;
  isInitializing: boolean;
  onInit: () => void;
}

export const GitInitView: React.FC<GitInitViewProps> = ({
  projectName,
  isInitializing,
  onInit,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none">
      <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
        <FolderGit2 className="size-6 text-[#4078f2] dark:text-[#61afef]" />
      </div>
      <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
        Git Repository Not Initialized
      </h4>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
        Workspace "{projectName}" is not tracked with Git yet. Initialize now to
        track document revisions and history.
      </p>

      <button
        type="button"
        onClick={onInit}
        disabled={isInitializing}
        className="w-full py-2 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] disabled:opacity-50 text-white dark:text-zinc-950 rounded-md text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
      >
        {isInitializing ? (
          <>
            <RefreshCw className="size-3.5 animate-spin" />
            Initializing...
          </>
        ) : (
          <>
            <PlusCircle className="size-3.5" />
            Initialize Git Repository
          </>
        )}
      </button>
    </div>
  );
};
