# --- Base Image ---
# Use an official Python runtime as a parent image.
# Using a slim version is a good practice for production to keep the image size small.
FROM python:3.10-slim

# --- Environment Variables ---
# Set environment variables to configure the container environment.
# 1. PYTHONDONTWRITEBYTECODE: Prevents Python from writing .pyc files to disc.
# 2. PYTHONUNBUFFERED: Ensures that Python output is sent straight to the terminal without being buffered, which is crucial for logging.
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# --- Working Directory ---
# Set the working directory inside the container.
WORKDIR /app

# --- Install Dependencies ---
# First, copy only the requirements file to leverage Docker's layer caching.
# This step will only be re-run if requirements.txt changes.
COPY requirements.txt .

# Install system dependencies that might be required by Python packages (e.g., for Pillow or numpy).
# RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install the Python dependencies.
# --no-cache-dir reduces the image size by not storing the pip cache.
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# --- Copy Application Code ---
# Copy the rest of the backend application code into the working directory.
COPY . .

# --- Security Best Practices ---
# Create a non-root user and group to run the application.
# Running as a non-root user is a critical security measure.
RUN addgroup --system app && adduser --system --group app
# Switch to the non-root user.
USER app

# --- Port Exposure ---
# Expose the port that the application will run on.
# This port will be mapped to a host port in docker-compose.yml or via `docker run -p`.
EXPOSE 5001

# --- Startup Command ---
# Define the command to run the application when the container starts.
# Use Gunicorn as a production-ready WSGI server to run the Flask app.
# --workers: Number of worker processes. A common recommendation is (2 * number_of_cores) + 1.
# --bind: The address and port to bind to. 0.0.0.0 makes it accessible from outside the container.
# app:app: Refers to the 'app' object inside the 'app.py' module.
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:5001", "app:app"]