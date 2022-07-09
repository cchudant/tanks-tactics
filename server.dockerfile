FROM node:16.10 AS builder

WORKDIR /app

COPY ./back ./back

RUN yarn --cwd ./back install --frozen-lockfile
RUN yarn --cwd ./back build

FROM node:16.10 AS runtime

COPY --from=builder /app/back/dist /app/back/dist
COPY --from=builder /app/back/package.json /app/back/package.json
COPY --from=builder /app/back/yarn.lock /app/back/yarn.lock

WORKDIR /app/back

RUN yarn install --frozen-lockfile --production

CMD bash -c "\
    yarn typeorm:prod schema:sync && \
    yarn start:prod \
"
