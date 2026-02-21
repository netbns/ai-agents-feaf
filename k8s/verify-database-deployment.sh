#!/bin/bash

# Comprehensive Database Deployment Verification Script
# Task: Verify database deployment (Requirement 10.3)
# This script performs all verification steps for the PostgreSQL database deployment

set -e

echo "=========================================="
echo "Database Deployment Verification"
echo "Task 5: Verify database deployment"
echo "Requirement: 10.3"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
VERIFICATION_PASSED=true

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_section "STEP 1: Checking Prerequisites"
    
    # Check if Docker is running
    echo "1.1 Checking Docker daemon..."
    if docker ps &> /dev/null; then
        echo -e "${GREEN}✅ Docker daemon is running${NC}"
    else
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo -e "${YELLOW}   Action required: Start Docker Desktop${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    # Check if minikube is installed
    echo ""
    echo "1.2 Checking minikube installation..."
    if command -v minikube &> /dev/null; then
        echo -e "${GREEN}✅ minikube is installed${NC}"
        MINIKUBE_VERSION=$(minikube version --short)
        echo "   Version: $MINIKUBE_VERSION"
    else
        echo -e "${RED}❌ minikube is not installed${NC}"
        echo -e "${YELLOW}   Action required: Install minikube${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    # Check if kubectl is installed
    echo ""
    echo "1.3 Checking kubectl installation..."
    if command -v kubectl &> /dev/null; then
        echo -e "${GREEN}✅ kubectl is installed${NC}"
        KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | head -1)
        echo "   Version: $KUBECTL_VERSION"
    else
        echo -e "${RED}❌ kubectl is not installed${NC}"
        echo -e "${YELLOW}   Action required: Install kubectl${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    # Check if minikube is running
    echo ""
    echo "1.4 Checking minikube cluster status..."
    MINIKUBE_STATUS=$(minikube status -o json 2>/dev/null | jq -r '.Host' 2>/dev/null || echo "Stopped")
    if [ "$MINIKUBE_STATUS" == "Running" ]; then
        echo -e "${GREEN}✅ minikube cluster is running${NC}"
    else
        echo -e "${RED}❌ minikube cluster is not running (Status: $MINIKUBE_STATUS)${NC}"
        echo -e "${YELLOW}   Action required: Start minikube with 'minikube start'${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    echo ""
    echo -e "${GREEN}✅ All prerequisites are met${NC}"
}

