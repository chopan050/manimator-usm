from celery import Celery
from app.manim_generator import render_scene

celery_app = Celery(
    "tasks",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0"
)

@celery_app.task
def render_manim_task(f_tex: str, a_tex: str, b_tex: str) -> str:
    video_path = render_scene(f_tex, a_tex, b_tex)
    return video_path