from __future__ import annotations

import os

import jwt
from fastapi import HTTPException, Request


def _get_jwt_secret() -> str:
    return os.environ.get("SUPABASE_JWT_SECRET", "")


async def get_optional_user_id(request: Request) -> str | None:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:]
    secret = _get_jwt_secret()

    try:
        if secret:
            payload = jwt.decode(
                token, secret, algorithms=["HS256"], audience="authenticated"
            )
        else:
            payload = jwt.decode(
                token, algorithms=["HS256"], options={"verify_signature": False}
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token missing subject")
    return user_id


async def require_user_id(request: Request) -> str:
    user_id = await get_optional_user_id(request)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id
