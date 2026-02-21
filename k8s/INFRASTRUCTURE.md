# FEAF Dashboard - Kubernetes Infrastructure

## Overview

This document describes the Kubernetes infrastructure setup for the FEAF Dashboard application, including namespace isolation, RBAC security, and resource management.

## Architecture Components

### 1. Namespace Isolation

**File**: `00-namespace.yaml`

The `feaf-dashboard` namespace provides:
- **Resource Isolation**: Separates FEAF Dashboard resources from other applications
- **Access Control**: Enables namespace-scoped RBAC policies
- **Resource Quotas**: Allows setting limits on resource consumption
- **Logical Grouping**: All related resources in one namespace

**Labels**:
- `app: feaf-dashboard` - Identifies all resources belonging to this application
- `environment: production` - Indicates the deployment environment

### 2. Service Accounts

**File**: `01-service-accounts.yaml`

Service accounts provide identity for pods and enable fine-grained access control:

#### feaf-frontend-sa
- **Purpose**: Identity for frontend pods
- **Permissions**: Default (no special permissions required)
- **Usage**: Serves static React application

#### feaf-backend-sa
- **Purpose**: Identity for backend API pods
- **Permissions**: Read ConfigMaps and Secrets
- **Usage**: Accesses configuration and database credentials

#### feaf-postgres-sa
- **Purpose**: Identity for PostgreSQL database pods
- **Permissions**: Default (no special permissions required)
- **Usage**: Runs database workload

#### prometheus-sa
- **Purpose**: Identity for Prometheus monitoring pods
- **Permissions**: Read pods, services, endpoints for service discovery
- **Usage**: Scrapes metrics from application pods

### 3. RBAC (Role-Based Access Control)

**File**: `02-rbac-roles.yaml`

RBAC implements the principle of least privilege, granting only necessary permissions.

#### Backend Role

**Permissions**:
```yaml
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
```

**Rationale**:
- Backend needs to read database connection strings from Secrets
- Backend needs to read API configuration from ConfigMaps
- No write permissions to prevent accidental modifications
- No delete permissions for security

#### Prometheus Role

**Permissions**:
```yaml
- apiGroups: [""]
  resources: ["pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get"]
```

**Rationale**:
- Prometheus needs to discover pods for metric scraping
- Watch permission enables real-time updates when pods are added/removed
- Read-only access prevents accidental modifications
- ConfigMap access for Prometheus configuration

#### Role Bindings

Role bindings connect service accounts to roles:
- `feaf-backend-rolebinding`: Binds `feaf-backend-sa` to `feaf-backend-role`
- `prometheus-rolebinding`: Binds `prometheus-sa` to `prometheus-role`

### 4. Resource Quotas and Limits

**File**: `03-resource-quotas.yaml`

Resource management prevents resource exhaustion and ensures fair allocation.

#### ResourceQuota

**Purpose**: Limits total resource consumption in the namespace

**Limits**:
```yaml
requests.cpu: "8"           # Total CPU requests across all pods
requests.memory: "16Gi"     # Total memory requests across all pods
limits.cpu: "16"            # Total CPU limits across all pods
limits.memory: "32Gi"       # Total memory limits across all pods
pods: "20"                  # Maximum number of pods
services: "10"              # Maximum number of services
persistentvolumeclaims: "5" # Maximum number of PVCs
requests.storage: "100Gi"   # Total storage requests
```

**Rationale**:
- Prevents runaway resource consumption
- Ensures cluster resources are shared fairly
- Protects against accidental over-provisioning
- Allows for headroom beyond application requirements

#### LimitRange

**Purpose**: Sets default resource limits for containers

**Container Defaults**:
```yaml
default:
  cpu: "1000m"      # Default CPU limit (1 core)
  memory: "1Gi"     # Default memory limit
defaultRequest:
  cpu: "250m"       # Default CPU request
  memory: "256Mi"   # Default memory request
max:
  cpu: "2000m"      # Maximum CPU per container
  memory: "4Gi"     # Maximum memory per container
min:
  cpu: "100m"       # Minimum CPU per container
  memory: "128Mi"   # Minimum memory per container
```

**PVC Limits**:
```yaml
max:
  storage: "50Gi"   # Maximum storage per PVC
min:
  storage: "1Gi"    # Minimum storage per PVC
```

**Rationale**:
- Ensures all containers have resource limits (prevents unbounded growth)
- Provides sensible defaults for developers
- Prevents accidentally requesting excessive resources
- Enables Kubernetes to make better scheduling decisions

## Resource Planning

### Expected Resource Usage

| Component | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit | Storage |
|-----------|----------|-------------|-----------|----------------|--------------|---------|
| Frontend  | 2        | 250m        | 500m      | 256Mi          | 512Mi        | -       |
| Backend   | 2        | 500m        | 1000m     | 512Mi          | 1Gi          | -       |
| PostgreSQL| 1        | 500m        | 1000m     | 1Gi            | 2Gi          | 20Gi    |
| Prometheus| 1        | 250m        | 500m      | 512Mi          | 1Gi          | 10Gi    |
| **Total** | **6**    | **3.5**     | **7**     | **5.5Gi**      | **10.5Gi**   | **30Gi**|

