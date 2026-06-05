from __future__ import annotations

import os

import jwt
from fastapi import HTTPException, Request


def _get_jwt_secret() -> str:
    return os.environ.get("SUPABASE_JWT_SECRET", "")


def _build_es256_key() -> jwt.algorithms.ECAlgorithm | None:
    """Build ES256 public key from env vars set during deployment."""
    x = os.environ.get("SUPABASE_JWT_JWK_X", "")
    y = os.environ.get("SUPABASE_JWT_JWK_Y", "")
    kid = os.environ.get("SUPABASE_JWT_JWK_KID", "")
    if not x or not y:
        return None
    jwk_data = {
        "kty": "EC",
        "crv": "P-256",
        "alg": "ES256",
        "use": "sig",
        "x": x,
        "y": y,
    }
    if kid:
        jwk_data["kid"] = kid
    return jwt.PyJWK(jwk_data).key


_es256_key: object | None = None
_es256_key_loaded = False


def _get_es256_key():
    global _es256_key, _es256_key_loaded
    if not _es256_key_loaded:
        _es256_key = _build_es256_key()
        _es256_key_loaded = True
    return _es256_key


def _decode_token(token: str) -> dict:
    header = jwt.get_unverified_header(token)
    alg = header.get("alg", "")

    if alg == "HS256":
        secret = _get_jwt_secret()
        if not secret:
            raise HTTPException(status_code=500, detail="JWT secret not configured")
        return jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")

    if alg == "ES256":
        key = _get_es256_key()
        if not key:
            raise HTTPException(status_code=500, detail="ES256 key not configured")
        return jwt.decode(token, key, algorithms=["ES256"], audience="authenticated")

    raise HTTPException(status_code=401, detail=f"Unsupported JWT algorithm: {alg}")


async def get_optional_user_id(request: Request) -> str | None:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:]

    try:
        payload = _decode_token(token)
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
