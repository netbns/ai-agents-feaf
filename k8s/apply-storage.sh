#!/bin/bash

# Script to apply persistent storage manifests for FEAF Dashboard
# This script creates PersistentVolumeClaims for PostgreSQL and Prometheus

set -e

echo "=========================================="
echo "FEAF Dashboard - Persistent Storage Setup"
echo "=========================================="
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed or not in PATH"
    exit 1
fi

# Check if kubectl can connect to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: Cannot connect to Kubernetes cluster"
    echo "Please ensure kubectl is configured correctly"
    exit 1
fi

echo "✓ kubectl is configured and connected to cluster"
echo ""

# Check if namespace exists
if ! kubectl get namespace feaf-dashboard &> /dev/null; then
    echo "Error: Namespace 'feaf-dashboard' does not exist"
    echo "Please run ./apply-infrastructure.sh first"
    exit 1
fi

echo "✓ Namespace 'feaf-dashboard' exists"
echo ""

# Apply PVC manifests
echo "Step 1/2: Creating PostgreSQL PersistentVolumeClaim..."
kubectl apply -f 06-postgres-pvc.yaml

echo ""
echo "Step 2/2: Creating Prometheus PersistentVolumeClaim..."
kubectl apply -f 07-prometheus-pvc.yaml

echo ""
echo "=========================================="
echo "Persistent storage setup complete!"
echo "=========================================="
echo ""

# Verification
echo "Verifying PersistentVolumeClaims..."
echo ""

echo "PostgreSQL PVC:"
kubectl get pvc postgres-pvc -n feaf-dashboard

echo ""
echo "Prometheus PVC:"
kubectl get pvc prometheus-pvc -n feaf-dashboard

echo ""
echo "=========================================="
echo "Storage Status:"
echo "=========================================="
kubectl get pvc -n feaf-dashboard

echo ""
echo "Note: PVCs may remain in 'Pending' state until a pod claims them."
echo "This is normal behavior for dynamic provisioning."
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Deploy PostgreSQL StatefulSet (will bind to postgres-pvc)"
echo "2. Deploy Prometheus (will bind to prometheus-pvc)"
echo "3. Verify persistent volumes are bound"
echo ""
echo "For detailed instructions, see k8s/README.md"