### Quota Headroom

The quota allows for:
- **CPU**: 8 cores requested (3.5 used = 56% headroom)
- **Memory**: 16Gi requested (5.5Gi used = 66% headroom)
- **Pods**: 20 maximum (6 used = 70% headroom)
- **Storage**: 100Gi (30Gi used = 70% headroom)

This headroom accommodates:
- Temporary pod replicas during rolling updates
- Burst resource usage during high load
- Additional monitoring or debugging pods
- Future application expansion

## Security Considerations

### Principle of Least Privilege

Each service account has only the minimum permissions required:

1. **Frontend**: No special permissions (serves static files)
2. **Backend**: Read-only access to configuration
3. **PostgreSQL**: No cluster API access (isolated database)
4. **Prometheus**: Read-only access for monitoring

### Network Isolation

While not implemented in this phase, the namespace enables future network policies:
- Restrict frontend to only communicate with backend
- Restrict backend to only communicate with database
- Allow Prometheus to scrape all pods
- Deny all other traffic by default

### Secret Management

Secrets are:
- Stored in Kubernetes Secrets (base64 encoded)
- Mounted as environment variables or files
- Never logged or exposed in pod specs
- Accessible only to authorized service accounts

## Deployment Instructions

### Prerequisites

1. Kubernetes cluster (v1.24+)
2. kubectl configured with cluster admin access
3. Sufficient cluster resources (see resource planning above)

### Quick Start

```bash
# Apply all infrastructure manifests
./apply-infrastructure.sh

# Verify setup
./verify-infrastructure.sh
```

### Manual Deployment

```bash
# 1. Create namespace
kubectl apply -f 00-namespace.yaml

# 2. Create service accounts
kubectl apply -f 01-service-accounts.yaml

# 3. Set up RBAC
kubectl apply -f 02-rbac-roles.yaml

# 4. Configure resource quotas
kubectl apply -f 03-resource-quotas.yaml
```

### Verification

```bash
# Check all resources
kubectl get all -n feaf-dashboard

# Check service accounts
kubectl get sa -n feaf-dashboard

# Check RBAC
kubectl get roles,rolebindings -n feaf-dashboard

# Check quotas
kubectl describe quota feaf-dashboard-quota -n feaf-dashboard
kubectl describe limitrange feaf-dashboard-limits -n feaf-dashboard
```

## Troubleshooting

### Quota Exceeded Errors

**Symptom**: Pods fail to schedule with "exceeded quota" error

**Solution**:
```bash
# Check current quota usage
kubectl describe quota feaf-dashboard-quota -n feaf-dashboard

# Identify which resource is exhausted
# Option 1: Increase quota (edit 03-resource-quotas.yaml)
# Option 2: Reduce resource requests in pod specs
# Option 3: Delete unused resources
```

### RBAC Permission Denied

**Symptom**: Pods cannot access ConfigMaps or Secrets

**Solution**:
```bash
# Verify service account is set in pod spec
kubectl get pod <pod-name> -n feaf-dashboard -o yaml | grep serviceAccountName

# Verify role binding
kubectl get rolebinding -n feaf-dashboard
kubectl describe rolebinding feaf-backend-rolebinding -n feaf-dashboard

# Check role permissions
kubectl describe role feaf-backend-role -n feaf-dashboard
```

### Service Account Not Found

**Symptom**: Pods fail to start with "service account not found"

**Solution**:
```bash
# Verify service accounts exist
kubectl get sa -n feaf-dashboard

# If missing, reapply
kubectl apply -f 01-service-accounts.yaml
```

## Maintenance

### Updating Resource Quotas

1. Edit `03-resource-quotas.yaml`
2. Apply changes: `kubectl apply -f 03-resource-quotas.yaml`
3. Verify: `kubectl describe quota feaf-dashboard-quota -n feaf-dashboard`

### Adding New Service Accounts

1. Add to `01-service-accounts.yaml`
2. Create corresponding role in `02-rbac-roles.yaml`
3. Create role binding in `02-rbac-roles.yaml`
4. Apply changes

### Monitoring Resource Usage

```bash
# Check quota usage
kubectl describe quota feaf-dashboard-quota -n feaf-dashboard

# Check pod resource usage
kubectl top pods -n feaf-dashboard

# Check node resource usage
kubectl top nodes
```

## Next Steps

After infrastructure setup:

1. **Task 2**: Create ConfigMaps and Secrets
2. **Task 3**: Set up persistent storage (PVCs)
3. **Task 4**: Deploy PostgreSQL StatefulSet
4. **Task 20**: Deploy backend services
5. **Task 31**: Deploy frontend
6. **Task 33**: Deploy Prometheus

## References

- [Kubernetes Namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
- [Kubernetes RBAC](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- [Resource Quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
- [Limit Ranges](https://kubernetes.io/docs/concepts/policy/limit-range/)
- [Service Accounts](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)
