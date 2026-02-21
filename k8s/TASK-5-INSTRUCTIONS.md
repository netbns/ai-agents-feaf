# Task 5: Verify Database Deployment - Instructions

## Task Overview

**Task**: 5. Verify database deployment  
**Requirements**: 10.3 - THE Database SHALL be deployed as a Kubernetes StatefulSet with persistent volumes  
**Status**: Ready for execution

## What This Task Accomplishes

This task verifies that the PostgreSQL database deployment is working correctly by:
1. Testing database connectivity from within the Kubernetes cluster
2. Verifying persistent storage is properly configured and working
3. Checking pod logs for any errors
4. Ensuring the database is ready to accept connections from the backend application

## Prerequisites

Before you can run the verification, you need:

### 1. Docker Desktop Running
The Kubernetes cluster (minikube) requires Docker to be running.

**Check if Docker is running:**
```bash
docker ps
```

**If not running:**
- Open Docker Desktop application
- Wait for it to fully start

### 2. Minikube Cluster Running
The application runs on a local Kubernetes cluster using minikube.

**Check if minikube is running:**
```bash
minikube status
```

**If not running:**
```bash
minikube start
```

This will take a few minutes to start the cluster.

### 3. Infrastructure Deployed
The namespace, ConfigMaps, Secrets, and PersistentVolumeClaims must be created.

**Check if infrastructure is deployed:**
```bash
kubectl get namespace feaf-dashboard
```

**If not deployed:**
```bash
cd k8s
./apply-infrastructure.sh
```

### 4. PostgreSQL Deployed
The PostgreSQL StatefulSet and Service must be created.

**Check if PostgreSQL is deployed:**
```bash
kubectl get statefulset feaf-postgres -n feaf-dashboard
```

**If not deployed:**
```bash
cd k8s
./apply-postgres.sh
```

## Running the Verification

Once all prerequisites are met, run the comprehensive verification script:

```bash
cd k8s
./verify-database-deployment.sh
```

This script will:
1. ✅ Check all prerequisites (Docker, minikube, kubectl)
2. ✅ Test database connectivity from within cluster
3. ✅ Verify persistent storage is working
4. ✅ Check pod logs for errors
5. ✅ Display a comprehensive summary

## Expected Output

If everything is working correctly, you should see:

```
==========================================
Database Deployment Verification
Task 5: Verify database deployment
Requirement: 10.3
==========================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: Checking Prerequisites
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.1 Checking Docker daemon...
✅ Docker daemon is running

1.2 Checking minikube installation...
✅ minikube is installed
   Version: v1.x.x

1.3 Checking kubectl installation...
✅ kubectl is installed
   Version: v1.x.x

1.4 Checking minikube cluster status...
✅ minikube cluster is running

✅ All prerequisites are met

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: Testing Database Connectivity from Within Cluster
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2.1 Checking namespace...
✅ Namespace 'feaf-dashboard' exists

2.2 Checking PostgreSQL pod status...
✅ PostgreSQL pod 'feaf-postgres-0' is running

2.3 Checking pod readiness...
✅ PostgreSQL pod is ready

2.4 Testing database connectivity with pg_isready...
✅ Database is accepting connections

2.5 Testing database query execution...
✅ Database query executed successfully

2.6 Retrieving PostgreSQL version...
✅ PostgreSQL version retrieved
   Version: PostgreSQL 15.x

2.7 Testing connectivity from another pod in the cluster...
✅ Database is accessible from other pods in the cluster

✅ Database connectivity verified

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: Verifying Persistent Storage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3.1 Checking PersistentVolumeClaim...
✅ PersistentVolumeClaim 'postgres-storage-feaf-postgres-0' exists

3.2 Checking PVC binding status...
✅ PVC is bound to a PersistentVolume

3.3 Retrieving PVC details...
✅ PVC details retrieved
   Storage size: 20Gi
   Storage class: standard
   Bound to PV: pvc-xxxxx

3.4 Checking data directory mount...
✅ Data directory is mounted

3.5 Checking disk usage...
✅ Disk usage information retrieved

3.6 Testing write operation to persistent storage...
✅ Write operation to persistent storage successful

✅ Persistent storage is working correctly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: Checking Pod Logs for Errors
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4.1 Retrieving recent pod logs...
✅ Pod logs retrieved

4.2 Checking for FATAL errors...
✅ No FATAL errors found

4.3 Checking for ERROR messages...
✅ No ERROR messages found

4.4 Checking for PANIC messages...
✅ No PANIC messages found

4.5 Checking for successful database startup...
✅ Database started successfully

4.6 Checking for initialization script execution...
✅ Initialization scripts executed

✅ No critical errors found in logs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

╔════════════════════════════════════════╗
║  ✅ DATABASE VERIFICATION PASSED      ║
╚════════════════════════════════════════╝

All verification checks passed successfully:
  ✅ Database connectivity from within cluster
  ✅ Persistent storage is working
  ✅ No critical errors in pod logs

Database connection details:
  Host: feaf-postgres.feaf-dashboard.svc.cluster.local
  Port: 5432
  Database: feaf
  User: feaf_user

To access PostgreSQL shell:
  kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf

Task 5 (Verify database deployment) is complete! ✅
```

