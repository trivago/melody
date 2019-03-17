FROM node:8

LABEL "com.github.actions.name"="verdaccio publish"
LABEL "com.github.actions.description"="Publish on Verdaccio"
LABEL "com.github.actions.icon"="package"
LABEL "com.github.actions.color"="green"

LABEL "repository"="https://github.com/trivago/melody"
LABEL "homepage"="https://github.com/trivago/melody"
LABEL "maintainer"="trivago <ayush.sharma@trivago.com>"

RUN npm install -g verdaccio@3.11.4 && \
    npm install -g verdaccio-auth-memory && \
    npm install -g verdaccio-memory && \
    npm install -g npm-auth-to-token@1.0.0

COPY config.yaml /config.yaml
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
