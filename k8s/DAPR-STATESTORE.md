# Dapr State Store Component

This document describes the Dapr state store component configuration for the FEAF Dashboard application.

## Overview

The Dapr state store component provides an abstraction layer over PostgreSQL for state management operations. It enables the backend service to perform simple CRUD operations using the Dapr state management API while benefiting from built-in retry logic, resilience, and observability.

## Architecture

### Component Configuration

- **Component Name**: `statestore`
- **Type**: `state.postgresql`
- **Version**: `v1`
- **Namespace**: `feaf-dashboard`

### Data Storage

The state store creates two tables in PostgreSQL:
- **dapr_state**: Stores the actual state data (key-value pairs)
- **dapr_state_metadata**: Stores metadata about state operations

### Connection Configuration

The state store connects to PostgreSQL using the connection string stored in the `feaf-secrets` Kubernetes Secret. This ensures credentials are managed securely and can be rotated without modifying the component configuration.

## Requirements Validation

This component satisfies the following requirements:

- **Requirement 19.1**: The Backend_Service SHALL use Dapr state management API for simple CRUD operations
- **Requirement 19.4**: The Dapr_State_Store SHALL use PostgreSQL as the backing store

## Deployment

### Prerequisites

Before deploying the state store component, ensure:

1. **Dapr Control Plane**: Dapr must be installed on the cluster (task 6A.2)
2. **Namespace**: The `feaf-dashboard` namespace must exist
3. **Secrets**: The `feaf-secrets` secret must exist with a `database-url` key
4. **PostgreSQL**: PostgreSQL must be deployed and accessible (task 4)

### Deploy State Store Component

Apply the component manifest:

```bash
kubectl apply -f k8s/10-dapr-statestore.yaml
```

### Verify Deployment

Run the verification script:

```bash
./k8s/verify-dapr-statestore.sh
```

Or manually verify:

```bash
# Check if component exists
kubectl get components -n feaf-dashboard

# View component details
kubectl describe component statestore -n feaf-dashboard
```

## Configuration Details

### Metadata Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `connectionString` | From secret `feaf-secrets` | PostgreSQL connection URL |
| `tableName` | `dapr_state` | Table for storing state data |
| `metadataTableName` | `dapr_state_metadata` | Table for storing metadata |
| `timeoutInSeconds` | `30` | Timeout for database operations |
| `cleanupIntervalInSeconds` | `3600` | Interval for cleaning up expired state (1 hour) |

### Connection String Format

The connection string follows the PostgreSQL URL format:

```
postgresql://username:password@host:port/database
```

Example:
```
postgresql://feaf_user:password@feaf-postgres:5432/feaf
```

## Usage

### Backend Service Integration

To use the state store, the backend service must:

1. **Enable Dapr Sidecar**: Add Dapr annotations to the deployment
2. **Install Dapr SDK**: Use `@dapr/dapr` package for Node.js
3. **Initialize Client**: Create a Dapr client instance
4. **Use State API**: Call state management methods

### Example: Saving State

```typescript
import { DaprClient } from '@dapr/dapr';

const daprClient = new DaprClient();
const stateStoreName = 'statestore';

// Save state
await daprClient.state.save(stateStoreName, [
  {
    key: 'user:123',
    value: { name: 'John Doe', email: 'john@example.com' }
  }
]);
```

### Example: Getting State

```typescript
// Get state
const state = await daprClient.state.get(stateStoreName, 'user:123');
console.log(state); // { name: 'John Doe', email: 'john@example.com' }
```

### Example: Deleting State

```typescript
// Delete state
await daprClient.state.delete(stateStoreName, 'user:123');
```

### Example: Bulk Operations

```typescript
// Bulk save
await daprClient.state.save(stateStoreName, [
  { key: 'key1', value: 'value1' },
  { key: 'key2', value: 'value2' },
  { key: 'key3', value: 'value3' }
]);

// Bulk get
const states = await daprClient.state.getBulk(stateStoreName, ['key1', 'key2', 'key3']);
```

## When to Use Dapr State vs Prisma ORM

### Use Dapr State Management For:

- **Simple key-value lookups**: Get board by ID, get user by ID
- **Caching**: Frequently accessed data (reference models, user sessions)
- **Distributed state**: State that may span multiple data stores in the future
- **Resilience**: Operations that benefit from Dapr's built-in retry and circuit breaker

### Use Prisma ORM For:

- **Complex queries**: Joins across multiple tables, filtering, sorting
- **Transactions**: Operations that modify multiple entities atomically
- **Schema management**: Database migrations and versioning
- **Advanced features**: Full-text search, aggregations, computed fields

## Database Tables

### dapr_state Table

The state store automatically creates this table with the following structure:

```sql
CREATE TABLE dapr_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  isbinary BOOLEAN NOT NULL,
  insertdate TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedate TIMESTAMP NOT NULL DEFAULT NOW(),
  eTag TEXT
);
```

