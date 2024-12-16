FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy the rest of the application
COPY . .

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Expose the port (Railway uses 8080)
EXPOSE ${PORT}

# Start Gunicorn
CMD gunicorn --workers=2 --threads=4 --worker-class=gthread --bind ${HOST}:${PORT} app:app
