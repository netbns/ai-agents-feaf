#!/bin/bash

# Script to apply Kubernetes infrastructure manifests for FEAF Dashboard
# This script sets up namespace, service accounts, RBAC, and resource quotas

set -e

echo "=========================================="
echo "FEAF Dashboard - Infrastructure Setup"
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

# Apply manifests in order
echo "Step 1/6: Creating namespace..."
kubectl apply -f 00-namespace.yaml

echo ""
echo "Step 2/6: Creating service accounts..."
kubectl apply -f 01-service-accounts.yaml

echo ""
echo "Step 3/6: Setting up RBAC roles and bindings..."
kubectl apply -f 02-rbac-roles.yaml

echo ""
echo "Step 4/6: Configuring resource quotas and limits..."
kubectl apply -f 03-resource-quotas.yaml

echo ""
echo "Step 5/6: Creating ConfigMaps..."
kubectl apply -f 04-configmap.yaml

echo ""
echo "Step 6/6: Creating Secrets..."
if [ -f "05-secrets.yaml" ]; then
    echo "WARNING: Applying secrets from 05-secrets.yaml"
    echo "Ensure you have replaced placeholder values with secure credentials!"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl apply -f 05-secrets.yaml
    else
        echo "Skipping secrets creation. Please create secrets manually."
        echo "See SECRET-MANAGEMENT.md for instructions."
    fi
else
    echo "05-secrets.yaml not found. Please create secrets manually."
    echo "See SECRET-MANAGEMENT.md for instructions."
fi

echo ""
echo "=========================================="
echo "Infrastructure setup complete!"
echo "=========================================="
echo ""

# Verification
echo "Verifying deployment..."
echo ""

echo "Namespace:"
kubectl get namespace feaf-dashboard

echo ""
echo "Service Accounts:"
kubectl get serviceaccounts -n feaf-dashboard

echo ""
echo "Roles:"
kubectl get roles -n feaf-dashboard

echo ""
echo "Role Bindings:"
kubectl get rolebindings -n feaf-dashboard

echo ""
echo "Resource Quota:"
kubectl get resourcequota -n feaf-dashboard

echo ""
echo "Limit Range:"
kubectl get limitrange -n feaf-dashboard

echo ""
echo "ConfigMaps:"
kubectl get configmap -n feaf-dashboard

echo ""
echo "Secrets:"
kubectl get secrets -n feaf-dashboard

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Verify secrets are created (see SECRET-MANAGEMENT.md)"
echo "2. Set up persistent storage"
echo "3. Deploy PostgreSQL"
echo "4. Deploy backend and frontend services"
echo "5. Deploy Prometheus monitoring"
echo ""
echo "For detailed instructions, see k8s/README.md"
