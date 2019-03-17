FROM node:latest
LABEL version="1.0.0"
LABEL repository="https://github.com/trivago/melody"
LABEL homepage="https://github.com/trivago/melody/"
LABEL "maintainer"="trivago <ayush.sharma@trivago.com>"

LABEL com.github.actions.name="GitHub Action for Yarn, tj/n"
LABEL com.github.actions.description="Expose the debian CLI to enable common node commands."

# replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# update the repository sources list
# and install dependencies
RUN apt-get update \
    && apt-get -y autoclean

COPY "entrypoint.sh" "/entrypoint.sh"
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["help"]