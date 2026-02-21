#!/bin/bash
# ============================================
# FEAF Dashboard - Deploy to Minikube
# ============================================
# This script builds Docker images inside Minikube's
# Docker daemon and deploys all services to the cluster.
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
NAMESPACE="feaf-dashboard"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

# ============================================
# Step 0: Pre-flight checks
# ============================================
log "=== FEAF Dashboard - Minikube Deployment ==="
echo ""

log "Checking prerequisites..."
command -v minikube >/dev/null 2>&1 || { error "minikube is not installed"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { error "kubectl is not installed"; exit 1; }
command -v docker >/dev/null 2>&1 || { error "docker is not installed"; exit 1; }

# Check minikube is running
if ! minikube status | grep -q "Running"; then
    error "Minikube is not running. Start it with: minikube start"
    exit 1
fi
log "Minikube is running ✓"

# ============================================
# Step 1: Point Docker to Minikube's daemon
# ============================================
log "Connecting to Minikube's Docker daemon..."
eval $(minikube docker-env)
log "Docker daemon connected ✓"

# ============================================
# Step 2: Build Docker images
# ============================================
log "Building backend Docker image..."
docker build -t feaf-backend:latest "$PROJECT_DIR/backend"
log "Backend image built ✓"

log "Building frontend Docker image..."
docker build -t feaf-frontend:latest \
    --build-arg VITE_API_URL=/api \
    "$PROJECT_DIR/frontend"
log "Frontend image built ✓"

# Verify images
info "Docker images:"
docker images | grep feaf

# ============================================
# Step 3: Apply Kubernetes manifests (infrastructure)
# ============================================
log "Applying Kubernetes infrastructure..."

# Namespace
kubectl apply -f "$SCRIPT_DIR/00-namespace.yaml"
log "Namespace created ✓"

# Service Accounts
kubectl apply -f "$SCRIPT_DIR/01-service-accounts.yaml"
log "Service accounts created ✓"

# RBAC
kubectl apply -f "$SCRIPT_DIR/02-rbac-roles.yaml"
log "RBAC roles created ✓"

# Resource Quotas
kubectl apply -f "$SCRIPT_DIR/03-resource-quotas.yaml"
log "Resource quotas created ✓"

# ConfigMap
kubectl apply -f "$SCRIPT_DIR/04-configmap.yaml"
log "ConfigMap created ✓"

# Secrets
kubectl apply -f "$SCRIPT_DIR/05-secrets.yaml"
log "Secrets created ✓"

# ============================================
# Step 4: Deploy PostgreSQL database
# ============================================
log "Deploying PostgreSQL..."

# Storage
kubectl apply -f "$SCRIPT_DIR/06-postgres-pvc.yaml"
kubectl apply -f "$SCRIPT_DIR/07-prometheus-pvc.yaml"

# Init scripts
kubectl apply -f "$SCRIPT_DIR/08-postgres-init-configmap.yaml"

# StatefulSet
kubectl apply -f "$SCRIPT_DIR/08-postgres-statefulset.yaml"

# Service
kubectl apply -f "$SCRIPT_DIR/09-postgres-service.yaml"

log "Waiting for PostgreSQL to be ready..."
kubectl rollout status statefulset/feaf-postgres -n "$NAMESPACE" --timeout=120s || {
    warn "PostgreSQL not ready yet, check with: kubectl get pods -n $NAMESPACE"
}
log "PostgreSQL deployed ✓"

# ============================================
# Step 5: Apply Dapr components
# ============================================
log "Applying Dapr components..."

# Check if Dapr CRDs exist
if kubectl api-resources | grep -q "dapr.io"; then
    kubectl apply -f "$SCRIPT_DIR/10-dapr-statestore.yaml" 2>/dev/null || warn "Dapr statestore skipped"
    kubectl apply -f "$SCRIPT_DIR/11-dapr-resiliency.yaml" 2>/dev/null || warn "Dapr resiliency skipped"
    kubectl apply -f "$SCRIPT_DIR/12-dapr-configuration.yaml" 2>/dev/null || warn "Dapr configuration skipped"
    log "Dapr components applied ✓"
else
    warn "Dapr CRDs not found - skipping Dapr components"
    warn "Install Dapr with: dapr init -k"
fi

# ============================================
# Step 6: Deploy Backend API
# ============================================
log "Deploying Backend API..."

kubectl apply -f "$SCRIPT_DIR/21-backend-service.yaml"
kubectl apply -f "$SCRIPT_DIR/20-backend-deployment.yaml"

log "Waiting for backend to be ready..."
kubectl rollout status deployment/feaf-backend -n "$NAMESPACE" --timeout=180s || {
    warn "Backend not ready yet. Checking pod status..."
    kubectl get pods -n "$NAMESPACE" -l app=feaf-backend
    kubectl logs -n "$NAMESPACE" -l app=feaf-backend --tail=20 2>/dev/null || true
}
log "Backend deployed ✓"

# ============================================
# Step 7: Deploy Frontend UI
# ============================================
log "Deploying Frontend UI..."

kubectl apply -f "$SCRIPT_DIR/23-frontend-service.yaml"
kubectl apply -f "$SCRIPT_DIR/22-frontend-deployment.yaml"

log "Waiting for frontend to be ready..."
kubectl rollout status deployment/feaf-frontend -n "$NAMESPACE" --timeout=120s || {
    warn "Frontend not ready yet. Checking pod status..."
    kubectl get pods -n "$NAMESPACE" -l app=feaf-frontend
}
log "Frontend deployed ✓"

# ============================================
# Step 8: Verify deployment
# ============================================
echo ""
log "=== Deployment Status ==="
echo ""
kubectl get all -n "$NAMESPACE"
echo ""

# Get access URL
FRONTEND_URL=$(minikube service feaf-frontend -n "$NAMESPACE" --url 2>/dev/null || echo "")
if [ -n "$FRONTEND_URL" ]; then
    log "=== Access URLs ==="
    echo ""
    info "Frontend:  $FRONTEND_URL"
    info "Backend:   $FRONTEND_URL/api"
    info "Swagger:   $FRONTEND_URL/api/api/docs"
else
    log "=== Access via Minikube ==="
    echo ""
    info "Run: minikube service feaf-frontend -n $NAMESPACE"
    info "Or:  minikube tunnel  (then access http://localhost:30080)"
fi

echo ""
log "=== Useful Commands ==="
info "View pods:     kubectl get pods -n $NAMESPACE"
info "Backend logs:  kubectl logs -n $NAMESPACE -l app=feaf-backend -f"
info "Frontend logs: kubectl logs -n $NAMESPACE -l app=feaf-frontend -f"
info "Postgres logs: kubectl logs -n $NAMESPACE -l app=feaf-postgres -f"
info "Open app:      minikube service feaf-frontend -n $NAMESPACE"
echo ""
log "=== Deployment Complete! ✓ ==="
