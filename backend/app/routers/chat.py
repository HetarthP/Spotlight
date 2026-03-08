"""
Chat router — POST /api/chat

Authenticates via Auth0 JWT (optional fallback to anonymous),
fetches the user's brand profile, builds a dynamic system prompt,
then routes through Backboard (persistent memory + LLM generation).

Also detects [ADD_PRODUCT] blocks in AI responses and auto-creates
product memories so they appear on the products page.
"""

import json
import re
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional

from app.auth import get_current_user, bearer_scheme
from app.services.brand_profile import get_user_brand_profile
from app.services import backboard


router = APIRouter()

PRODUCT_TAG = "[PRODUCT] "
ADD_PRODUCT_PATTERN = re.compile(r'\[ADD_PRODUCT\]\s*(\{[^}]+\})', re.DOTALL)

# Patterns to detect when the user wants to add a product
_ADD_INTENT_WORDS = re.compile(
    r'\b(add|track|create|register|save|start tracking|new product|new project)\b',
    re.IGNORECASE
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    thread_id: str
    products_added: int = 0


def _build_system_prompt(profile: dict) -> str:
    """Construct a brand-aware system prompt for Spotlight AI."""
    brand_known = profile.get("brand_name", "Unknown") != "Unknown"

    if brand_known:
        brand_ctx = (
            f"User's brand: {profile['brand_name']} ({profile['industry']}). "
            f"Budget: {profile['budget']}. Demo: {profile['target_demo']}. "
            f"Tone: {profile.get('tone', 'Professional')}. "
            f"Goals: {profile.get('goals', 'Brand awareness')}."
        )
    else:
        brand_ctx = (
            "New user — no brand info yet. Greet them and naturally learn "
            "their brand name, industry, budget, target demo, and goals."
        )

    return (
        "You are Spotlight AI, a VPP (Virtual Product Placement) marketing strategist. "
        f"{brand_ctx}\n\n"
        "You have persistent memory across sessions. Facts you learn are saved automatically. "
        "Give concise, actionable VPP advice: content targeting, placement strategy, "
        "budget allocation, and expected metrics. Use markdown."
    )


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> Optional[dict]:
    """
    Try to authenticate, but fall back to None if no token is provided.
    """
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


async def _strip_product_tags(reply: str) -> str:
    """Strip any [ADD_PRODUCT] tags from the AI reply (cosmetic only, no saving)."""
    return ADD_PRODUCT_PATTERN.sub("", reply).strip()


async def _product_name_exists(assistant_id: str, name: str) -> bool:
    """Check if a product with this name already exists in Backboard memories."""
    try:
        memories = await backboard.list_memories(assistant_id)
        for mem in memories:
            content = mem.get("content", "")
            if content.startswith(PRODUCT_TAG):
                try:
                    data = json.loads(content[len(PRODUCT_TAG):])
                    if data.get("name", "").lower() == name.lower():
                        return True
                except (json.JSONDecodeError, KeyError):
                    pass
    except Exception:
        pass
    return False


def _extract_product_from_message(message: str) -> dict | None:
    """
    Best-effort extraction of product details from the user's message.
    """
    if not _ADD_INTENT_WORDS.search(message):
        return None

    # Extract name: text after 'called/named' up to 'costing/with/budget/$'
    name_match = re.search(
        r'(?:called|named)\s+["\']?(.+?)(?:\s+(?:costing|with|budget|for)\b|\s*\$|["\']|\.|$)',
        message, re.I
    )
    if not name_match:
        # Fallback: text after 'product/project' up to cost/plan markers
        name_match = re.search(
            r'(?:product|project)\s+["\']?(.+?)(?:\s+(?:costing|with|budget|for)\b|\s*\$|["\']|\.|$)',
            message, re.I
        )
    name = name_match.group(1).strip() if name_match else None
    if not name or len(name) < 2:
        return None

    # Extract cost
    cost_match = re.search(r'\$[\d,]+(?:\.\d{2})?(?:k|K)?', message)
    cost = cost_match.group(0) if cost_match else "Not specified"

    # Extract plan: text after 'with a/an' up to end of sentence
    plan_match = re.search(r'with (?:a |an )?(.+?)(?:\.|$)', message, re.I)
    plan_text = plan_match.group(1).strip().rstrip('.') if plan_match else "General marketing"
    # Remove cost info from plan text if it leaked in
    plan_text = re.sub(r'\$[\d,]+(?:\.\d{2})?(?:k|K)?\s*(?:budget)?', '', plan_text).strip()
    if not plan_text:
        plan_text = "General marketing"

    return {"name": name, "cost": cost, "plan": plan_text, "status": "active"}


@router.post("/", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    user: Optional[dict] = Depends(get_optional_user),
):
    """
    Send a message to the Spotlight AI marketing advisor.
    """
    is_authenticated = user is not None
    user_id = user.get("sub", "auth0|default") if user else "auth0|default"

    profile = get_user_brand_profile(user_id)
    system_prompt = _build_system_prompt(profile)

    try:
        assistant_id = await backboard.ensure_assistant(system_prompt, user_id)
        thread_id = await backboard.get_or_create_thread(assistant_id, user_id)

        memory_mode = "Auto" if is_authenticated else "Off"
        reply = await backboard.send_message(thread_id, body.message, memory=memory_mode)

        # Strip any [ADD_PRODUCT] tags from the visible reply
        reply = await _strip_product_tags(reply)

        # Only one product-creation path: parse the user's message
        products_added = 0
        if is_authenticated:
            product_data = _extract_product_from_message(body.message)
            if product_data:
                # Dedup: skip if same product name already exists
                already_exists = await _product_name_exists(assistant_id, product_data["name"])
                if not already_exists:
                    try:
                        content = f"{PRODUCT_TAG}{json.dumps(product_data)}"
                        await backboard.add_memory(assistant_id, content)
                        products_added = 1
                    except Exception:
                        pass

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Chat service error: {e}",
        )

    return ChatResponse(reply=reply, thread_id=thread_id, products_added=products_added)
