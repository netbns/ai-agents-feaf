#!/bin/bash

# Script to deploy PostgreSQL StatefulSet for FEAF Dashboard
# This script applies the PostgreSQL database components in the correct order

set -e

echo "=========================================="
echo "Deploying PostgreSQL for FEAF Dashboard"
echo "=========================================="
echo ""

# Check if namespace exists
if ! kubectl get namespace feaf-dashboard &> /dev/null; then
    echo "❌ Error: Namespace 'feaf-dashboard' does not exist"
    echo "Please run ./apply-infrastructure.sh first"
    exit 1
fi

# Check if secrets exist
if ! kubectl get secret feaf-secrets -n feaf-dashboard &> /dev/null; then
    echo "❌ Error: Secret 'feaf-secrets' does not exist"
    echo "Please run ./apply-infrastructure.sh first"
    exit 1
fi

# Check if PVC exists
if ! kubectl get pvc postgres-pvc -n feaf-dashboard &> /dev/null; then
    echo "❌ Error: PersistentVolumeClaim 'postgres-pvc' does not exist"
    echo "Please run ./apply-storage.sh first"
    exit 1
fi

echo "✅ Prerequisites verified"
echo ""

# Apply PostgreSQL initialization scripts ConfigMap
echo "📝 Applying PostgreSQL initialization scripts..."
kubectl apply -f 08-postgres-init-configmap.yaml
echo "✅ Initialization scripts ConfigMap created"
echo ""

# Apply PostgreSQL StatefulSet
echo "🗄️  Deploying PostgreSQL StatefulSet..."
kubectl apply -f 08-postgres-statefulset.yaml
echo "✅ PostgreSQL StatefulSet created"
echo ""

# Apply PostgreSQL Service
echo "🌐 Creating PostgreSQL Service..."
kubectl apply -f 09-postgres-service.yaml
echo "✅ PostgreSQL Service created"
echo ""

echo "=========================================="
echo "PostgreSQL Deployment Complete"
echo "=========================================="
echo ""
echo "📊 Checking deployment status..."
echo ""

# Wait for StatefulSet to be ready
echo "⏳ Waiting for PostgreSQL pod to be ready (this may take a minute)..."
kubectl wait --for=condition=ready pod -l app=feaf-postgres -n feaf-dashboard --timeout=120s || {
    echo "⚠️  Warning: PostgreSQL pod is not ready yet"
    echo "You can check the status with: kubectl get pods -n feaf-dashboard"
    echo "And view logs with: kubectl logs -n feaf-dashboard feaf-postgres-0"
}

echo ""
echo "📋 Current status:"
kubectl get statefulset,pod,svc,pvc -n feaf-dashboard -l app=feaf-postgres

echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Verify PostgreSQL is running:"
echo "   kubectl get pods -n feaf-dashboard -l app=feaf-postgres"
echo ""
echo "2. Check PostgreSQL logs:"
echo "   kubectl logs -n feaf-dashboard feaf-postgres-0"
echo ""
echo "3. Test database connectivity:"
echo "   kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c '\\l'"
echo ""
echo "4. Run verification script:"
echo "   ./verify-postgres.sh"
echo ""
