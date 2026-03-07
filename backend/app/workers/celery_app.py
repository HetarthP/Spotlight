"""
Celery application — task queue for GPU-intensive work.
Runs on Vultr GPU nodes (Heavy Compute layer).
"""

from celery import Celery
from app.config import settings

celery_app = Celery(
    "vpp_workers",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,          # Re-queue on worker crash
    worker_prefetch_multiplier=1, # One task at a time per GPU worker
)
