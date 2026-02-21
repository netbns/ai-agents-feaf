# Persistent Storage Configuration

This document describes the persistent storage setup for the FEAF Dashboard application.

## Overview

The FEAF Dashboard uses Kubernetes PersistentVolumeClaims (PVCs) to provide durable storage for:
- **PostgreSQL Database**: Stores all application data (users, boards, components, relationships)
- **Prometheus**: Stores monitoring metrics and time-series data

## Storage Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                    │
│                                                          │
│  ┌──────────────┐         ┌─────────────────────────┐  │
│  │  PostgreSQL  │────────▶│  postgres-pvc (20Gi)    │  │
│  │  StatefulSet │         │  ReadWriteOnce          │  │
│  └──────────────┘         └─────────────────────────┘  │
│                                      │                   │
│                                      ▼                   │
│                           ┌─────────────────────────┐   │
│                           │  PersistentVolume (PV)  │   │
│                           │  Dynamically Provisioned│   │
│                           └─────────────────────────┘   │
│                                                          │
│  ┌──────────────┐         ┌─────────────────────────┐  │
│  │  Prometheus  │────────▶│  prometheus-pvc (10Gi)  │  │
│  │  Deployment  │         │  ReadWriteOnce          │  │
│  └──────────────┘         └─────────────────────────┘  │
│                                      │                   │
│                                      ▼                   │
│                           ┌─────────────────────────┐   │
│                           │  PersistentVolume (PV)  │   │
│                           │  Dynamically Provisioned│   │
│                           └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## PersistentVolumeClaims

### PostgreSQL PVC

**File**: `06-postgres-pvc.yaml`

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: feaf-dashboard
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

**Configuration**:
- **Name**: `postgres-pvc`
- **Storage**: 20Gi (sufficient for production workloads)
- **Access Mode**: ReadWriteOnce (single node read-write access)
- **Storage Class**: Uses cluster default (can be customized)

**Usage**: Mounted by PostgreSQL StatefulSet at `/var/lib/postgresql/data`

### Prometheus PVC

**File**: `07-prometheus-pvc.yaml`

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-pvc
  namespace: feaf-dashboard
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

**Configuration**:
- **Name**: `prometheus-pvc`
- **Storage**: 10Gi (sufficient for metrics retention)
- **Access Mode**: ReadWriteOnce (single node read-write access)
- **Storage Class**: Uses cluster default (can be customized)

**Usage**: Mounted by Prometheus Deployment at `/prometheus`

## Access Modes

The PVCs use **ReadWriteOnce** (RWO) access mode:
- Volume can be mounted as read-write by a single node
- Suitable for StatefulSets and single-replica Deployments
- Most cloud providers support RWO with dynamic provisioning

Other access modes (not used in this setup):
- **ReadOnlyMany** (ROX): Multiple nodes can mount as read-only
- **ReadWriteMany** (RWX): Multiple nodes can mount as read-write

## Storage Classes

By default, the PVCs use the cluster's default StorageClass. To use a specific StorageClass, uncomment and modify the `storageClassName` field in the PVC manifests:

```yaml
spec:
  storageClassName: fast-ssd  # Example: use a specific storage class
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

### Common Storage Classes by Provider

**AWS EKS**:
- `gp2`: General Purpose SSD (default)
- `gp3`: General Purpose SSD (newer, more cost-effective)
- `io1`: Provisioned IOPS SSD (high performance)

**Google GKE**:
- `standard`: Standard persistent disk (HDD)
- `standard-rwo`: Standard persistent disk with RWO
- `premium-rwo`: SSD persistent disk with RWO

**Azure AKS**:
- `default`: Azure Disk (Standard HDD)
- `managed-premium`: Premium SSD
- `azurefile`: Azure Files (supports RWX)

**Local/Minikube**:
- `standard`: hostPath provisioner (for development only)

To list available storage classes in your cluster:
```bash
kubectl get storageclass
```

## Dynamic Provisioning

The PVCs use **dynamic provisioning**:
1. PVC is created with storage request
2. Kubernetes automatically provisions a PersistentVolume (PV)
3. PV is bound to the PVC
4. Pod mounts the PVC and can use the storage

**Note**: PVCs may remain in `Pending` state until a pod claims them. This is normal behavior.

## Deployment Instructions

### 1. Apply Storage Manifests

```bash
cd k8s
./apply-storage.sh
```

This script will:
- Verify kubectl is configured
- Check that the namespace exists
- Create PostgreSQL PVC
- Create Prometheus PVC
- Display PVC status

### 2. Verify Storage Setup

```bash
./verify-storage.sh
```

This script checks:
- PVCs are created
- PVC status (Pending/Bound)
- PVs are provisioned
- Storage class configuration

### 3. Manual Verification

Check PVC status:
```bash
kubectl get pvc -n feaf-dashboard
```

Expected output:
```
NAME             STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
postgres-pvc     Pending   -                                          -          -              standard       10s
prometheus-pvc   Pending   -                                          -          -              standard       10s
```

**Note**: Status will change to `Bound` when pods claim the PVCs.

Check PV status (after pods are deployed):
```bash
kubectl get pv
```

Describe a PVC for details:
```bash
kubectl describe pvc postgres-pvc -n feaf-dashboard
```

## Storage Lifecycle

### PVC States

1. **Pending**: PVC is created but not yet bound to a PV
   - Normal state before pod deployment
   - Dynamic provisioning will create PV when pod claims PVC

2. **Bound**: PVC is bound to a PV and ready for use
   - Pod can mount and use the storage
   - Data persists across pod restarts

3. **Lost**: PV is unavailable (rare, indicates storage failure)

### Data Persistence

- **Pod Restart**: Data persists (PVC remains bound)
- **Pod Deletion**: Data persists (PVC remains bound)
- **PVC Deletion**: Data is deleted (PV is released/deleted)
- **Node Failure**: Data persists (pod reschedules, PVC rebinds)

### Backup Recommendations

**PostgreSQL**:
- Use `pg_dump` for logical backups
- Schedule regular backups to external storage (S3, GCS, Azure Blob)
- Consider using Velero for cluster-level backups

**Prometheus**:
- Configure remote write to long-term storage (Thanos, Cortex)
- Prometheus data is time-series and can be regenerated
- Less critical than database backups

## Troubleshooting

### PVC Stuck in Pending

**Symptoms**: PVC remains in `Pending` state

**Possible Causes**:
1. No default StorageClass configured
2. StorageClass doesn't exist
3. Insufficient storage quota
4. No available storage in cluster

**Solutions**:
```bash
# Check default storage class
kubectl get storageclass

