FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY src ./src
RUN useradd --create-home app
USER app
EXPOSE 8000
CMD ["python", "-m", "src.server", "--transport", "streamable-http", "--host", "0.0.0.0", "--port", "8000"]
