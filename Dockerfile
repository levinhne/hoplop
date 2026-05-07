# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS web-builder

WORKDIR /app/web

COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web ./
ARG VITE_POCKETBASE_URL
ENV VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL
RUN npm run build


FROM golang:1.25-bookworm AS go-builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY cmd ./cmd
COPY migrations ./migrations
COPY web/dist.go ./web/dist.go
COPY --from=web-builder /app/web/dist ./web/dist

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server


FROM debian:bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates tzdata \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN useradd --system --uid 10001 --create-home --home-dir /app appuser

COPY --from=go-builder /out/server ./server
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p /app/pb_data /app/pb_public /app/pb_hooks /app/pb_migrations \
  && chmod +x /app/docker-entrypoint.sh \
  && chown -R appuser:appuser /app

USER appuser

EXPOSE 8090

VOLUME ["/app/pb_data"]

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["serve", "--http=0.0.0.0:8090"]
