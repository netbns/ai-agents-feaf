# Database Deployment Verification Guide

This document provides comprehensive guidance for verifying the PostgreSQL database deployment for the FEAF Dashboard application (Task 5, Requirement 10.3).

## Overview

The database verification process ensures that:
1. Database connectivity works from within the Kubernetes cluster
2. Persistent storage is properly configured and working
3. Pod logs show no critical errors
4. The database is ready to accept connections from the backend application

## Quick Start

Run the automated verification script:

```bash
cd k8s
./verify-database-deployment.sh
```

This script performs all verification steps automatically and provides a detailed report.

## Prerequisites

Before running the verification, ensure:

1. **Docker Desktop is running**
   - Check: `docker ps`
   - Start: Open Docker Desktop application

2. **Minikube cluster is running**
   - Check: `minikube status`
   - Start: `minikube start`

3. **Infrastructure is deployed**
   - Namespace, ConfigMaps, Secrets, and PVCs must exist
   - Deploy: `./apply-infrastructure.sh`

4. **PostgreSQL is deployed**
   - StatefulSet and Service must be created
   - Deploy: `./apply-postgres.sh`

## Verification Steps

### Step 1: Test Database Connectivity from Within Cluster

The database must be accessible from other pods in the cluster.

#### 1.1 Check Pod Status

```bash
kubectl get pod feaf-postgres-0 -n feaf-dashboard
```

Expected output:
```
NAME               READY   STATUS    RESTARTS   AGE
feaf-postgres-0    1/1     Running   0          5m
```

#### 1.2 Test pg_isready

```bash
kubectl exec feaf-postgres-0 -n feaf-dashboard -- pg_isready -U feaf_user -d feaf
```

Expected output:
```
/tmp:5432 - accepting connections
```

#### 1.3 Execute Test Query

```bash
kubectl exec feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "SELECT 1;"
```

Expected output:
```
 ?column? 
----------
        1
(1 row)
```

#### 1.4 Get PostgreSQL Version

```bash
kubectl exec feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "SELECT version();"
```

Expected output should show PostgreSQL 15.x.

#### 1.5 Test from Another Pod

Create a temporary pod to test connectivity:

```bash
kubectl run test-db-connection \
  --image=postgres:15 \
  --rm -i --restart=Never \
  -n feaf-dashboard \
  --env="PGPASSWORD=your_password" \
  -- psql -h feaf-postgres -U feaf_user -d feaf -c "SELECT 1;"
```

This verifies that the database is accessible via the Service DNS name.

### Step 2: Verify Persistent Storage

The database must use persistent storage to ensure data durability.

#### 2.1 Check PVC Status

```bash
kubectl get pvc -n feaf-dashboard -l app=feaf-postgres
```

Expected output:
```
NAME                            STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
postgres-storage-feaf-postgres-0   Bound    pvc-xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   20Gi       RWO            standard       5m
```

Status must be "Bound".

#### 2.2 Check PV Details

```bash
kubectl get pv $(kubectl get pvc -n feaf-dashboard -l app=feaf-postgres -o jsonpath='{.items[0].spec.volumeName}')
```

Verify the PersistentVolume exists and is bound.

#### 2.3 Check Data Directory

```bash
kubectl exec feaf-postgres-0 -n feaf-dashboard -- ls -la /var/lib/postgresql/data/pgdata
```

Should show PostgreSQL data files (base, global, pg_wal, etc.).

#### 2.4 Check Disk Usage

```bash
kubectl exec feaf-postgres-0 -n feaf-dashboard -- df -h /var/lib/postgresql/data
```

Verify sufficient disk space is available.

#### 2.5 Test Write Operation

```bash
kubectl exec feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "
CREATE TABLE storage_test (id SERIAL PRIMARY KEY, test_data TEXT);
INSERT INTO storage_test (test_data) VALUES ('test');
SELECT * FROM storage_test;
DROP TABLE storage_test;
"
```

