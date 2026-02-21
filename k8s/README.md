# Kubernetes Deployment for FEAF Dashboard

This directory contains Kubernetes manifests for deploying the FEAF Dashboard application.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured to access your cluster
- Sufficient cluster resources (see resource quotas below)

## Directory Structure

```
k8s/
├── 00-namespace.yaml              # Namespace definition
├── 01-service-accounts.yaml       # Service accounts for all components
├── 02-rbac-roles.yaml             # RBAC roles and role bindings
├── 03-resource-quotas.yaml        # Resource quotas and limits
├── 04-configmap.yaml              # ConfigMaps for non-sensitive configuration
├── 05-secrets.yaml.example        # Template for secrets (copy and customize)
├── 06-postgres-pvc.yaml           # PersistentVolumeClaim for PostgreSQL
├── 07-prometheus-pvc.yaml         # PersistentVolumeClaim for Prometheus
├── 08-postgres-init-configmap.yaml # PostgreSQL initialization scripts
├── 08-postgres-statefulset.yaml   # PostgreSQL StatefulSet
├── 09-postgres-service.yaml       # PostgreSQL Service
├── apply-infrastructure.sh        # Script to apply all infrastructure
├── apply-storage.sh               # Script to apply persistent storage
├── apply-postgres.sh              # Script to deploy PostgreSQL
├── verify-infrastructure.sh       # Script to verify infrastructure setup
├── verify-storage.sh              # Script to verify storage setup
├── verify-postgres.sh             # Script to verify PostgreSQL deployment
├── CONFIGMAP-REFERENCE.md         # ConfigMap documentation
├── SECRET-MANAGEMENT.md           # Comprehensive secret management guide
├── STORAGE.md                     # Persistent storage documentation
├── POSTGRES.md                    # PostgreSQL deployment documentation
├── INFRASTRUCTURE.md              # Infrastructure overview
└── README.md                      # This file
```

## Deployment Order

Apply the manifests in numerical order:

### 1. Create Namespace

```bash
kubectl apply -f k8s/00-namespace.yaml
```

This creates the `feaf-dashboard` namespace for all application resources.

### 2. Create Service Accounts

```bash
kubectl apply -f k8s/01-service-accounts.yaml
```

This creates service accounts for:
- `feaf-frontend-sa` - Frontend pods
- `feaf-backend-sa` - Backend API pods
- `feaf-postgres-sa` - PostgreSQL database pods
- `prometheus-sa` - Prometheus monitoring pods

### 3. Set up RBAC

```bash
kubectl apply -f k8s/02-rbac-roles.yaml
```

This creates:
- **Backend Role**: Allows reading ConfigMaps and Secrets
- **Prometheus Role**: Allows scraping metrics from pods, services, and endpoints
- Role bindings to associate service accounts with roles

### 4. Configure Resource Quotas

```bash
kubectl apply -f k8s/03-resource-quotas.yaml
```

This sets up:
- **ResourceQuota**: Limits total resources in the namespace
  - CPU: 8 cores requested, 16 cores limit
  - Memory: 16Gi requested, 32Gi limit
  - Pods: Maximum 20
  - Services: Maximum 10
  - PVCs: Maximum 5
  - Storage: Maximum 100Gi

- **LimitRange**: Sets default resource limits for containers
  - Default CPU: 1000m (1 core)
  - Default Memory: 1Gi
  - Default Request CPU: 250m
  - Default Request Memory: 256Mi

### 5. Create ConfigMaps

```bash
kubectl apply -f k8s/04-configmap.yaml
```

This creates:
- **feaf-config**: Application configuration (API URLs, feature flags, logging settings)
- **prometheus-config**: Prometheus scrape configuration

ConfigMaps contain non-sensitive configuration that can be safely committed to version control.

### 6. Create Secrets

**IMPORTANT**: Secrets contain sensitive data and must be handled securely.

See [SECRET-MANAGEMENT.md](SECRET-MANAGEMENT.md) for detailed instructions on creating and managing secrets.

Quick start for development:

```bash
# Copy the example template
cp k8s/05-secrets.yaml.example k8s/05-secrets.yaml

# Generate secure values
DB_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 24)

# Edit 05-secrets.yaml and replace CHANGE_ME_ values with generated secrets
# Then apply:
kubectl apply -f k8s/05-secrets.yaml

# IMPORTANT: Delete or secure the file after applying
rm k8s/05-secrets.yaml  # Or add to .gitignore
```

For production, use external secret management (Sealed Secrets, Vault, etc.). See SECRET-MANAGEMENT.md for details.

### 7. Set up Persistent Storage

```bash
cd k8s
chmod +x apply-storage.sh
./apply-storage.sh
```

This creates PersistentVolumeClaims for:
- **postgres-pvc**: 20Gi storage for PostgreSQL database
- **prometheus-pvc**: 10Gi storage for Prometheus metrics

PVCs may remain in `Pending` state until pods claim them. This is normal for dynamic provisioning.

To verify storage setup:

```bash
./verify-storage.sh
```

For detailed storage configuration and troubleshooting, see [STORAGE.md](STORAGE.md).

### 8. Deploy PostgreSQL

```bash
cd k8s
chmod +x apply-postgres.sh
./apply-postgres.sh
```

This deploys:
- **PostgreSQL StatefulSet**: Single replica with persistent storage
- **PostgreSQL Service**: Headless ClusterIP service for stable DNS
- **Initialization Scripts**: Database setup and performance tuning

The script will wait for the PostgreSQL pod to be ready and display the deployment status.

To verify PostgreSQL deployment:

```bash
./verify-postgres.sh
```

For detailed PostgreSQL configuration, troubleshooting, and maintenance, see [POSTGRES.md](POSTGRES.md).

## Apply All Manifests

### Using the Apply Script (Recommended)

The easiest way to set up the infrastructure is using the provided script:

```bash
cd k8s
chmod +x apply-infrastructure.sh
./apply-infrastructure.sh
```

This script will:
1. Verify kubectl is configured
2. Apply all manifests in the correct order
3. Prompt for confirmation before applying secrets
4. Display verification results

### Manual Application

To apply all infrastructure manifests manually:

```bash
kubectl apply -f k8s/00-namespace.yaml \
              -f k8s/01-service-accounts.yaml \
              -f k8s/02-rbac-roles.yaml \
              -f k8s/03-resource-quotas.yaml \
              -f k8s/04-configmap.yaml

# Secrets must be created separately - see SECRET-MANAGEMENT.md
```

## Verification

### Using the Verification Script (Recommended)

```bash
cd k8s
chmod +x verify-infrastructure.sh
./verify-infrastructure.sh
```

This script will check:
- Namespace existence
- Service accounts
- RBAC roles and bindings
- Resource quotas and limits
- ConfigMaps
- Secrets (including validation of required keys)

### Manual Verification

### Check Namespace

```bash
kubectl get namespace feaf-dashboard
```

### Check Service Accounts

```bash
kubectl get serviceaccounts -n feaf-dashboard
```

Expected output:
```
NAME                 SECRETS   AGE
feaf-backend-sa      0         1m
feaf-frontend-sa     0         1m
feaf-postgres-sa     0         1m
prometheus-sa        0         1m
```

### Check RBAC Roles

```bash
kubectl get roles -n feaf-dashboard
kubectl get rolebindings -n feaf-dashboard
```

### Check Resource Quotas

```bash
kubectl describe resourcequota feaf-dashboard-quota -n feaf-dashboard
kubectl describe limitrange feaf-dashboard-limits -n feaf-dashboard
```

### Check ConfigMaps

```bash
kubectl get configmap -n feaf-dashboard
kubectl describe configmap feaf-config -n feaf-dashboard
```

### Check Secrets

```bash
kubectl get secrets -n feaf-dashboard

# Verify secret keys exist (without exposing values)
kubectl describe secret feaf-secrets -n feaf-dashboard
```

## Resource Allocation

The resource quotas are designed to support:

| Component | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-----------|----------|-------------|-----------|----------------|--------------|
| Frontend  | 2        | 250m        | 500m      | 256Mi          | 512Mi        |
| Backend   | 2        | 500m        | 1000m     | 512Mi          | 1Gi          |
| PostgreSQL| 1        | 500m        | 1000m     | 1Gi            | 2Gi          |
| Prometheus| 1        | 250m        | 500m      | 512Mi          | 1Gi          |
| **Total** | **6**    | **3.5 cores**| **7 cores**| **5.5Gi**     | **10.5Gi**  |

This leaves headroom within the quota for additional pods and resource spikes.

## Security Considerations

### Service Account Permissions

- **Frontend**: No special permissions (uses default service account)
- **Backend**: Can read ConfigMaps and Secrets for configuration
- **PostgreSQL**: No special permissions (uses default service account)
- **Prometheus**: Can discover and scrape metrics from pods and services

### Principle of Least Privilege

Each service account has only the minimum permissions required for its function. The backend can read configuration but cannot modify cluster resources. Prometheus can only read metadata for service discovery.

## Next Steps

After setting up the infrastructure:

1. ✅ Create ConfigMaps and Secrets (completed in task 2)
2. ✅ Set up persistent storage (completed in task 3)
3. ✅ Deploy PostgreSQL (completed in task 4) - See [POSTGRES.md](POSTGRES.md)
4. Deploy backend services (task 20)
5. Deploy frontend (task 31)
6. Deploy Prometheus (task 33)

For detailed secret management, see [SECRET-MANAGEMENT.md](SECRET-MANAGEMENT.md).
For persistent storage details, see [STORAGE.md](STORAGE.md).
For PostgreSQL deployment details, see [POSTGRES.md](POSTGRES.md).

## Troubleshooting

### Quota Exceeded

If you see "exceeded quota" errors:

```bash
kubectl describe resourcequota feaf-dashboard-quota -n feaf-dashboard
```

Check which resources are at their limits and adjust the quota if needed.

### RBAC Permission Denied

If pods cannot access required resources:

```bash
kubectl get rolebindings -n feaf-dashboard
kubectl describe role <role-name> -n feaf-dashboard
```

Verify the service account is bound to the correct role.

### Service Account Not Found

Ensure service accounts are created before deploying pods:

```bash
kubectl get sa -n feaf-dashboard
```

### ConfigMap or Secret Not Found

If pods fail to start due to missing ConfigMaps or Secrets:

```bash
# Check ConfigMaps
kubectl get configmap -n feaf-dashboard

# Check Secrets
kubectl get secrets -n feaf-dashboard

# View pod events for details
kubectl describe pod <pod-name> -n feaf-dashboard
```

For secret issues, see [SECRET-MANAGEMENT.md](SECRET-MANAGEMENT.md).

### Secret Contains Placeholder Values

If you see warnings about placeholder values in secrets:

```bash
# Check secret values (be careful - this exposes sensitive data!)
kubectl get secret feaf-secrets -n feaf-dashboard -o jsonpath='{.data.jwt-secret}' | base64 -d
```

If the value contains "CHANGE_ME", follow the instructions in [SECRET-MANAGEMENT.md](SECRET-MANAGEMENT.md) to generate and apply secure values.

## Cleanup

To remove all infrastructure resources:

```bash
kubectl delete namespace feaf-dashboard
```

**Warning**: This will delete all resources in the namespace, including persistent data.
