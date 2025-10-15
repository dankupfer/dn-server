FROM gcr.io/google.com/cloudsdktool/google-cloud-cli:alpine
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Build TypeScript
RUN npm install typescript @types/node --save-dev
RUN npm run build

# Remove dev dependencies and source after build
RUN npm prune --production
RUN rm -rf src tsconfig.json

# Cloud Run expects port 8080
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]