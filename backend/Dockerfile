FROM python:3.11-slim


WORKDIR /app


COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt


COPY app/ ./app
COPY data/ ./data


# Create volume directories
RUN mkdir -p /app/data/cache /app/data/models


EXPOSE 5000 8080


CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]