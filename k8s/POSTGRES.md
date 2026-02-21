# PostgreSQL Database Deployment

This document describes the PostgreSQL database deployment for the FEAF Dashboard application.

## Overview

PostgreSQL is deployed as a StatefulSet with persistent storage to ensure data durability and reliability. The database stores all application data including users, boards, components, relationships, and cross-board links.

## Architecture

### Components

1. **StatefulSet** (`feaf-postgres`): Manages the PostgreSQL pod with stable network identity
2. **Service** (`feaf-postgres`): Headless ClusterIP service for stable DNS resolution
3. **PersistentVolumeClaim**: 20Gi storage for database data
4. **ConfigMap** (`postgres-init-scripts`): Database initialization and tuning scripts
5. **Secret** (`feaf-secrets`): Database credentials and connection strings

### Resource Allocation

- **CPU Request**: 500m (0.5 cores)
- **CPU Limit**: 1000m (1 core)
- **Memory Request**: 1Gi
- **Memory Limit**: 2Gi
- **Storage**: 20Gi persistent volume

## Deployment

### Prerequisites

Before deploying PostgreSQL, ensure the following are in place:

1. Namespace `feaf-dashboard` exists
2. Secret `feaf-secrets` is created with database credentials
3. PersistentVolumeClaim `postgres-pvc` is created

### Deploy PostgreSQL

Run the deployment script:

```bash
cd k8s
./apply-postgres.sh
```

This script will:
1. Verify prerequisites
2. Apply initialization scripts ConfigMap
3. Deploy PostgreSQL StatefulSet
4. Create PostgreSQL Service
5. Wait for pod to be ready
6. Display deployment status

### Manual Deployment

If you prefer to deploy manually:

```bash
kubectl apply -f 08-postgres-init-configmap.yaml
kubectl apply -f 08-postgres-statefulset.yaml
kubectl apply -f 09-postgres-service.yaml
```

## Verification

### Automated Verification

Run the verification script:

```bash
cd k8s
./verify-postgres.sh
```

This script checks:
- Namespace existence
- StatefulSet status
- Pod status and readiness
- Service configuration
- PVC binding
- Database connectivity
- Query execution
- Resource usage
- Log errors

### Manual Verification

Check pod status:
```bash
kubectl get pods -n feaf-dashboard -l app=feaf-postgres
```

Check StatefulSet status:
```bash
kubectl get statefulset feaf-postgres -n feaf-dashboard
```

Check service:
```bash
kubectl get service feaf-postgres -n feaf-dashboard
```

Check PVC:
```bash
kubectl get pvc -n feaf-dashboard -l app=feaf-postgres
```

View logs:
```bash
kubectl logs -n feaf-dashboard feaf-postgres-0
```

## Database Access

### Connection Details

- **Host**: `feaf-postgres.feaf-dashboard.svc.cluster.local` (or `feaf-postgres` within namespace)
- **Port**: `5432`
- **Database**: `feaf`
- **User**: `feaf_user`
- **Password**: Stored in `feaf-secrets` secret

### Connection String

The full connection string is stored in the `feaf-secrets` secret:

```
postgresql://feaf_user:PASSWORD@feaf-postgres:5432/feaf
```

### Access PostgreSQL Shell

From within the cluster:

```bash
kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf
```

### Test Connectivity

Check if database is ready:

```bash
kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- pg_isready -U feaf_user -d feaf
```

Run a test query:

```bash
kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "SELECT version();"
```

## Database Initialization

### Initialization Scripts

The database is initialized with scripts from the `postgres-init-scripts` ConfigMap:

1. **01-init-database.sql**: Creates extensions and sets timezone
2. **02-performance-tuning.sql**: Applies performance optimizations

These scripts run automatically when the database is first created.

### Schema Management

The database schema is managed by Prisma ORM in the backend application. The backend will:

1. Run Prisma migrations on startup
2. Create tables, indexes, and constraints
3. Seed initial data if needed

## Performance Tuning

The following PostgreSQL settings are configured for optimal performance:

- **shared_buffers**: 256MB (25% of available memory)
- **effective_cache_size**: 512MB (50% of available memory)
- **work_mem**: 16MB (for sorting and hashing)
- **maintenance_work_mem**: 128MB (for VACUUM and CREATE INDEX)
- **random_page_cost**: 1.1 (optimized for SSD)
- **checkpoint_completion_target**: 0.9
- **wal_buffers**: 16MB
- **autovacuum**: Enabled with 3 workers
- **log_min_duration_statement**: 1000ms (log slow queries)

## Health Checks

### Liveness Probe

Checks if PostgreSQL is running:

```bash
pg_isready -U feaf_user -d feaf
```

