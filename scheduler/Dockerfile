FROM golang:1.14.4 AS builder
WORKDIR /build
COPY ./ ./
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

FROM alpine:latest 
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /build/app .
CMD ["./app"]  