"""Private, secure image storage and validation service (Section 5)"""
import os
import uuid
from typing import Tuple
from fastapi import HTTPException, status, UploadFile
from app.core.config import settings

# Magic byte signatures
MAGIC_BYTES = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89PNG\r\n\x1a\n"],
    "image/webp": [b"RIFF"]  # WEBP has RIFF header followed by WEBP
}

class ImageService:
    @staticmethod
    def validate_file_signature(content: bytes, content_type: str) -> bool:
        if content_type not in MAGIC_BYTES:
            return False
        signatures = MAGIC_BYTES[content_type]
        for sig in signatures:
            if content.startswith(sig):
                if content_type == "image/webp":
                    # Check for WEBP sub-marker
                    return b"WEBP" in content[:16]
                return True
        return False

    @classmethod
    async def save_private_image(cls, file: UploadFile) -> Tuple[str, str, int]:
        # Validate MIME
        if file.content_type not in settings.ALLOWED_IMAGE_MIMES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{file.content_type}'. Allowed types: {settings.ALLOWED_IMAGE_MIMES}"
            )
            
        content = await file.read()
        file_size = len(content)
        
        # Check size limit
        if file_size > settings.MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_IMAGE_SIZE_BYTES / (1024*1024)}MB."
            )
            
        # Validate magic byte header
        if not cls.validate_file_signature(content, file.content_type):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File header does not match declared MIME type. Invalid or corrupted image."
            )
            
        # Generate safe randomized filename
        ext = ".jpg" if "jpeg" in file.content_type else (".png" if "png" in file.content_type else ".webp")
        stored_filename = f"{uuid.uuid4()}{ext}"
        target_path = os.path.join(settings.STORAGE_DIR, stored_filename)
        
        with open(target_path, "wb") as f:
            f.write(content)
            
        return stored_filename, file.filename or stored_filename, file_size

    @staticmethod
    def get_private_image_path(stored_filename: str) -> str:
        # Prevent directory traversal
        clean_name = os.path.basename(stored_filename)
        full_path = os.path.join(settings.STORAGE_DIR, clean_name)
        if not os.path.exists(full_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Medical image not found."
            )
        return full_path

image_service = ImageService()
