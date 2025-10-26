FROM python:3.11-slim


# Set working directory
WORKDIR /app


# Copy dependency list
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt


# Install supervisor for process management
RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*


# Copy app and supervisor configs
COPY app/ ./app
COPY data/ ./data
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf


# Create cache directories
RUN mkdir -p /app/data/cache /app/data/models


# Expose FastAPI port
EXPOSE 5000


# Start supervisor (manages uvicorn + background worker)
CMD ["/usr/bin/supervisord"]