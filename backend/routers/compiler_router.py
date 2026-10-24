from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from backend.routers.common import resolve_file_path, resolve_project_dir
from backend.schemas.project_schemas import (
    CompileRequest,
    CompileResponse,
    SyncTeXForwardRequest,
    SyncTeXForwardResponse,
    SyncTeXInverseRequest,
    SyncTeXInverseResponse,
)
from backend.services.compiler import compile_latex
from backend.services.synctex import synctex_forward_search, synctex_inverse_search

router = APIRouter()


@router.post(
    "/api/projects/{name}/compile",
    response_model=CompileResponse,
    tags=["Compiler"],
)
async def compile_project(name: str, payload: CompileRequest):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    result = await compile_latex(
        project_dir=project_dir,
        main_file=payload.mainFile,
        engine=payload.engine,
    )

    pdf_url = None
    if result.get("success") and result.get("pdfName"):
        pdf_url = f"/api/projects/{name}/pdf/{result['pdfName']}"

    return CompileResponse(
        success=result["success"],
        message=result["message"],
        pdfUrl=pdf_url,
        errors=result.get("errors", []),
        logOutput=result.get("logOutput"),
    )


@router.api_route(
    "/api/projects/{name}/pdf/{pdf_name}",
    methods=["GET", "HEAD"],
    tags=["Compiler"],
)
async def get_project_pdf(name: str, pdf_name: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    target_pdf = resolve_file_path(project_dir, pdf_name)
    if not target_pdf.exists() or not target_pdf.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PDF file '{pdf_name}' not found. Please compile first.",
        )

    return FileResponse(
        path=str(target_pdf),
        media_type="application/pdf",
        filename=target_pdf.name,
        headers={"Content-Disposition": f"inline; filename={target_pdf.name}"},
    )


@router.post(
    "/api/projects/{name}/synctex/inverse",
    response_model=SyncTeXInverseResponse,
    tags=["SyncTeX"],
)
async def inverse_synctex(name: str, payload: SyncTeXInverseRequest):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    result = await synctex_inverse_search(
        project_dir=project_dir,
        pdf_name=payload.pdfName,
        page=payload.page,
        x=payload.x,
        y=payload.y,
    )
    return SyncTeXInverseResponse(**result)


@router.post(
    "/api/projects/{name}/synctex/forward",
    response_model=SyncTeXForwardResponse,
    tags=["SyncTeX"],
)
async def forward_synctex(name: str, payload: SyncTeXForwardRequest):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    result = await synctex_forward_search(
        project_dir=project_dir,
        pdf_name=payload.pdfName,
        file=payload.file,
        line=payload.line,
        column=payload.column,
    )
    return SyncTeXForwardResponse(**result)