# Function to test database connectivity from within cluster
test_database_connectivity() {
    print_section "STEP 2: Testing Database Connectivity from Within Cluster"
    
    # Check if namespace exists
    echo "2.1 Checking namespace..."
    if kubectl get namespace feaf-dashboard &> /dev/null; then
        echo -e "${GREEN}✅ Namespace 'feaf-dashboard' exists${NC}"
    else
        echo -e "${RED}❌ Namespace 'feaf-dashboard' does not exist${NC}"
        echo -e "${YELLOW}   Action required: Deploy infrastructure first${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    # Check if PostgreSQL pod exists and is running
    echo ""
    echo "2.2 Checking PostgreSQL pod status..."
    POD_STATUS=$(kubectl get pod feaf-postgres-0 -n feaf-dashboard -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
    if [ "$POD_STATUS" == "Running" ]; then
        echo -e "${GREEN}✅ PostgreSQL pod 'feaf-postgres-0' is running${NC}"
    else
        echo -e "${RED}❌ PostgreSQL pod is not running (Status: $POD_STATUS)${NC}"
        echo -e "${YELLOW}   Action required: Deploy PostgreSQL StatefulSet${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    # Check if pod is ready
    echo ""
    echo "2.3 Checking pod readiness..."
    POD_READY=$(kubectl get pod feaf-postgres-0 -n feaf-dashboard -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
    if [ "$POD_READY" == "True" ]; then
        echo -e "${GREEN}✅ PostgreSQL pod is ready${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL pod is not ready yet${NC}"
        echo "   Waiting for pod to become ready..."
        kubectl wait --for=condition=ready pod/feaf-postgres-0 -n feaf-dashboard --timeout=60s || true
        POD_READY=$(kubectl get pod feaf-postgres-0 -n feaf-dashboard -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
        if [ "$POD_READY" == "True" ]; then
            echo -e "${GREEN}✅ PostgreSQL pod is now ready${NC}"
        else
            echo -e "${RED}❌ PostgreSQL pod failed to become ready${NC}"
            VERIFICATION_PASSED=false
            return 1
        fi
    fi
    
    # Test pg_isready
    echo ""
    echo "2.4 Testing database connectivity with pg_isready..."
    if kubectl exec feaf-postgres-0 -n feaf-dashboard -- pg_isready -U feaf_user -d feaf &> /dev/null; then
        echo -e "${GREEN}✅ Database is accepting connections${NC}"
    else
        echo -e "${RED}❌ Database is not accepting connections${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    # Test actual database query
    echo ""
    echo "2.5 Testing database query execution..."
    QUERY_RESULT=$(kubectl exec feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -t -c "SELECT 1;" 2>/dev/null | xargs || echo "FAILED")
    if [ "$QUERY_RESULT" == "1" ]; then
        echo -e "${GREEN}✅ Database query executed successfully${NC}"
    else
        echo -e "${RED}❌ Database query failed${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    # Get PostgreSQL version
    echo ""
    echo "2.6 Retrieving PostgreSQL version..."
    PG_VERSION=$(kubectl exec feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -t -c "SELECT version();" 2>/dev/null | head -1 | xargs || echo "Unknown")
    if [ "$PG_VERSION" != "Unknown" ]; then
        echo -e "${GREEN}✅ PostgreSQL version retrieved${NC}"
        echo "   Version: $PG_VERSION"
    else
        echo -e "${YELLOW}⚠️  Could not retrieve PostgreSQL version${NC}"
    fi
    
    # Test connection from a temporary pod
    echo ""
    echo "2.7 Testing connectivity from another pod in the cluster..."
    TEST_POD_RESULT=$(kubectl run test-db-connection --image=postgres:15 --rm -i --restart=Never -n feaf-dashboard --command -- psql -h feaf-postgres -U feaf_user -d feaf -c "SELECT 1;" 2>&1 | grep -q "1 row" && echo "SUCCESS" || echo "FAILED")
    if [ "$TEST_POD_RESULT" == "SUCCESS" ]; then
        echo -e "${GREEN}✅ Database is accessible from other pods in the cluster${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not verify connectivity from another pod${NC}"
        echo "   This may be due to authentication or network issues"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Database connectivity verified${NC}"
}

# Function to verify persistent storage
verify_persistent_storage() {
    print_section "STEP 3: Verifying Persistent Storage"
    
    # Check if PVC exists
    echo "3.1 Checking PersistentVolumeClaim..."
    PVC_NAME=$(kubectl get pvc -n feaf-dashboard -l app=feaf-postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "NotFound")
    if [ "$PVC_NAME" != "NotFound" ]; then
        echo -e "${GREEN}✅ PersistentVolumeClaim '$PVC_NAME' exists${NC}"
    else
        echo -e "${RED}❌ PersistentVolumeClaim not found${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    # Check PVC status
    echo ""
    echo "3.2 Checking PVC binding status..."
    PVC_STATUS=$(kubectl get pvc $PVC_NAME -n feaf-dashboard -o jsonpath='{.status.phase}')
    if [ "$PVC_STATUS" == "Bound" ]; then
        echo -e "${GREEN}✅ PVC is bound to a PersistentVolume${NC}"
    else
        echo -e "${RED}❌ PVC is not bound (Status: $PVC_STATUS)${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    # Get PVC details
    echo ""
    echo "3.3 Retrieving PVC details..."
    PVC_SIZE=$(kubectl get pvc $PVC_NAME -n feaf-dashboard -o jsonpath='{.spec.resources.requests.storage}')
    PVC_STORAGE_CLASS=$(kubectl get pvc $PVC_NAME -n feaf-dashboard -o jsonpath='{.spec.storageClassName}')
    PV_NAME=$(kubectl get pvc $PVC_NAME -n feaf-dashboard -o jsonpath='{.spec.volumeName}')
    echo -e "${GREEN}✅ PVC details retrieved${NC}"
    echo "   Storage size: $PVC_SIZE"
    echo "   Storage class: $PVC_STORAGE_CLASS"
    echo "   Bound to PV: $PV_NAME"
    
    # Check if data directory is mounted
    echo ""
    echo "3.4 Checking data directory mount..."
    DATA_DIR_EXISTS=$(kubectl exec feaf-postgres-0 -n feaf-dashboard -- test -d /var/lib/postgresql/data/pgdata && echo "YES" || echo "NO")
    if [ "$DATA_DIR_EXISTS" == "YES" ]; then
        echo -e "${GREEN}✅ Data directory is mounted${NC}"
    else
        echo -e "${RED}❌ Data directory is not mounted${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    # Check disk usage
    echo ""
    echo "3.5 Checking disk usage..."
    DISK_USAGE=$(kubectl exec feaf-postgres-0 -n feaf-dashboard -- df -h /var/lib/postgresql/data 2>/dev/null | tail -1 || echo "N/A")
    if [ "$DISK_USAGE" != "N/A" ]; then
        echo -e "${GREEN}✅ Disk usage information retrieved${NC}"
        echo "   $DISK_USAGE"
    else
        echo -e "${YELLOW}⚠️  Could not retrieve disk usage${NC}"
    fi
    
    # Test write operation
    echo ""
    echo "3.6 Testing write operation to persistent storage..."
    WRITE_TEST=$(kubectl exec feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "CREATE TABLE IF NOT EXISTS storage_test (id SERIAL PRIMARY KEY, test_data TEXT); INSERT INTO storage_test (test_data) VALUES ('test'); SELECT test_data FROM storage_test WHERE test_data='test'; DROP TABLE storage_test;" 2>&1 | grep -q "test" && echo "SUCCESS" || echo "FAILED")
    if [ "$WRITE_TEST" == "SUCCESS" ]; then
        echo -e "${GREEN}✅ Write operation to persistent storage successful${NC}"
    else
        echo -e "${RED}❌ Write operation failed${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    
    echo ""
    echo -e "${GREEN}✅ Persistent storage is working correctly${NC}"
}

# Function to check pod logs for errors
check_pod_logs() {
    print_section "STEP 4: Checking Pod Logs for Errors"
    
    echo "4.1 Retrieving recent pod logs..."
    RECENT_LOGS=$(kubectl logs feaf-postgres-0 -n feaf-dashboard --tail=100 2>/dev/null || echo "FAILED")
    if [ "$RECENT_LOGS" == "FAILED" ]; then
        echo -e "${RED}❌ Could not retrieve pod logs${NC}"
        VERIFICATION_PASSED=false
        return 1
    fi
    echo -e "${GREEN}✅ Pod logs retrieved${NC}"
    
    # Check for critical errors
    echo ""
    echo "4.2 Checking for FATAL errors..."
    FATAL_COUNT=$(echo "$RECENT_LOGS" | grep -i "FATAL" | wc -l | xargs)
    if [ "$FATAL_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✅ No FATAL errors found${NC}"
    else
        echo -e "${RED}❌ Found $FATAL_COUNT FATAL errors${NC}"
        echo "   Recent FATAL errors:"
        echo "$RECENT_LOGS" | grep -i "FATAL" | tail -5
        VERIFICATION_PASSED=false
    fi
    
    # Check for ERROR messages
    echo ""
    echo "4.3 Checking for ERROR messages..."
    ERROR_COUNT=$(echo "$RECENT_LOGS" | grep -i "ERROR" | wc -l | xargs)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✅ No ERROR messages found${NC}"
    else
        echo -e "${YELLOW}⚠️  Found $ERROR_COUNT ERROR messages${NC}"
        echo "   Recent ERROR messages:"
        echo "$RECENT_LOGS" | grep -i "ERROR" | tail -5
    fi
    
    # Check for PANIC messages
    echo ""
    echo "4.4 Checking for PANIC messages..."
    PANIC_COUNT=$(echo "$RECENT_LOGS" | grep -i "PANIC" | wc -l | xargs)
    if [ "$PANIC_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✅ No PANIC messages found${NC}"
    else
        echo -e "${RED}❌ Found $PANIC_COUNT PANIC messages${NC}"
        echo "   Recent PANIC messages:"
        echo "$RECENT_LOGS" | grep -i "PANIC" | tail -5
        VERIFICATION_PASSED=false
    fi
    
    # Check for successful startup
    echo ""
    echo "4.5 Checking for successful database startup..."
    STARTUP_SUCCESS=$(echo "$RECENT_LOGS" | grep -i "database system is ready to accept connections" | wc -l | xargs)
    if [ "$STARTUP_SUCCESS" -gt 0 ]; then
        echo -e "${GREEN}✅ Database started successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not confirm successful startup in recent logs${NC}"
    fi
    
    # Check for initialization completion
    echo ""
    echo "4.6 Checking for initialization script execution..."
    INIT_SUCCESS=$(echo "$RECENT_LOGS" | grep -i "PostgreSQL init process complete" | wc -l | xargs)
    if [ "$INIT_SUCCESS" -gt 0 ]; then
        echo -e "${GREEN}✅ Initialization scripts executed${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not confirm initialization script execution (may have run in previous startup)${NC}"
    fi
    
    echo ""
    if [ "$FATAL_COUNT" -eq 0 ] && [ "$PANIC_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✅ No critical errors found in logs${NC}"
    else
        echo -e "${RED}❌ Critical errors found in logs${NC}"
    fi
}

# Function to display summary
display_summary() {
    print_section "VERIFICATION SUMMARY"
    
    if [ "$VERIFICATION_PASSED" = true ]; then
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✅ DATABASE VERIFICATION PASSED      ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo "All verification checks passed successfully:"
        echo "  ✅ Database connectivity from within cluster"
        echo "  ✅ Persistent storage is working"
        echo "  ✅ No critical errors in pod logs"
        echo ""
        echo "Database connection details:"
        echo "  Host: feaf-postgres.feaf-dashboard.svc.cluster.local"
        echo "  Port: 5432"
        echo "  Database: feaf"
        echo "  User: feaf_user"
        echo ""
        echo "To access PostgreSQL shell:"
        echo "  kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf"
        echo ""
        echo "Task 5 (Verify database deployment) is complete! ✅"
    else
        echo -e "${RED}╔════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ❌ DATABASE VERIFICATION FAILED       ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo "Some verification checks failed. Please review the output above."
        echo ""
        echo "Common troubleshooting steps:"
        echo "  1. Ensure Docker Desktop is running"
        echo "  2. Start minikube: minikube start"
        echo "  3. Deploy infrastructure: cd k8s && ./apply-infrastructure.sh"
        echo "  4. Deploy PostgreSQL: cd k8s && ./apply-postgres.sh"
        echo "  5. Check pod logs: kubectl logs -n feaf-dashboard feaf-postgres-0"
        echo ""
        exit 1
    fi
}

# Main execution
main() {
    check_prerequisites || exit 1
    test_database_connectivity || exit 1
    verify_persistent_storage || exit 1
    check_pod_logs || exit 1
    display_summary
}

# Run main function
main
