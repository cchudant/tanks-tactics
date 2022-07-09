ARG REACT_APP_API_URL

FROM node:14 AS builder

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

WORKDIR /app

COPY ./front ./front

RUN yarn --cwd ./front install --frozen-lockfile
RUN yarn --cwd ./front build

FROM node:14 AS runtime

RUN yarn global add serve

COPY --from=builder /app/front/build /app/front/build

WORKDIR /app/front

CMD bash -c "serve -s build -l 8080"
