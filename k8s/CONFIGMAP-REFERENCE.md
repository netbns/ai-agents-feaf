# ConfigMap Reference

This document describes all configuration values available in the FEAF Dashboard ConfigMaps.

## feaf-config

Non-sensitive application configuration for frontend and backend services.

### Backend API Configuration

| Key | Default Value | Description |
|-----|---------------|-------------|
| `api-url` | `http://feaf-backend:3000` | Internal Kubernetes service URL for backend API |
| `node-env` | `production` | Node.js environment (development, production) |

### Feature Flags

| Key | Default Value | Description |
|-----|---------------|-------------|
| `feature-cross-board-links` | `true` | Enable cross-reference model linking |
| `feature-export-csv` | `true` | Enable CSV export functionality |
| `feature-export-json` | `true` | Enable JSON export functionality |

### Logging Configuration

| Key | Default Value | Description |
|-----|---------------|-------------|
| `log-level` | `info` | Logging level (debug, info, warn, error) |
| `log-format` | `json` | Log format (json, text) |

### API Configuration

| Key | Default Value | Description |
|-----|---------------|-------------|
| `api-rate-limit` | `100` | Maximum requests per minute per user |
| `api-max-request-size` | `10485760` | Maximum request body size in bytes (10MB) |

### Database Configuration (Non-Sensitive)

| Key | Default Value | Description |
|-----|---------------|-------------|
| `db-pool-size` | `10` | Database connection pool size |
| `db-connection-timeout` | `5000` | Connection timeout in milliseconds |

### JWT Configuration (Non-Sensitive)

| Key | Default Value | Description |
|-----|---------------|-------------|
| `jwt-expiration` | `3600` | JWT token expiration time in seconds (1 hour) |

### Prometheus Metrics

| Key | Default Value | Description |
|-----|---------------|-------------|
| `metrics-enabled` | `true` | Enable Prometheus metrics endpoint |
| `metrics-path` | `/metrics` | Path for metrics endpoint |

### CORS Configuration

| Key | Default Value | Description |
|-----|---------------|-------------|
| `cors-enabled` | `true` | Enable CORS |
| `cors-origins` | `*` | Allowed CORS origins (should be restricted in production) |

### Pagination Defaults

| Key | Default Value | Description |
|-----|---------------|-------------|
| `pagination-default-limit` | `20` | Default number of items per page |
| `pagination-max-limit` | `100` | Maximum items per page |

## prometheus-config

Prometheus scrape configuration for monitoring.

### Configuration File: prometheus.yml

The `prometheus-config` ConfigMap contains a complete `prometheus.yml` configuration file with:

- **Global Settings**:
  - Scrape interval: 15 seconds
  - Evaluation interval: 15 seconds
  - External labels: cluster and environment

- **Scrape Configs**:
  - `feaf-backend`: Scrapes backend pods for application metrics
  - `feaf-frontend`: Scrapes frontend pods (if metrics exposed)
  - `kubernetes-apiservers`: Scrapes Kubernetes API server metrics
  - `kubernetes-nodes`: Scrapes node metrics

- **Storage Configuration**:
  - Retention time: 15 days
  - Retention size: 10GB

## Using ConfigMaps in Deployments

### Environment Variables

Reference ConfigMap values as environment variables:

```yaml
env:
- name: API_URL
  valueFrom:
    configMapKeyRef:
      name: feaf-config
      key: api-url
- name: LOG_LEVEL
  valueFrom:
    configMapKeyRef:
      name: feaf-config
      key: log-level
```

### Volume Mounts

Mount entire ConfigMap as files:

```yaml
volumes:
- name: config
  configMap:
    name: feaf-config
containers:
- name: backend
  volumeMounts:
  - name: config
    mountPath: /etc/config
    readOnly: true
```

### Prometheus Configuration

Mount Prometheus config as a volume:

```yaml
volumes:
- name: prometheus-config
  configMap:
    name: prometheus-config
containers:
- name: prometheus
  volumeMounts:
  - name: prometheus-config
    mountPath: /etc/prometheus
```

## Updating ConfigMaps

### Method 1: Edit in-place

```bash
kubectl edit configmap feaf-config -n feaf-dashboard
```

### Method 2: Apply updated YAML

```bash
# Edit k8s/04-configmap.yaml
kubectl apply -f k8s/04-configmap.yaml
```

### Method 3: Patch specific values

```bash
kubectl patch configmap feaf-config -n feaf-dashboard \
  --type merge \
  -p '{"data":{"log-level":"debug"}}'
```

### Restarting Pods After Updates

ConfigMap changes don't automatically restart pods. You must manually restart:

```bash
# Restart backend
kubectl rollout restart deployment/feaf-backend -n feaf-dashboard

# Restart frontend
kubectl rollout restart deployment/feaf-frontend -n feaf-dashboard

# Restart Prometheus
kubectl rollout restart deployment/prometheus -n feaf-dashboard
```

## Environment-Specific Configuration

For different environments (dev, staging, prod), create separate ConfigMaps:

```bash
# Development
kubectl create configmap feaf-config \
  --from-literal=node-env=development \
  --from-literal=log-level=debug \
  --namespace=feaf-dashboard-dev

# Production
kubectl create configmap feaf-config \
  --from-literal=node-env=production \
  --from-literal=log-level=info \
  --namespace=feaf-dashboard-prod
```

## Best Practices

1. **Separate Concerns**: Keep non-sensitive config in ConfigMaps, sensitive data in Secrets
2. **Version Control**: ConfigMaps can be safely committed to Git
3. **Documentation**: Document all configuration keys and their purposes
4. **Validation**: Validate configuration values in application code
5. **Defaults**: Provide sensible defaults in application code
6. **Immutability**: Consider making ConfigMaps immutable in production:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: feaf-config
immutable: true
data:
  # ... configuration
```

7. **Naming**: Use descriptive names for ConfigMap keys (kebab-case)
8. **Restart Strategy**: Plan for pod restarts when updating ConfigMaps

## Troubleshooting

### ConfigMap Not Found

```bash
# Check if ConfigMap exists
kubectl get configmap feaf-config -n feaf-dashboard

# If not found, apply it
kubectl apply -f k8s/04-configmap.yaml
```

### Pod Can't Read ConfigMap

```bash
# Check pod events
kubectl describe pod <pod-name> -n feaf-dashboard

# Verify ConfigMap is mounted
kubectl exec <pod-name> -n feaf-dashboard -- ls -la /etc/config/
```

### Configuration Not Taking Effect

```bash
# Verify ConfigMap has correct values
kubectl get configmap feaf-config -n feaf-dashboard -o yaml

# Restart pods to pick up changes
kubectl rollout restart deployment/<deployment-name> -n feaf-dashboard
```

### Invalid Configuration Values

```bash
# Check application logs for validation errors
kubectl logs <pod-name> -n feaf-dashboard

# Verify environment variables in pod
kubectl exec <pod-name> -n feaf-dashboard -- env | grep -i config
```

## References

- [Kubernetes ConfigMaps Documentation](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Configure a Pod to Use a ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)
- [Prometheus Configuration](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
