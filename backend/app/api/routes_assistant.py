from fastapi import APIRouter
from app.ml.explainability import explainability_engine
from app.models.assistant import AssistantQuery, AssistantResponse
from app.services.telemetry_streamer import telemetry_streamer

router = APIRouter(prefix="/api/ai/assistant", tags=["AI Maintenance Assistant"])


@router.post("", response_model=AssistantResponse)
async def query_ai_assistant(query: AssistantQuery):
    """
    Direct conversational interface with the Grounded AI Maintenance Assistant.
    Evaluates operator questions against live 10 Hz physical sensors, ISO standards, and RUL curves.
    """
    telemetry = telemetry_streamer.latest_packet
    return explainability_engine.answer_assistant_query(
        question=query.question,
        telemetry=telemetry,
        machine_id=query.machine_id or "LOOM-01",
    )
