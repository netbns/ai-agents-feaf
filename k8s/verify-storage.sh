#!/bin/bash

# Script to verify persistent storage setup for FEAF Dashboard

set -e

echo "=========================================="
echo "FEAF Dashboard - Storage Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗ kubectl is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ kubectl is installed${NC}"

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}✗ Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}"
echo ""

# Check namespace
echo "Checking namespace..."
if kubectl get namespace feaf-dashboard &> /dev/null; then
    echo -e "${GREEN}✓ Namespace 'feaf-dashboard' exists${NC}"
else
    echo -e "${RED}✗ Namespace 'feaf-dashboard' not found${NC}"
    exit 1
fi
echo ""

# Check PersistentVolumeClaims
echo "Checking PersistentVolumeClaims..."
EXPECTED_PVCS=("postgres-pvc" "prometheus-pvc")
PVC_COUNT=0
BOUND_COUNT=0

for pvc in "${EXPECTED_PVCS[@]}"; do
    if kubectl get pvc "$pvc" -n feaf-dashboard &> /dev/null; then
        echo -e "${GREEN}✓ PVC '$pvc' exists${NC}"
        ((PVC_COUNT++))
        
        # Check PVC status
        STATUS=$(kubectl get pvc "$pvc" -n feaf-dashboard -o jsonpath='{.status.phase}')
        CAPACITY=$(kubectl get pvc "$pvc" -n feaf-dashboard -o jsonpath='{.status.capacity.storage}' 2>/dev/null || echo "N/A")
        STORAGE_CLASS=$(kubectl get pvc "$pvc" -n feaf-dashboard -o jsonpath='{.spec.storageClassName}' 2>/dev/null || echo "default")
        ACCESS_MODE=$(kubectl get pvc "$pvc" -n feaf-dashboard -o jsonpath='{.spec.accessModes[0]}')
        
        echo "  Status: $STATUS"
        echo "  Capacity: $CAPACITY"
        echo "  Storage Class: $STORAGE_CLASS"
        echo "  Access Mode: $ACCESS_MODE"
        
        if [ "$STATUS" == "Bound" ]; then
            echo -e "  ${GREEN}✓ PVC is bound to a PersistentVolume${NC}"
            ((BOUND_COUNT++))
        elif [ "$STATUS" == "Pending" ]; then
            echo -e "  ${YELLOW}⚠ PVC is pending (waiting for pod to claim it)${NC}"
        else
            echo -e "  ${RED}✗ PVC status: $STATUS${NC}"
        fi
    else
        echo -e "${RED}✗ PVC '$pvc' not found${NC}"
    fi
    echo ""
done

if [ $PVC_COUNT -eq ${#EXPECTED_PVCS[@]} ]; then
    echo -e "${GREEN}✓ All PVCs created (${PVC_COUNT}/${#EXPECTED_PVCS[@]})${NC}"
else
    echo -e "${RED}✗ Some PVCs missing (${PVC_COUNT}/${#EXPECTED_PVCS[@]})${NC}"
fi
echo ""

# Check PersistentVolumes
echo "Checking PersistentVolumes..."
PV_COUNT=$(kubectl get pv -o json | jq -r '.items[] | select(.spec.claimRef.namespace=="feaf-dashboard") | .metadata.name' 2>/dev/null | wc -l || echo "0")

if [ "$PV_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $PV_COUNT PersistentVolume(s) bound to feaf-dashboard namespace${NC}"
    echo ""
    echo "PersistentVolumes:"
    kubectl get pv -o json | jq -r '.items[] | select(.spec.claimRef.namespace=="feaf-dashboard") | "\(.metadata.name) - \(.spec.capacity.storage) - \(.status.phase)"' 2>/dev/null || echo "Unable to list PVs"
else
    echo -e "${YELLOW}⚠ No PersistentVolumes bound yet${NC}"
    echo "  This is normal if pods haven't been deployed yet."
    echo "  PVs will be dynamically provisioned when pods claim the PVCs."
fi
echo ""

# Check storage class
echo "Checking StorageClass..."
DEFAULT_SC=$(kubectl get storageclass -o json | jq -r '.items[] | select(.metadata.annotations."storageclass.kubernetes.io/is-default-class"=="true") | .metadata.name' 2>/dev/null || echo "")

if [ -n "$DEFAULT_SC" ]; then
    echo -e "${GREEN}✓ Default StorageClass: $DEFAULT_SC${NC}"
    
    # Show provisioner
    PROVISIONER=$(kubectl get storageclass "$DEFAULT_SC" -o jsonpath='{.provisioner}')
    echo "  Provisioner: $PROVISIONER"
else
    echo -e "${YELLOW}⚠ No default StorageClass found${NC}"
    echo "  You may need to specify a storageClassName in the PVC manifests."
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="

echo "PVCs created: ${PVC_COUNT}/${#EXPECTED_PVCS[@]}"
echo "PVCs bound: ${BOUND_COUNT}/${#EXPECTED_PVCS[@]}"
echo "PVs bound: ${PV_COUNT}"

if [ $PVC_COUNT -eq ${#EXPECTED_PVCS[@]} ]; then
    echo -e "${GREEN}✓ All PVCs are created successfully!${NC}"
    echo ""
    
    if [ $BOUND_COUNT -eq ${#EXPECTED_PVCS[@]} ]; then
        echo -e "${GREEN}✓ All PVCs are bound to PersistentVolumes!${NC}"
        echo "Storage is ready for use."
    else
        echo -e "${YELLOW}⚠ Some PVCs are not bound yet${NC}"
        echo "This is normal if pods haven't been deployed yet."
        echo "PVCs will be bound when pods claim them."
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Deploy PostgreSQL StatefulSet"
    echo "2. Deploy Prometheus"
    echo "3. Verify PVCs become bound"
    exit 0
else
    echo -e "${RED}✗ Some PVCs are missing${NC}"
    echo ""
    echo "Please run: ./apply-storage.sh"
    exit 1
fi

