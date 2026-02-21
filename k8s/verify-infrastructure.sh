#!/bin/bash

# Script to verify Kubernetes infrastructure setup for FEAF Dashboard

set -e

echo "=========================================="
echo "FEAF Dashboard - Infrastructure Verification"
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

# Check service accounts
echo "Checking service accounts..."
EXPECTED_SA=("feaf-frontend-sa" "feaf-backend-sa" "feaf-postgres-sa" "prometheus-sa")
SA_COUNT=0

for sa in "${EXPECTED_SA[@]}"; do
    if kubectl get serviceaccount "$sa" -n feaf-dashboard &> /dev/null; then
        echo -e "${GREEN}✓ Service account '$sa' exists${NC}"
        ((SA_COUNT++))
    else
        echo -e "${RED}✗ Service account '$sa' not found${NC}"
    fi
done

if [ $SA_COUNT -eq ${#EXPECTED_SA[@]} ]; then
    echo -e "${GREEN}✓ All service accounts created (${SA_COUNT}/${#EXPECTED_SA[@]})${NC}"
else
    echo -e "${YELLOW}⚠ Some service accounts missing (${SA_COUNT}/${#EXPECTED_SA[@]})${NC}"
fi
echo ""

# Check roles
echo "Checking RBAC roles..."
EXPECTED_ROLES=("feaf-backend-role" "prometheus-role")
ROLE_COUNT=0

for role in "${EXPECTED_ROLES[@]}"; do
    if kubectl get role "$role" -n feaf-dashboard &> /dev/null; then
        echo -e "${GREEN}✓ Role '$role' exists${NC}"
        ((ROLE_COUNT++))
    else
        echo -e "${RED}✗ Role '$role' not found${NC}"
    fi
done

if [ $ROLE_COUNT -eq ${#EXPECTED_ROLES[@]} ]; then
    echo -e "${GREEN}✓ All roles created (${ROLE_COUNT}/${#EXPECTED_ROLES[@]})${NC}"
else
    echo -e "${YELLOW}⚠ Some roles missing (${ROLE_COUNT}/${#EXPECTED_ROLES[@]})${NC}"
fi
echo ""

# Check role bindings
echo "Checking role bindings..."
EXPECTED_BINDINGS=("feaf-backend-rolebinding" "prometheus-rolebinding")
BINDING_COUNT=0

for binding in "${EXPECTED_BINDINGS[@]}"; do
    if kubectl get rolebinding "$binding" -n feaf-dashboard &> /dev/null; then
        echo -e "${GREEN}✓ RoleBinding '$binding' exists${NC}"
        ((BINDING_COUNT++))
    else
        echo -e "${RED}✗ RoleBinding '$binding' not found${NC}"
    fi
done

if [ $BINDING_COUNT -eq ${#EXPECTED_BINDINGS[@]} ]; then
    echo -e "${GREEN}✓ All role bindings created (${BINDING_COUNT}/${#EXPECTED_BINDINGS[@]})${NC}"
else
    echo -e "${YELLOW}⚠ Some role bindings missing (${BINDING_COUNT}/${#EXPECTED_BINDINGS[@]})${NC}"
fi
echo ""

# Check resource quota
echo "Checking resource quota..."
if kubectl get resourcequota feaf-dashboard-quota -n feaf-dashboard &> /dev/null; then
    echo -e "${GREEN}✓ ResourceQuota 'feaf-dashboard-quota' exists${NC}"
    echo ""
    echo "Resource Quota Details:"
    kubectl describe resourcequota feaf-dashboard-quota -n feaf-dashboard | grep -A 20 "Resource"
else
    echo -e "${RED}✗ ResourceQuota 'feaf-dashboard-quota' not found${NC}"
fi
echo ""

# Check limit range
echo "Checking limit range..."
if kubectl get limitrange feaf-dashboard-limits -n feaf-dashboard &> /dev/null; then
    echo -e "${GREEN}✓ LimitRange 'feaf-dashboard-limits' exists${NC}"
else
    echo -e "${RED}✗ LimitRange 'feaf-dashboard-limits' not found${NC}"
fi
echo ""

# Check ConfigMaps
echo "Checking ConfigMaps..."
EXPECTED_CONFIGMAPS=("feaf-config" "prometheus-config")
CM_COUNT=0

for cm in "${EXPECTED_CONFIGMAPS[@]}"; do
    if kubectl get configmap "$cm" -n feaf-dashboard &> /dev/null; then
        echo -e "${GREEN}✓ ConfigMap '$cm' exists${NC}"
        ((CM_COUNT++))
    else
        echo -e "${YELLOW}⚠ ConfigMap '$cm' not found${NC}"
    fi
done

if [ $CM_COUNT -eq ${#EXPECTED_CONFIGMAPS[@]} ]; then
    echo -e "${GREEN}✓ All ConfigMaps created (${CM_COUNT}/${#EXPECTED_CONFIGMAPS[@]})${NC}"
else
    echo -e "${YELLOW}⚠ Some ConfigMaps missing (${CM_COUNT}/${#EXPECTED_CONFIGMAPS[@]})${NC}"
fi
echo ""

# Check Secrets
echo "Checking Secrets..."
if kubectl get secret feaf-secrets -n feaf-dashboard &> /dev/null; then
    echo -e "${GREEN}✓ Secret 'feaf-secrets' exists${NC}"
    
    # Verify secret has required keys
    echo "  Verifying secret keys..."
    REQUIRED_KEYS=("db-user" "db-password" "database-url" "jwt-secret")
    MISSING_KEYS=()
    
    for key in "${REQUIRED_KEYS[@]}"; do
        if kubectl get secret feaf-secrets -n feaf-dashboard -o jsonpath="{.data.$key}" &> /dev/null; then
            # Check if value is not a placeholder
            VALUE=$(kubectl get secret feaf-secrets -n feaf-dashboard -o jsonpath="{.data.$key}" | base64 -d)
            if [[ "$VALUE" == *"CHANGE_ME"* ]]; then
                echo -e "${YELLOW}  ⚠ Key '$key' contains placeholder value${NC}"
            else
                echo -e "${GREEN}  ✓ Key '$key' exists and configured${NC}"
            fi
        else
            MISSING_KEYS+=("$key")
            echo -e "${RED}  ✗ Key '$key' missing${NC}"
        fi
    done
    
    if [ ${#MISSING_KEYS[@]} -gt 0 ]; then
        echo -e "${YELLOW}⚠ Secret exists but some keys are missing or have placeholder values${NC}"
        echo -e "${YELLOW}  See SECRET-MANAGEMENT.md for instructions${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Secret 'feaf-secrets' not found${NC}"
    echo -e "${YELLOW}  Please create secrets before deploying applications${NC}"
    echo -e "${YELLOW}  See SECRET-MANAGEMENT.md for instructions${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Verification Summary"
echo "=========================================="

TOTAL_CHECKS=$((1 + ${#EXPECTED_SA[@]} + ${#EXPECTED_ROLES[@]} + ${#EXPECTED_BINDINGS[@]} + 2 + ${#EXPECTED_CONFIGMAPS[@]} + 1))
PASSED_CHECKS=$((1 + SA_COUNT + ROLE_COUNT + BINDING_COUNT))

if kubectl get resourcequota feaf-dashboard-quota -n feaf-dashboard &> /dev/null; then
    ((PASSED_CHECKS++))
fi

if kubectl get limitrange feaf-dashboard-limits -n feaf-dashboard &> /dev/null; then
    ((PASSED_CHECKS++))
fi

PASSED_CHECKS=$((PASSED_CHECKS + CM_COUNT))

if kubectl get secret feaf-secrets -n feaf-dashboard &> /dev/null; then
    ((PASSED_CHECKS++))
fi

echo "Checks passed: ${PASSED_CHECKS}/${TOTAL_CHECKS}"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}✓ All infrastructure components verified successfully!${NC}"
    echo ""
    echo "Infrastructure is ready for application deployment."
    exit 0
else
    echo -e "${YELLOW}⚠ Some components are missing or misconfigured${NC}"
    echo ""
    echo "Please run: ./apply-infrastructure.sh"
    echo "For secrets, see: SECRET-MANAGEMENT.md"
    exit 1
fi
