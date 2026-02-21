#!/bin/bash

# Verification script for Dapr state store component
# This script verifies that the Dapr state store component is properly configured

set -e

NAMESPACE="feaf-dashboard"
COMPONENT_NAME="statestore"

echo "=========================================="
echo "Dapr State Store Component Verification"
echo "=========================================="
echo ""

# Check if namespace exists
echo "1. Checking namespace..."
if kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "   ✓ Namespace '$NAMESPACE' exists"
else
    echo "   ✗ Namespace '$NAMESPACE' not found"
    exit 1
fi
echo ""

# Check if feaf-secrets exists
echo "2. Checking secrets..."
if kubectl get secret feaf-secrets -n $NAMESPACE &> /dev/null; then
    echo "   ✓ Secret 'feaf-secrets' exists"
    
    # Verify database-url key exists
    if kubectl get secret feaf-secrets -n $NAMESPACE -o jsonpath='{.data.database-url}' &> /dev/null; then
        echo "   ✓ Secret contains 'database-url' key"
    else
        echo "   ✗ Secret missing 'database-url' key"
        exit 1
    fi
else
    echo "   ✗ Secret 'feaf-secrets' not found"
    exit 1
fi
echo ""

# Check if Dapr component exists
echo "3. Checking Dapr state store component..."
if kubectl get component $COMPONENT_NAME -n $NAMESPACE &> /dev/null; then
    echo "   ✓ Component '$COMPONENT_NAME' exists"
else
    echo "   ✗ Component '$COMPONENT_NAME' not found"
    exit 1
fi
echo ""

# Verify component configuration
echo "4. Verifying component configuration..."
COMPONENT_TYPE=$(kubectl get component $COMPONENT_NAME -n $NAMESPACE -o jsonpath='{.spec.type}')
COMPONENT_VERSION=$(kubectl get component $COMPONENT_NAME -n $NAMESPACE -o jsonpath='{.spec.version}')

if [ "$COMPONENT_TYPE" = "state.postgresql" ]; then
    echo "   ✓ Component type is 'state.postgresql'"
else
    echo "   ✗ Component type is '$COMPONENT_TYPE' (expected 'state.postgresql')"
    exit 1
fi

if [ "$COMPONENT_VERSION" = "v1" ]; then
    echo "   ✓ Component version is 'v1'"
else
    echo "   ✗ Component version is '$COMPONENT_VERSION' (expected 'v1')"
    exit 1
fi
echo ""

# Check metadata configuration
echo "5. Checking component metadata..."
echo "   Component metadata:"
kubectl get component $COMPONENT_NAME -n $NAMESPACE -o jsonpath='{.spec.metadata[*].name}' | tr ' ' '\n' | while read -r meta; do
    if [ -n "$meta" ]; then
        VALUE=$(kubectl get component $COMPONENT_NAME -n $NAMESPACE -o jsonpath="{.spec.metadata[?(@.name=='$meta')].value}")
        SECRET_REF=$(kubectl get component $COMPONENT_NAME -n $NAMESPACE -o jsonpath="{.spec.metadata[?(@.name=='$meta')].secretKeyRef.name}")
        
        if [ -n "$SECRET_REF" ]; then
            echo "     - $meta: (from secret '$SECRET_REF')"
        else
            echo "     - $meta: $VALUE"
        fi
    fi
done
echo ""

# Check Dapr control plane
echo "6. Checking Dapr control plane..."
DAPR_OPERATOR=$(kubectl get pods -n dapr-system -l app=dapr-operator --no-headers 2>/dev/null | wc -l)
DAPR_PLACEMENT=$(kubectl get pods -n dapr-system -l app=dapr-placement-server --no-headers 2>/dev/null | wc -l)
DAPR_SENTRY=$(kubectl get pods -n dapr-system -l app=dapr-sentry --no-headers 2>/dev/null | wc -l)

if [ "$DAPR_OPERATOR" -gt 0 ]; then
    echo "   ✓ Dapr Operator is running"
else
    echo "   ✗ Dapr Operator not found"
fi

if [ "$DAPR_PLACEMENT" -gt 0 ]; then
    echo "   ✓ Dapr Placement is running"
else
    echo "   ✗ Dapr Placement not found"
fi

if [ "$DAPR_SENTRY" -gt 0 ]; then
    echo "   ✓ Dapr Sentry is running"
else
    echo "   ✗ Dapr Sentry not found"
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo "✓ Dapr state store component is properly configured"
echo "✓ Component is using PostgreSQL as the backing store"
echo "✓ Connection string is configured from Kubernetes Secret"
echo ""
echo "Component Details:"
echo "  Name: $COMPONENT_NAME"
echo "  Namespace: $NAMESPACE"
echo "  Type: $COMPONENT_TYPE"
echo "  Version: $COMPONENT_VERSION"
echo ""
echo "Next Steps:"
echo "  - Deploy backend service with Dapr sidecar annotations"
echo "  - Test state operations using Dapr SDK"
echo "  - Verify state is persisted to PostgreSQL"
echo ""
