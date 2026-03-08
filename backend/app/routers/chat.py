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
        "budget allocation, and expected metrics. Use markdown.\n\n"
        "PRODUCT TRACKING: When the user asks you to add, track, or create a product or project, "
        "you MUST include this exact tag on its own line at the very end of your response "
        "(it will be stripped before the user sees it):\n"
        '[ADD_PRODUCT] {{"name": "Product Name", "cost": "$X", "plan": "Marketing plan description", "status": "active"}}\n'
        "Fill in all four fields based on what the user said. "
        "If they don't specify cost, use \"Not specified\". "
        "If they don't specify a plan, infer one from context."
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


async def _extract_products_from_reply(reply: str, assistant_id: str) -> tuple[str, int]:
    """
    Scan the AI reply for [ADD_PRODUCT] JSON blocks.
    Save each as a [PRODUCT] memory (with dedup) and strip from response.
    """
    matches = ADD_PRODUCT_PATTERN.findall(reply)
    count = 0
    for raw_json in matches:
        try:
            data = json.loads(raw_json)
            name = data.get("name", "")
            if name and not await _product_name_exists(assistant_id, name):
                content = f"{PRODUCT_TAG}{json.dumps(data)}"
                await backboard.add_memory(assistant_id, content)
                count += 1
        except (json.JSONDecodeError, Exception):
            pass
    cleaned = ADD_PRODUCT_PATTERN.sub("", reply).strip()
    return cleaned, count


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

    # Extract name: text in quotes, or after 'called/named', or after 'product/project'
    name_match = re.search(
        r'(?:called|named)\s+["\']?(.+?)(?:\s+(?:costing|with|budget|for)\b|\s*\$|\s+\d{3,}|["\']|\.|$)',
        message, re.I
    )
    if not name_match:
        name_match = re.search(
            r'(?:product|project)\s+["\']?(.+?)(?:\s+(?:costing|with|budget|for)\b|\s*\$|\s+\d{3,}|["\']|\.|$)',
            message, re.I
        )
    name = name_match.group(1).strip() if name_match else None
    if not name or len(name) < 2:
        return None

    # Extract cost: match $X,XXX or plain numbers (1000+)
    cost_match = re.search(r'\$[\d,]+(?:\.\d{2})?(?:k|K)?', message)
    if not cost_match:
        cost_match = re.search(r'\b(\d{3,}(?:,\d{3})*(?:\.\d{2})?)\b', message)
    if cost_match:
        raw = cost_match.group(0)
        cost = raw if raw.startswith('$') else f"${raw}"
    else:
        cost = "Not specified"

    # Extract plan: text between the product name and the cost/number,
    # OR after 'with a/an', OR descriptive text before 'and'
    remaining = message
    if name_match:
        remaining = message[name_match.end():]
    # Clean up remaining: strip quotes, leading whitespace
    remaining = re.sub(r'^[\s"\']+', '', remaining)

    plan_text = "General marketing"
    # Try: text after 'with a/an'
    plan_match = re.search(r'with (?:a |an )?(.+?)(?:\s+and\s+\d|\s*\$|\.|$)', remaining, re.I)
    if plan_match and len(plan_match.group(1).strip()) > 3:
        plan_text = plan_match.group(1).strip()
    else:
        # Grab descriptive words (anything that's not a number or 'and <number>')
        desc = re.sub(r'\b\d[\d,]*\b', '', remaining)  # remove numbers
        desc = re.sub(r'\band\s*$', '', desc).strip()   # remove trailing 'and'
        desc = desc.strip(' ,.')
        if len(desc) > 3:
            plan_text = desc

    # Clean cost info that may have leaked into plan
    plan_text = re.sub(r'\$[\d,]+(?:\.\d{2})?(?:k|K)?\s*(?:budget)?', '', plan_text).strip()
    plan_text = re.sub(r'\b\d{3,}\b', '', plan_text).strip(' ,.')
    if not plan_text or len(plan_text) < 3:
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

        # Primary: extract products from the AI reply (AI returns structured tags)
        products_added = 0
        if is_authenticated:
            reply, products_added = await _extract_products_from_reply(reply, assistant_id)
        else:
            reply = ADD_PRODUCT_PATTERN.sub("", reply).strip()

        # Fallback: if AI didn't emit tags, parse user's message
        if products_added == 0 and is_authenticated:
            product_data = _extract_product_from_message(body.message)
            if product_data:
                if not await _product_name_exists(assistant_id, product_data["name"]):
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
