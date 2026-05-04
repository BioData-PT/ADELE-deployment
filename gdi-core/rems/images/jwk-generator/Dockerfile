##########################
## Build env
##########################

FROM python:3.10-bookworm

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

#RUN apt-get update

# python packages
RUN pip install --no-cache-dir --upgrade pip
WORKDIR /app
COPY requirements.txt /app
RUN pip install --no-cache-dir -r requirements.txt

#RUN apt-get update

# enable cache
#RUN mkdir -p /home/app-user/.cache

CMD ["python3", "generate_jwks.py"]

