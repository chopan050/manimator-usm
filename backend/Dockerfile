FROM manimcommunity/manim:latest
USER root
RUN pip install antlr4-python3-runtime==4.11 \
    celery \
    fastapi \
    python-multipart \
    redis \
    sympy \
    uvicorn
# TODO:
# USER $USER
COPY app ./app
RUN mkdir -p ./media/videos/720p30/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
