#!/bin/bash

# Epaiement.ma - Google Cloud Deployment Script
# Usage: ./deploy-gcp.sh <PROJECT_ID> <REGION>

set -e

PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"europe-west1"}
SERVICE_NAME="epaiement"

echo "🚀 Deploying Epaiement.ma to Google Cloud..."
echo "   Project: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Service: $SERVICE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "📌 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📦 Enabling required APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    secretmanager.googleapis.com \
    --project=$PROJECT_ID

# Check if secrets exist, create if not
echo "🔐 Checking secrets..."
if ! gcloud secrets describe epaiement-db-url --project=$PROJECT_ID &> /dev/null; then
    echo "   Creating secret epaiement-db-url..."
    echo -n "postgresql://user:password@host:5432/epaiement" | \
        gcloud secrets create epaiement-db-url \
        --data-file=- \
        --project=$PROJECT_ID
fi

# Build and deploy using Cloud Build
echo "🔨 Building and deploying with Cloud Build..."
gcloud builds submit \
    --config cloudbuild.yaml \
    -- substitutions=_REGION=$REGION \
    --project=$PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --project=$PROJECT_ID \
    --format 'value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo "   URL: $SERVICE_URL"
echo ""
echo "🎉 Epaiement.ma is now live on Google Cloud Run!"
