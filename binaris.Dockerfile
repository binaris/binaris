FROM ubuntu:16.04

RUN apt-get update && apt-get install -y curl git

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

ENV TINI_VERSION v0.16.1
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

RUN mkdir -p /opt/binaris
RUN mkdir -p /opt/bn
WORKDIR /opt/bn
COPY ./package.json /opt/bn/
RUN npm install --save-dev

COPY . /opt/bn/
RUN npm install -g

WORKDIR /opt/binaris
