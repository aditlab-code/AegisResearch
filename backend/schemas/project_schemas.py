from pydantic import BaseModel, Field


class ProjectCreateRequest(BaseModel):
    name: str = Field(
        ..., min_length=1, max_length=120, description="Project directory name"
    )


class FileNodeResponse(BaseModel):
    name: str
    path: str
    kind: str = "other"
    size: int = 0
    updatedAt: str | None = None


class TreeNodeResponse(BaseModel):
    id: str
    name: str
    path: str
    type: str  # "file" or "folder"
    kind: str | None = None
    size: int | None = 0
    updatedAt: str | None = None
    children: list["TreeNodeResponse"] | None = None


class OpenDialogResponse(BaseModel):
    selected_path: str | None = None
    cancelled: bool = False
    requires_manual_input: bool = False


class OpenWorkspaceRequest(BaseModel):
    path: str = Field(
        ...,
        min_length=1,
        description="Absolute or home-relative path to project folder",
    )
    custom_root: str | None = None


class WorkspaceDetailResponse(BaseModel):
    id: str
    name: str
    path: str
    root_file: str | None = None
    last_opened: float


class FolderCreateRequest(BaseModel):
    path: str = Field(..., min_length=1, description="Relative path for the new folder")


class FileCreateRequest(BaseModel):
    path: str = Field(..., min_length=1, description="Relative path for the new file")
    content: str | None = ""


class CompileRequest(BaseModel):
    mainFile: str = "main.tex"
    engine: str = "pdfLaTeX"


class CompileResponse(BaseModel):
    success: bool
    message: str
    pdfUrl: str | None = None
    errors: list[str] = []
    logOutput: str | None = None


class SyncTeXInverseRequest(BaseModel):
    pdfName: str = Field(..., description="PDF file name, e.g. main.pdf")
    page: int = Field(..., ge=1, description="1-based page number")
    x: float = Field(..., description="X coordinate in 72-DPI points")
    y: float = Field(..., description="Y coordinate in 72-DPI points")


class SyncTeXInverseResponse(BaseModel):
    success: bool
    file: str | None = None
    line: int | None = None
    column: int | None = None
    message: str | None = None


class SyncTeXForwardRequest(BaseModel):
    pdfName: str = Field(..., description="PDF file name, e.g. main.pdf")
    file: str = Field(..., description="LaTeX source file path, e.g. main.tex")
    line: int = Field(..., ge=1, description="1-based line number")
    column: int = Field(default=1, ge=1, description="1-based column number")


class SyncTeXForwardResponse(BaseModel):
    success: bool
    page: int | None = None
    x: float | None = None
    y: float | None = None
    width: float | None = None
    height: float | None = None
    message: str | None = None


class SearchMatchItem(BaseModel):
    lineNumber: int
    lineText: str
    matchStart: int
    matchEnd: int


class SearchFileItem(BaseModel):
    filePath: str
    fileName: str
    kind: str
    matchCount: int
    matches: list[SearchMatchItem]


class SearchProjectResponse(BaseModel):
    query: str
    totalMatches: int
    fileCount: int
    results: list[SearchFileItem]


class SearchReplaceRequest(BaseModel):
    query: str
    replaceWith: str = ""
    caseSensitive: bool = False
    filePath: str | None = None
    lineNumber: int | None = None
    matchStart: int | None = None
    matchEnd: int | None = None


class SearchReplaceResponse(BaseModel):
    success: bool
    message: str
    replacedCount: int
    modifiedFiles: list[str]


class FileContentResponse(BaseModel):
    name: str
    path: str
    content: str
    size: int
    updatedAt: str | None = None


class FileSaveRequest(BaseModel):
    content: str


class FileSaveResponse(BaseModel):
    success: bool
    message: str
    path: str
    size: int
    updatedAt: str


class ProjectResponse(BaseModel):
    name: str
    rootPath: str
    files: list[FileNodeResponse] = []
    activeFile: str | None = None
