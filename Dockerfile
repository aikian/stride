# 1단계: 테스트 후 단일 index.html 빌드
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN node tests.mjs && node build.mjs

# 2단계: 정적 파일만 nginx로 제공
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/index.html /usr/share/nginx/html/index.html
COPY sw.js manifest.webmanifest icon-192.png icon-512.png /usr/share/nginx/html/
EXPOSE 80
