FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV FLASK_ENV=production
ENV DEBUG=False
ENV COPYRIGHT="Ervin Remus Radosavlevici (© ervin210@icloud.com)"
ENV WATERMARK="radosavlevici210@icloud.com"
ENV CONTACT="radosavlevici210@icloud.com"
ENV NDA_LICENSE="Business Commercial License with Comprehensive Protection"
ENV TIMESTAMP="2025-06-05 01:12:00 UTC"
ENV GITHUB_USERNAME="radosavlevici210"

# Expose ports
EXPOSE 5000 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/status || exit 1

# Start application
CMD ["python", "multi_port_enterprise_server.py"]
