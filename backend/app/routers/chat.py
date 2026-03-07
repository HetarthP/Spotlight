"""
Chat router — POST /api/chat

Authenticates via Auth0 JWT, fetches the user's brand profile,
builds a dynamic system prompt, then routes through Backboard
(which provides persistent memory + LLM generation).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import get_current_user
from app.services.brand_profile import get_user_brand_profile
from app.services import backboard


router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    thread_id: str


def _build_system_prompt(profile: dict) -> str:
    """Construct a brand-aware system prompt for Ghost-Merchant."""
    return (
        "You are an expert marketing strategist for Ghost-Merchant, "
        "an AI-powered Virtual Product Placement platform.\n\n"
        f"The user represents **{profile['brand_name']}** in the "
        f"**{profile['industry']}** sector with a budget of "
        f"**{profile['budget']}**.\n"
        f"Target demographic: **{profile['target_demo']}**.\n"
        f"Brand tone: **{profile.get('tone', 'Professional')}**.\n"
        f"Campaign goals: **{profile.get('goals', 'Brand awareness')}**.\n\n"
        "Tailor every response to this brand profile. Provide actionable, "
        "data-driven VPP strategies including:\n"
        "• Which types of video content to target for placements\n"
        "• Optimal placement positions and durations\n"
        "• Budget allocation recommendations\n"
        "• Expected performance metrics (CPM, CTR, engagement)\n"
        "• Creative direction that matches the brand tone\n\n"
        "Keep responses concise but insightful. Use markdown formatting."
    )


@router.post("/", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
):
    """
    Send a message to the Ghost-Merchant marketing advisor.

    Flow:
      1. Verify JWT → extract Auth0 sub
      2. Fetch brand profile (mock data today, DB tomorrow)
      3. Ensure Backboard assistant exists with brand-aware system prompt
      4. Get or create thread for this user
      5. Send message via Backboard (memory="Auto")
      6. Return the assistant's reply
    """
    user_id = "auth0|default"

    # 1) Fetch brand context
    profile = get_user_brand_profile(user_id)

    # 2) Build dynamic system prompt
    system_prompt = _build_system_prompt(profile)

    # 3) Ensure assistant + thread exist
    try:
        assistant_id = await backboard.ensure_assistant(system_prompt)
        thread_id = await backboard.get_or_create_thread(assistant_id, user_id)

        # 4) Send message with persistent memory
        reply = await backboard.send_message(thread_id, body.message)
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Chat service error: {e}",
        )

    return ChatResponse(reply=reply, thread_id=thread_id)