### dapr_state_metadata Table

Stores metadata about state operations:

```sql
CREATE TABLE dapr_state_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

## Monitoring and Observability

### Metrics

Dapr exposes metrics for state operations:

- `dapr_component_state_transaction_count`: Number of state operations
- `dapr_component_state_transaction_duration_ms`: Duration of state operations
- `dapr_component_state_transaction_errors`: Number of failed operations

These metrics are automatically scraped by Prometheus.

### Logs

State operations are logged by the Dapr sidecar. View logs:

```bash
# View backend pod logs (includes Dapr sidecar)
kubectl logs -n feaf-dashboard <backend-pod-name> -c daprd
```

### Tracing

Dapr automatically instruments state operations with distributed tracing. Traces include:
- Operation type (get, set, delete, bulk)
- Key names
- Duration
- Success/failure status

## Troubleshooting

### Component Not Found

**Symptom**: Backend logs show "component 'statestore' not found"

**Solution**:
```bash
# Verify component exists
kubectl get components -n feaf-dashboard

# If not found, apply the manifest
kubectl apply -f k8s/10-dapr-statestore.yaml
```

### Connection Errors

**Symptom**: State operations fail with connection errors

**Solution**:
```bash
# Check if PostgreSQL is running
kubectl get pods -n feaf-dashboard -l app=feaf-postgres

# Check if secret exists and has correct key
kubectl get secret feaf-secrets -n feaf-dashboard -o jsonpath='{.data.database-url}' | base64 -d

# Test PostgreSQL connectivity
kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- pg_isready -U feaf_user -d feaf
```

### Tables Not Created

**Symptom**: State operations fail with "table does not exist"

**Solution**:
The tables are created automatically on first use. Ensure:
1. PostgreSQL is running and accessible
2. The database user has CREATE TABLE permissions
3. The database specified in the connection string exists

### Timeout Errors

**Symptom**: State operations timeout

**Solution**:
1. Check PostgreSQL performance and resource usage
2. Increase `timeoutInSeconds` in the component configuration
3. Review database query performance
4. Consider adding database indexes

## Security Considerations

### Credentials Management

- Connection string is stored in Kubernetes Secret
- Secret is mounted as environment variable in Dapr sidecar
- Rotate credentials regularly (see [SECRET-MANAGEMENT.md](SECRET-MANAGEMENT.md))

### Network Security

- State store is only accessible via Dapr sidecar
- PostgreSQL is only accessible within the cluster (ClusterIP service)
- No external access to state data

### Data Encryption

- Consider enabling SSL/TLS for PostgreSQL connections in production
- Enable encryption at rest for PostgreSQL persistent volumes
- Use Kubernetes Secret encryption at rest

## Performance Tuning

### Connection Pooling

Dapr manages connection pooling automatically. For high-throughput scenarios:

1. Increase PostgreSQL `max_connections`
2. Tune PostgreSQL connection pool settings
3. Monitor connection usage with Prometheus metrics

### Cleanup Interval

The `cleanupIntervalInSeconds` parameter controls how often expired state is cleaned up. Adjust based on:
- Volume of state data
- TTL usage patterns
- Database performance impact

### Timeout Configuration

The `timeoutInSeconds` parameter controls operation timeout. Adjust based on:
- Network latency
- Database performance
- Application requirements

## Backup and Recovery

### State Data Backup

State data is stored in PostgreSQL. Follow PostgreSQL backup procedures:

```bash
# Backup state tables
kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- \
  pg_dump -U feaf_user -d feaf -t dapr_state -t dapr_state_metadata > state-backup.sql
```

### State Data Restore

```bash
# Restore state tables
cat state-backup.sql | kubectl exec -i feaf-postgres-0 -n feaf-dashboard -- \
  psql -U feaf_user -d feaf
```

## Next Steps

After deploying the state store component:

1. **Task 6A.4**: Create Dapr resiliency configuration
2. **Task 6A.5**: Create Dapr configuration for tracing
3. **Task 7.4**: Install and configure Dapr SDK in backend
4. **Task 7.5**: Create Dapr state management service

## References

- [Dapr State Management API](https://docs.dapr.io/developing-applications/building-blocks/state-management/)
- [Dapr PostgreSQL State Store](https://docs.dapr.io/reference/components-reference/supported-state-stores/setup-postgresql/)
- [Dapr Components](https://docs.dapr.io/concepts/components-concept/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Related Documentation

- [DAPR-INSTALLATION.md](DAPR-INSTALLATION.md) - Dapr control plane setup
- [POSTGRES.md](POSTGRES.md) - PostgreSQL deployment
- [SECRET-MANAGEMENT.md](SECRET-MANAGEMENT.md) - Secret management guide
- [README.md](README.md) - Main deployment guide
