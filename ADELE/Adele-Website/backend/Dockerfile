FROM python:3.9-slim
WORKDIR /backend
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./

WORKDIR /backend
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

RUN git clone https://github.com/FracassandoCasualmente/SeMPyRO.git /backend/SeMPyRO
WORKDIR /backend/SeMPyRO
RUN pip install .

WORKDIR /backend

COPY . .
CMD ["python", "server.py"]
