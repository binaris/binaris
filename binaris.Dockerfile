FROM ubuntu:16.04

RUN apt-get update && apt-get install -y curl git sudo

RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
RUN sudo apt-get install -y nodejs

ENV TINI_VERSION v0.16.1
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini
ENTRYPOINT ["/tini", "--"]

RUN groupadd -r dockeruser &&\
    useradd -r -g dockeruser -m -d /home/dockeruser -s /sbin/nologin dockeruser
RUN echo 'dockeruser:binaris' | chpasswd
RUN usermod -aG sudo dockeruser
RUN chown -R dockeruser:dockeruser /home/dockeruser
ENV HOME=/home/dockeruser

RUN groupadd docker
RUN gpasswd -a dockeruser docker
USER dockeruser
RUN chmod g+s /home/dockeruser
RUN mkdir -p ~/.node
RUN mkdir -p ~/binaris
RUN mkdir -p ~/test
WORKDIR $HOME

RUN echo "prefix = ~/.node" >> ~/.npmrc
ENV PATH=$HOME/.node/bin:$PATH
ENV NODE_PATH="$HOME/.node/lib/node_modules:$NODE_PATH"
ENV MANPATH="$HOME/.node/share/man:$MANPATH"

WORKDIR /home/dockeruser/binaris
COPY ./package.json /home/dockeruser/binaris
RUN npm install --save-dev
COPY . /home/dockeruser/binaris
RUN npm install -g

WORKDIR $HOME/test