# Check PVC events
kubectl describe pvc postgres-pvc -n feaf-dashboard

# Check resource quotas
kubectl describe resourcequota -n feaf-dashboard
```

### PVC Bound but Pod Can't Mount

**Symptoms**: Pod fails to start with mount errors

**Possible Causes**:
1. PV is bound to different node than pod
2. Access mode mismatch
3. Volume plugin not available

**Solutions**:
```bash
# Check pod events
kubectl describe pod <pod-name> -n feaf-dashboard

# Check PV details
kubectl describe pv <pv-name>

# Verify volume plugin is available
kubectl get csidriver  # For CSI drivers
```

### Storage Full

**Symptoms**: Database or Prometheus errors about disk space

**Solutions**:
```bash
# Check PVC usage (requires metrics-server)
kubectl top pod -n feaf-dashboard

# Resize PVC (if storage class supports it)
kubectl patch pvc postgres-pvc -n feaf-dashboard -p '{"spec":{"resources":{"requests":{"storage":"30Gi"}}}}'

# Note: Not all storage classes support volume expansion
```

### Data Loss Prevention

**Best Practices**:
1. **Regular Backups**: Schedule automated backups
2. **Retention Policy**: Define PV reclaim policy
3. **Monitoring**: Alert on storage usage thresholds
4. **Testing**: Regularly test backup restoration
5. **Documentation**: Document backup/restore procedures

## Storage Sizing Guidelines

### PostgreSQL

**Development**: 5-10Gi
- Small dataset
- Testing and development

**Production**: 20-50Gi
- Depends on:
  - Number of users
  - Number of boards and components
  - Data retention period
  - Growth rate

**Formula**: `Storage = (Avg Board Size × Num Boards × Growth Factor) + Overhead`

### Prometheus

**Development**: 5Gi
- Short retention (7 days)
- Low scrape frequency

**Production**: 10-20Gi
- Depends on:
  - Number of metrics
  - Scrape interval
  - Retention period (default: 15 days)
  - Number of targets

**Formula**: `Storage = (Samples/sec × Retention Seconds × Bytes/Sample)`

## Reclaim Policy

The default reclaim policy for dynamically provisioned PVs is usually **Delete**:
- When PVC is deleted, PV is automatically deleted
- Data is permanently lost

To preserve data, change reclaim policy to **Retain**:
```bash
kubectl patch pv <pv-name> -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'
```

With **Retain** policy:
- PV is not deleted when PVC is deleted
- Data is preserved
- Manual cleanup required

## Security Considerations

1. **Encryption at Rest**: Enable encryption in StorageClass
2. **Access Control**: Use RBAC to restrict PVC access
3. **Network Policies**: Limit pod-to-storage communication
4. **Backup Encryption**: Encrypt backups before storing externally
5. **Secrets Management**: Store backup credentials in Kubernetes Secrets

## Next Steps

After setting up persistent storage:

1. **Deploy PostgreSQL**: StatefulSet will claim `postgres-pvc`
2. **Deploy Prometheus**: Deployment will claim `prometheus-pvc`
3. **Verify Binding**: Check that PVCs transition to `Bound` state
4. **Test Persistence**: Restart pods and verify data persists
5. **Configure Backups**: Set up automated backup jobs

## References

- [Kubernetes Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [Dynamic Volume Provisioning](https://kubernetes.io/docs/concepts/storage/dynamic-provisioning/)
- [Volume Snapshots](https://kubernetes.io/docs/concepts/storage/volume-snapshots/)