This verifies that data can be written to and read from persistent storage.

#### 2.6 Verify Data Persistence Across Pod Restart

1. Create a test table:
```bash
kubectl exec feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "
CREATE TABLE persistence_test (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW());
INSERT INTO persistence_test DEFAULT VALUES;
"
```

2. Delete the pod (StatefulSet will recreate it):
```bash
kubectl delete pod feaf-postgres-0 -n feaf-dashboard
```

3. Wait for pod to be ready:
```bash
kubectl wait --for=condition=ready pod/feaf-postgres-0 -n feaf-dashboard --timeout=120s
```

4. Verify data still exists:
```bash
kubectl exec feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "
SELECT * FROM persistence_test;
DROP TABLE persistence_test;
"
```

If the data is still there, persistent storage is working correctly.

### Step 3: Check Pod Logs for Errors

Review logs to ensure no critical errors occurred during startup or operation.

#### 3.1 View Recent Logs

```bash
kubectl logs feaf-postgres-0 -n feaf-dashboard --tail=100
```

#### 3.2 Check for FATAL Errors

```bash
kubectl logs feaf-postgres-0 -n feaf-dashboard | grep -i "FATAL"
```

Should return no results or only expected initialization messages.

#### 3.3 Check for ERROR Messages

```bash
kubectl logs feaf-postgres-0 -n feaf-dashboard | grep -i "ERROR"
```

Some errors during initialization are normal (e.g., "database already exists"). Look for unexpected errors.

#### 3.4 Check for PANIC Messages

```bash
kubectl logs feaf-postgres-0 -n feaf-dashboard | grep -i "PANIC"
```

Should return no results. PANIC indicates a critical failure.

#### 3.5 Verify Successful Startup

```bash
kubectl logs feaf-postgres-0 -n feaf-dashboard | grep "database system is ready to accept connections"
```

Should show at least one occurrence, indicating successful startup.

#### 3.6 Check Initialization Scripts

```bash
kubectl logs feaf-postgres-0 -n feaf-dashboard | grep "PostgreSQL init process complete"
```

Indicates that initialization scripts from the ConfigMap were executed.

### Step 4: Additional Verification

#### 4.1 Check Resource Usage

```bash
kubectl top pod feaf-postgres-0 -n feaf-dashboard
```

Verify CPU and memory usage are within expected limits.

#### 4.2 Check Health Probes

```bash
kubectl describe pod feaf-postgres-0 -n feaf-dashboard | grep -A 10 "Liveness\|Readiness"
```

Verify both liveness and readiness probes are passing.

#### 4.3 Check Service Endpoints

```bash
kubectl get endpoints feaf-postgres -n feaf-dashboard
```

Should show the pod IP address, indicating the Service is routing to the pod.

#### 4.4 Check StatefulSet Status

```bash
kubectl get statefulset feaf-postgres -n feaf-dashboard
```

Expected output:
```
NAME            READY   AGE
feaf-postgres   1/1     5m
```

READY should be 1/1.

## Troubleshooting

### Pod Not Starting

**Symptoms**: Pod status is Pending, CrashLoopBackOff, or Error

**Diagnosis**:
```bash
kubectl describe pod feaf-postgres-0 -n feaf-dashboard
kubectl logs feaf-postgres-0 -n feaf-dashboard
```

**Common causes**:
- PVC not bound (check storage class availability)
- Insufficient resources (check node capacity)
- Secret not found (verify feaf-secrets exists)
- Image pull failure (check network connectivity)

### PVC Not Binding

**Symptoms**: PVC status is Pending

**Diagnosis**:
```bash
kubectl describe pvc -n feaf-dashboard -l app=feaf-postgres
kubectl get storageclass
```

**Common causes**:
- No StorageClass available (install storage provisioner)
- Insufficient storage capacity
- Access mode not supported

**Solution**:
```bash
# For minikube, ensure storage provisioner is enabled
minikube addons enable storage-provisioner
minikube addons enable default-storageclass
```

