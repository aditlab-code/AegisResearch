from pydantic import BaseModel


class GitFileChange(BaseModel):
    status: str
    path: str
    staged: bool = False


class GitStatusResponse(BaseModel):
    isGitRepo: bool
    branch: str | None = None
    modifiedCount: int
    files: list[GitFileChange] = []
    staged: list[GitFileChange] = []
    unstaged: list[GitFileChange] = []


class GitStageRequest(BaseModel):
    file: str | None = None
    all: bool = False


class GitUnstageRequest(BaseModel):
    file: str | None = None
    all: bool = False


class GitDiscardRequest(BaseModel):
    file: str


class GitCommitRequest(BaseModel):
    message: str
    smartCommit: bool = True


class GitCheckoutRequest(BaseModel):
    branch: str


class GitCreateBranchRequest(BaseModel):
    name: str
    checkout: bool = True


class GitCommitNode(BaseModel):
    hash: str
    parents: list[str] = []
    refs: list[str] = []
    isHead: bool = False
    message: str
    author: str
    date: str
    graphPrefix: str = "*"
    lane: int = 0


class GitLogResponse(BaseModel):
    commits: list[GitCommitNode]
