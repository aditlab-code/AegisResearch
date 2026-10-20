import asyncio
import logging
import os
import shutil
from pathlib import Path
from typing import Optional

logger = logging.getLogger("os_dialog")


async def pick_directory_native() -> Optional[str]:
    """
    Launch a native OS directory selection dialog (zenity / kdialog / tkinter)
    and return the selected absolute path, or None if cancelled/unavailable.
    """
    initial_dir = str(Path.home())

    # 1. Try zenity (GNOME / GTK standard on Linux)
    zenity_bin = shutil.which("zenity")
    if zenity_bin and (os.getenv("DISPLAY") or os.getenv("WAYLAND_DISPLAY")):
        try:
            proc = await asyncio.create_subprocess_exec(
                zenity_bin,
                "--file-selection",
                "--directory",
                "--title=Select LaTeX Project Folder",
                f"--filename={initial_dir}/",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await proc.communicate()
            if proc.returncode == 0:
                selected = stdout.decode("utf-8").strip()
                if selected and os.path.isdir(selected):
                    return selected
            elif proc.returncode == 1:
                # User cancelled dialog
                return None
        except Exception as e:
            logger.warning(f"Zenity file picker invocation failed: {e}")

    # 2. Try kdialog (KDE / Qt standard on Linux)
    kdialog_bin = shutil.which("kdialog")
    if kdialog_bin and (os.getenv("DISPLAY") or os.getenv("WAYLAND_DISPLAY")):
        try:
            proc = await asyncio.create_subprocess_exec(
                kdialog_bin,
                "--getexistingdirectory",
                initial_dir,
                "--title",
                "Select LaTeX Project Folder",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await proc.communicate()
            if proc.returncode == 0:
                selected = stdout.decode("utf-8").strip()
                if selected and os.path.isdir(selected):
                    return selected
            elif proc.returncode == 1:
                return None
        except Exception as e:
            logger.warning(f"Kdialog file picker invocation failed: {e}")

    # 3. Fallback to Tkinter (cross-platform, runs in worker thread)
    def _tk_askdirectory() -> Optional[str]:
        try:
            import tkinter as tk
            from tkinter import filedialog

            root = tk.Tk()
            root.withdraw()
            root.attributes("-topmost", True)
            folder = filedialog.askdirectory(
                initialdir=initial_dir,
                title="Select LaTeX Project Folder",
            )
            root.destroy()
            return folder if folder and os.path.isdir(folder) else None
        except Exception as err:
            logger.warning(f"Tkinter file dialog failed: {err}")
            return None

    try:
        selected_tk = await asyncio.to_thread(_tk_askdirectory)
        if selected_tk:
            return selected_tk
    except Exception as e:
        logger.warning(f"Tkinter async runner failed: {e}")

    return None
