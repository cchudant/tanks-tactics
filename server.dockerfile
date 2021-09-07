FROM node:14

WORKDIR /app

COPY ./back/package.json ./back/package.json
COPY ./back/yarn.lock ./back/yarn.lock

COPY ./back/src ./back/src
COPY ./back/tsconfig.json ./back/tsconfig.json
COPY ./back/tsconfig.build.json ./back/tsconfig.build.json

RUN yarn --cwd ./back install --frozen-lockfile
RUN yarn --cwd ./back build
RUN yarn --cwd ./back install --frozen-lockfile --production

RUN rm -rf ./back/src
RUN rm -rf ./back/tsconfig.json
RUN rm -rf ./back/tsconfig.build.json

WORKDIR /app/back

CMD yarn start:prod