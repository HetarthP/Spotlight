"""
Vultr API Service.
Heavy Compute Layer: Dynamic provisioning of GPU worker nodes.
"""

from vultr import Vultr
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize the Vultr client if an API key is provided
vultr_client = None
if settings.vultr_api_key:
    vultr_client = Vultr(settings.vultr_api_key)


async def provision_gpu_worker(label: str = "vpp-gpu-worker") -> str:
    """
    Spin up a new Vultr GPU instance (e.g., NVIDIA A100/A40) 
    for FFmpeg chunking and intensive Gemini processing.
    """
    if not vultr_client:
        logger.warning("Vultr API key not configured. Mocking provisioning.")
        return "mock_instance_id_123"

    try:
        # Note: In production you would specify the exact OS id,
        # plan id (GPU type), and region id here.
        # This is the async wrapper logic for the sync SDK
        import asyncio
        loop = asyncio.get_running_loop()
        instance = await loop.run_in_executor(
            None,
            lambda: vultr_client.server.create(
                region=1,        # e.g., New Jersey
                plan=201,        # e.g., Cloud Compute / GPU
                os_id=387,       # e.g., Ubuntu 20.04
                label=label
            )
        )
        logger.info(f"Successfully provisioned GPU worker: {instance['SUBID']}")
        return instance["SUBID"]
    except Exception as e:
        logger.error(f"Failed to provision Vultr GPU worker: {e}")
        raise


async def terminate_worker(instance_id: str):
    """
    Destroy a GPU worker instance to save costs when the queue is empty.
    """
    if not vultr_client or instance_id.startswith("mock"):
        logger.info(f"Mock terminating worker: {instance_id}")
        return

    try:
        import asyncio
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(
            None, 
            lambda: vultr_client.server.destroy(instance_id)
        )
        logger.info(f"Terminated worker: {instance_id}")
    except Exception as e:
        logger.error(f"Failed to terminate Vultr worker {instance_id}: {e}")
        raise