- **Initial Delay**: 30 seconds
- **Period**: 10 seconds
- **Timeout**: 5 seconds
- **Failure Threshold**: 3

### Readiness Probe

Checks if PostgreSQL is ready to accept connections:

```bash
pg_isready -U feaf_user -d feaf
```

- **Initial Delay**: 10 seconds
- **Period**: 5 seconds
- **Timeout**: 3 seconds
- **Failure Threshold**: 3

## Backup and Recovery

### Manual Backup

Create a backup of the database:

```bash
kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- pg_dump -U feaf_user feaf > backup.sql
```

### Restore from Backup

Restore a database backup:

```bash
cat backup.sql | kubectl exec -i feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf
```

### Persistent Volume Backup

The database data is stored in a PersistentVolume. Ensure your cluster has a backup solution for PersistentVolumes (e.g., Velero, cloud provider snapshots).

## Monitoring

### Logs

View PostgreSQL logs:

```bash
kubectl logs -n feaf-dashboard feaf-postgres-0
```

Follow logs in real-time:

```bash
kubectl logs -n feaf-dashboard feaf-postgres-0 -f
```

### Resource Usage

Check CPU and memory usage:

```bash
kubectl top pod feaf-postgres-0 -n feaf-dashboard
```

### Database Metrics

PostgreSQL logs slow queries (>1 second) and connection events. These can be monitored through the logs.

The backend application exposes database metrics to Prometheus:
- Query duration
- Active connections
- Connection pool usage

## Troubleshooting

### Pod Not Starting

Check pod events:
```bash
kubectl describe pod feaf-postgres-0 -n feaf-dashboard
```

Check logs:
```bash
kubectl logs -n feaf-dashboard feaf-postgres-0
```

### PVC Not Binding

Check PVC status:
```bash
kubectl describe pvc -n feaf-dashboard -l app=feaf-postgres
```

Ensure your cluster has a StorageClass configured:
```bash
kubectl get storageclass
```

### Connection Refused

Check if pod is ready:
```bash
kubectl get pod feaf-postgres-0 -n feaf-dashboard
```

Check service endpoints:
```bash
kubectl get endpoints feaf-postgres -n feaf-dashboard
```

Test connectivity from another pod:
```bash
kubectl run -it --rm debug --image=postgres:15 --restart=Never -n feaf-dashboard -- psql -h feaf-postgres -U feaf_user -d feaf
```

### Out of Memory

Check resource usage:
```bash
kubectl top pod feaf-postgres-0 -n feaf-dashboard
```

Increase memory limits in `08-postgres-statefulset.yaml` if needed.

### Disk Space Issues

Check PVC usage:
```bash
kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- df -h /var/lib/postgresql/data
```

Increase storage size in `08-postgres-statefulset.yaml` if needed (requires PVC expansion support).

## Scaling Considerations

### Current Configuration

The current deployment uses a single replica (1 pod) for simplicity. This is suitable for development and small production workloads.

### Future Scaling Options

For high availability and scalability, consider:

1. **PostgreSQL Replication**: Set up primary-replica replication
2. **Connection Pooling**: Use PgBouncer for connection pooling
3. **Read Replicas**: Add read-only replicas for read-heavy workloads
4. **Managed Database**: Use a managed PostgreSQL service (e.g., AWS RDS, Google Cloud SQL)

## Security

### Credentials

- Database credentials are stored in Kubernetes Secrets
- Passwords should be rotated regularly
- Use strong, randomly generated passwords

### Network Security

- PostgreSQL is only accessible within the cluster (ClusterIP service)
- No external access is exposed
- Backend pods connect using internal DNS

### Encryption

- Consider enabling SSL/TLS for database connections in production
- Enable encryption at rest for PersistentVolumes (depends on storage provider)

## Maintenance

### Vacuum and Analyze

PostgreSQL auto-vacuum is enabled. For manual maintenance:

```bash
kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "VACUUM ANALYZE;"
```

### Reindex

Rebuild indexes if needed:

```bash
kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U feaf_user -d feaf -c "REINDEX DATABASE feaf;"
```

### Update PostgreSQL Version

To update PostgreSQL version:

1. Backup the database
2. Update the image version in `08-postgres-statefulset.yaml`
3. Apply the changes: `kubectl apply -f 08-postgres-statefulset.yaml`
4. Kubernetes will perform a rolling update

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

## Related Documentation

- [INFRASTRUCTURE.md](INFRASTRUCTURE.md) - Overall infrastructure setup
- [STORAGE.md](STORAGE.md) - Persistent storage configuration
- [SECRET-MANAGEMENT.md](SECRET-MANAGEMENT.md) - Secret management guide
- [README.md](README.md) - Main deployment guide
