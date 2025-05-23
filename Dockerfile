FROM node:alpine AS dev
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .