#!/bin/bash

# Script to verify PostgreSQL deployment for FEAF Dashboard
# This script checks that PostgreSQL is running correctly and accessible

set -e

echo "=========================================="
echo "Verifying PostgreSQL Deployment"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if namespace exists
echo "1. Checking namespace..."
if kubectl get namespace feaf-dashboard &> /dev/null; then
    echo -e "${GREEN}✅ Namespace 'feaf-dashboard' exists${NC}"
else
    echo -e "${RED}❌ Namespace 'feaf-dashboard' does not exist${NC}"
    exit 1
fi
echo ""

# Check if StatefulSet exists
echo "2. Checking StatefulSet..."
if kubectl get statefulset feaf-postgres -n feaf-dashboard &> /dev/null; then
    echo -e "${GREEN}✅ StatefulSet 'feaf-postgres' exists${NC}"
    REPLICAS=$(kubectl get statefulset feaf-postgres -n feaf-dashboard -o jsonpath='{.status.replicas}')
    READY=$(kubectl get statefulset feaf-postgres -n feaf-dashboard -o jsonpath='{.status.readyReplicas}')
    echo "   Replicas: $REPLICAS, Ready: $READY"
    if [ "$REPLICAS" == "$READY" ]; then
        echo -e "${GREEN}✅ All replicas are ready${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: Not all replicas are ready${NC}"
    fi
else
    echo -e "${RED}❌ StatefulSet 'feaf-postgres' does not exist${NC}"
    exit 1
fi
echo ""

# Check if Pod is running
echo "3. Checking Pod status..."
POD_STATUS=$(kubectl get pod feaf-postgres-0 -n feaf-dashboard -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
if [ "$POD_STATUS" == "Running" ]; then
    echo -e "${GREEN}✅ Pod 'feaf-postgres-0' is running${NC}"
else
    echo -e "${RED}❌ Pod 'feaf-postgres-0' is not running (Status: $POD_STATUS)${NC}"
    echo "   Check logs with: kubectl logs -n feaf-dashboard feaf-postgres-0"
    exit 1
fi
echo ""

# Check if Pod is ready
echo "4. Checking Pod readiness..."
POD_READY=$(kubectl get pod feaf-postgres-0 -n feaf-dashboard -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
if [ "$POD_READY" == "True" ]; then
    echo -e "${GREEN}✅ Pod is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Pod is not ready yet${NC}"
fi
echo ""

# Check if Service exists
echo "5. Checking Service..."
if kubectl get service feaf-postgres -n feaf-dashboard &> /dev/null; then
    echo -e "${GREEN}✅ Service 'feaf-postgres' exists${NC}"
    SERVICE_IP=$(kubectl get service feaf-postgres -n feaf-dashboard -o jsonpath='{.spec.clusterIP}')
    echo "   Cluster IP: $SERVICE_IP (Headless service)"
else
    echo -e "${RED}❌ Service 'feaf-postgres' does not exist${NC}"
    exit 1
fi
echo ""

# Check if PVC is bound
echo "6. Checking PersistentVolumeClaim..."
PVC_STATUS=$(kubectl get pvc -n feaf-dashboard -l app=feaf-postgres -o jsonpath='{.items[0].status.phase}' 2>/dev/null || echo "NotFound")
if [ "$PVC_STATUS" == "Bound" ]; then
    echo -e "${GREEN}✅ PersistentVolumeClaim is bound${NC}"
    PVC_SIZE=$(kubectl get pvc -n feaf-dashboard -l app=feaf-postgres -o jsonpath='{.items[0].spec.resources.requests.storage}')
    echo "   Storage size: $PVC_SIZE"
else
    echo -e "${RED}❌ PersistentVolumeClaim is not bound (Status: $PVC_STATUS)${NC}"
    exit 1
fi
echo ""

# Check database connectivity
echo "7. Testing database connectivity..."
if kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- pg_isready -U feaf_user -d feaf &> /dev/null; then
    echo -e "${GREEN}✅ Database is accepting connections${NC}"
else
    echo -e "${RED}❌ Database is not accepting connections${NC}"
    exit 1
fi
echo ""

# Test database query
echo "8. Testing database query..."
if kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "SELECT version();" &> /dev/null; then
    echo -e "${GREEN}✅ Database query successful${NC}"
    VERSION=$(kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -t -c "SELECT version();" | head -n 1 | xargs)
    echo "   PostgreSQL version: $VERSION"
else
    echo -e "${RED}❌ Database query failed${NC}"
    exit 1
fi
echo ""

# Check resource usage
echo "9. Checking resource usage..."
CPU_USAGE=$(kubectl top pod feaf-postgres-0 -n feaf-dashboard --no-headers 2>/dev/null | awk '{print $2}' || echo "N/A")
MEM_USAGE=$(kubectl top pod feaf-postgres-0 -n feaf-dashboard --no-headers 2>/dev/null | awk '{print $3}' || echo "N/A")
if [ "$CPU_USAGE" != "N/A" ]; then
    echo -e "${GREEN}✅ Resource metrics available${NC}"
    echo "   CPU usage: $CPU_USAGE"
    echo "   Memory usage: $MEM_USAGE"
else
    echo -e "${YELLOW}⚠️  Warning: Resource metrics not available (metrics-server may not be installed)${NC}"
fi
echo ""

# Check logs for errors
echo "10. Checking logs for errors..."
ERROR_COUNT=$(kubectl logs feaf-postgres-0 -n feaf-dashboard --tail=100 2>/dev/null | grep -i "error\|fatal\|panic" | wc -l || echo "0")
if [ "$ERROR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No errors found in recent logs${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Found $ERROR_COUNT error messages in recent logs${NC}"
    echo "   Review logs with: kubectl logs -n feaf-dashboard feaf-postgres-0"
fi
echo ""

echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ PostgreSQL deployment is healthy and ready${NC}"
echo ""
echo "Database connection details:"
echo "  Host: feaf-postgres.feaf-dashboard.svc.cluster.local"
echo "  Port: 5432"
echo "  Database: feaf"
echo "  User: feaf_user"
echo ""
echo "To connect from within the cluster:"
echo "  postgresql://feaf_user:PASSWORD@feaf-postgres:5432/feaf"
echo ""
echo "To access PostgreSQL shell:"
echo "  kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf"
echo ""
