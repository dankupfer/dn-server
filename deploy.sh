#!/bin/bash

# Exit on first error
set -e

echo "Building Docker image..."
docker build -t dn-server .

echo "Tagging image..."
docker tag dn-server gcr.io/dankupfer-dn-server/dn-server

echo "Pushing image to GCR..."
docker push gcr.io/dankupfer-dn-server/dn-server

echo "Deploying to Google Cloud Run..."
gcloud run deploy dn-server \
  --image gcr.io/dankupfer-dn-server/dn-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets=CLAUDE_API_KEY=claude-api-key:latest,GEMINI_API_KEY=gemini-api-key:latest \
  --env-vars-file env.yaml

echo "Deployment completed successfully!"