## What If Something Fails?

The verification script will provide specific guidance if any check fails. Common issues:

### Docker Not Running
```
❌ Docker daemon is not running
   Action required: Start Docker Desktop
```

**Solution**: Open Docker Desktop and wait for it to start.

### Minikube Not Running
```
❌ minikube cluster is not running
   Action required: Start minikube with 'minikube start'
```

**Solution**: Run `minikube start` and wait for it to complete.

### Infrastructure Not Deployed
```
❌ Namespace 'feaf-dashboard' does not exist
   Action required: Deploy infrastructure first
```

**Solution**: Run `cd k8s && ./apply-infrastructure.sh`

### PostgreSQL Not Deployed
```
❌ PostgreSQL pod is not running
   Action required: Deploy PostgreSQL StatefulSet
```

**Solution**: Run `cd k8s && ./apply-postgres.sh`

## Manual Verification (Alternative)

If you prefer to verify manually, you can run individual checks:

### Check Pod Status
```bash
kubectl get pod feaf-postgres-0 -n feaf-dashboard
```

### Test Database Connection
```bash
kubectl exec feaf-postgres-0 -n feaf-dashboard -- pg_isready -U feaf_user -d feaf
```

### Run Test Query
```bash
kubectl exec feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "SELECT 1;"
```

### Check Persistent Storage
```bash
kubectl get pvc -n feaf-dashboard -l app=feaf-postgres
```

### View Logs
```bash
kubectl logs feaf-postgres-0 -n feaf-dashboard --tail=50
```

See [DATABASE-VERIFICATION.md](DATABASE-VERIFICATION.md) for detailed manual verification steps.

## Files Created for This Task

1. **verify-database-deployment.sh** - Automated verification script
   - Comprehensive checks for all verification requirements
   - Clear output with color-coded status messages
   - Detailed error reporting and troubleshooting guidance

2. **DATABASE-VERIFICATION.md** - Detailed verification guide
   - Step-by-step manual verification procedures
   - Troubleshooting guide for common issues
   - Success criteria and next steps

3. **TASK-5-INSTRUCTIONS.md** (this file) - Quick start guide
   - Prerequisites checklist
   - How to run the verification
   - What to expect

## Next Steps After Verification

Once the database verification passes:

1. **Mark Task 5 as Complete** ✅
   - All acceptance criteria for Requirement 10.3 are met

2. **Proceed to Task 6: Checkpoint**
   - Ensure all infrastructure components are ready
   - Ask user if any questions arise

3. **Begin Backend Development** (Task 7)
   - Initialize NestJS project
   - Configure Prisma ORM to connect to this database
   - Run database migrations

## Summary

This task ensures that the PostgreSQL database is:
- ✅ Deployed as a Kubernetes StatefulSet (Requirement 10.3)
- ✅ Using persistent volumes for data storage (Requirement 10.3)
- ✅ Accessible from within the cluster
- ✅ Ready to accept connections from the backend application
- ✅ Operating without critical errors

The verification script and documentation provide comprehensive coverage of all verification requirements, making it easy to confirm the database deployment is working correctly.

---

**Ready to verify?** Run: `cd k8s && ./verify-database-deployment.sh`