### Connection Refused

**Symptoms**: Cannot connect to database from within cluster

**Diagnosis**:
```bash
kubectl get pod feaf-postgres-0 -n feaf-dashboard
kubectl get service feaf-postgres -n feaf-dashboard
kubectl get endpoints feaf-postgres -n feaf-dashboard
```

**Common causes**:
- Pod not ready (check readiness probe)
- Service not routing to pod (check selectors)
- Network policy blocking traffic
- Wrong credentials (check Secret)

### Database Not Ready

**Symptoms**: Readiness probe failing

**Diagnosis**:
```bash
kubectl logs feaf-postgres-0 -n feaf-dashboard
kubectl exec feaf-postgres-0 -n feaf-dashboard -- pg_isready -U feaf_user -d feaf
```

**Common causes**:
- Database still initializing (wait longer)
- Initialization script error (check logs)
- Disk full (check disk usage)
- Configuration error (check environment variables)

### Data Not Persisting

**Symptoms**: Data lost after pod restart

**Diagnosis**:
```bash
kubectl get pvc -n feaf-dashboard -l app=feaf-postgres
kubectl describe pod feaf-postgres-0 -n feaf-dashboard | grep -A 5 "Mounts"
```

**Common causes**:
- PVC not mounted (check volumeMounts in pod spec)
- Wrong mount path (should be /var/lib/postgresql/data)
- PGDATA not set correctly (should be /var/lib/postgresql/data/pgdata)
- PVC deleted and recreated (data lost)

### Slow Performance

**Symptoms**: Queries taking longer than expected

**Diagnosis**:
```bash
kubectl top pod feaf-postgres-0 -n feaf-dashboard
kubectl logs feaf-postgres-0 -n feaf-dashboard | grep "duration"
```

**Common causes**:
- Insufficient resources (increase CPU/memory limits)
- Disk I/O bottleneck (use faster storage class)
- Missing indexes (check query plans)
- Need to tune PostgreSQL settings (adjust shared_buffers, work_mem)

## Success Criteria

The database deployment is verified when:

✅ **Connectivity**: Database accepts connections from within cluster
- `pg_isready` returns success
- Test queries execute successfully
- Other pods can connect via Service DNS

✅ **Persistent Storage**: Data persists across pod restarts
- PVC is bound to a PV
- Data directory is mounted correctly
- Write operations succeed
- Data survives pod deletion

✅ **No Critical Errors**: Logs show healthy operation
- No FATAL errors
- No PANIC messages
- Successful startup message present
- Initialization scripts executed

✅ **Resource Health**: Pod is healthy and within limits
- Pod status is Running
- Readiness probe passing
- Liveness probe passing
- Resource usage within limits

## Next Steps

After successful verification:

1. **Proceed to Backend Development** (Task 7)
   - Backend will connect to this database
   - Connection string: `postgresql://feaf_user:PASSWORD@feaf-postgres:5432/feaf`

2. **Run Prisma Migrations**
   - Backend will create database schema
   - Tables, indexes, and constraints will be created

3. **Monitor Database**
   - Backend will expose database metrics to Prometheus
   - Set up alerts for connection failures, slow queries

## Related Documentation

- [POSTGRES.md](POSTGRES.md) - PostgreSQL deployment details
- [STORAGE.md](STORAGE.md) - Persistent storage configuration
- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) - Overall infrastructure setup
- [verify-postgres.sh](verify-postgres.sh) - Original verification script
- [verify-database-deployment.sh](verify-database-deployment.sh) - Comprehensive verification script

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Kubernetes Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [pg_isready Documentation](https://www.postgresql.org/docs/current/app-pg-isready.html)

---

**Task**: 5. Verify database deployment  
**Requirement**: 10.3 - THE Database SHALL be deployed as a Kubernetes StatefulSet with persistent volumes  
**Status**: Verification procedures documented and automated
