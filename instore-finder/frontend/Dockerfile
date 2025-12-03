# frontend/Dockerfile

FROM node:22

WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ARG PYTHON_API_URL

ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV PYTHON_API_URL=${PYTHON_API_URL}

COPY package*.json ./
RUN rm -f package-lock.json && npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]