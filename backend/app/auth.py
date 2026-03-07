"""
Auth0 JWT verification dependency for FastAPI.
Validates access tokens and enforces RBAC roles.

Architecture: Auth0 manages Role-Based Access Control (RBAC)
  - "creator" role → Creator Dashboard (uploading / processing)
  - "brand"   role → Brand Dashboard (bidding / placement / analytics)
"""

import jwt
import httpx
from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings

# Bearer token extraction from Authorization header
bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache()
def _get_jwks() -> dict:
    """
    Fetch Auth0's JSON Web Key Set (JWKS) for RS256 verification.
    Cached so we only fetch once per process lifetime.
    """
    url = f"https://{settings.auth0_domain}/.well-known/jwks.json"
    resp = httpx.get(url)
    resp.raise_for_status()
    return resp.json()


def _get_signing_key(token: str) -> jwt.algorithms.RSAAlgorithm:
    """Find the correct public key from the JWKS based on the token's kid."""
    jwks = _get_jwks()
    unverified_header = jwt.get_unverified_header(token)

    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            return jwt.algorithms.RSAAlgorithm.from_jwk(key)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unable to find appropriate signing key.",
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency: Verify the Auth0 access token and return decoded claims.
    Use as: current_user = Depends(get_current_user)
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        signing_key = _get_signing_key(token)
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=settings.auth0_audience,
            issuer=f"https://{settings.auth0_domain}/",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )


def require_role(role: str):
    """
    Factory for a FastAPI dependency that enforces an RBAC role.
    Usage: Depends(require_role("brand"))

    Roles are stored in the token under a custom namespace claim:
      "https://vpp.app/roles": ["creator"] or ["brand"]
    """

    async def _check_role(
        user: dict = Depends(get_current_user),
    ) -> dict:
        roles = user.get("https://vpp.app/roles", [])
        if role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f'Role "{role}" is required.',
            )
        return user

    return _check_role
