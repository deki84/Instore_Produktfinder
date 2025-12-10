FROM python:3.12-slim

WORKDIR /app

# Install ffmpeg für Audio-Konvertierung (benötigt für pydub)
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "fastapi_image2text_main:app", "--host", "0.0.0.0", "--port", "8000"]
