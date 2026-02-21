# Secret Management Guide

This document describes how to manage secrets for the k8s-feaf-dashboard application securely.

## Overview

The application uses Kubernetes Secrets to store sensitive configuration data such as:
- Database credentials (username, password, connection URL)
- JWT signing secret
- PostgreSQL admin password

**CRITICAL**: The default values in `05-secrets.yaml` are placeholders and MUST be replaced with secure values before deployment to any environment.

## Prerequisites

- `kubectl` configured with access to your Kubernetes cluster
- `openssl` for generating secure random values
- Access to the `feaf-dashboard` namespace

## Generating Secure Secrets

### 1. Generate JWT Secret

The JWT secret is used to sign authentication tokens. Generate a strong random secret:

```bash
# Generate a 32-byte random secret encoded in base64
openssl rand -base64 32
```

Example output:
```
Xk7mP9vQ2wR5tY8uI1oP3aS6dF4gH7jK9lZ0xC2vB5n=
```

### 2. Generate Database Passwords

Generate secure passwords for database users:

```bash
# Generate database user password
openssl rand -base64 24

# Generate PostgreSQL admin password
openssl rand -base64 24
```

### 3. Create Database Username

Choose a descriptive username for the application database user:
```
feaf_user
```

## Deployment Methods

### Method 1: Direct kubectl apply (Development/Testing)

**WARNING**: This method stores secrets in plain text in YAML files. Only use for development/testing.

1. Edit `k8s/05-secrets.yaml` and replace all `CHANGE_ME_` values:

```yaml
stringData:
  db-user: "feaf_user"
  db-password: "your-generated-password-here"
  db-name: "feaf"
  db-host: "feaf-postgres"
  db-port: "5432"
  database-url: "postgresql://feaf_user:your-generated-password-here@feaf-postgres:5432/feaf"
  jwt-secret: "your-generated-jwt-secret-here"
  postgres-password: "your-postgres-admin-password-here"
```

2. Apply the secrets:

```bash
kubectl apply -f k8s/05-secrets.yaml
```

3. **IMPORTANT**: Delete or secure the modified YAML file:

```bash
# Option 1: Delete the file after applying
rm k8s/05-secrets.yaml

# Option 2: Ensure it's in .gitignore
echo "k8s/05-secrets.yaml" >> .gitignore
```

### Method 2: kubectl create secret (Recommended for Development)

Create secrets directly without storing them in files:

```bash
# Set variables with your generated values
DB_USER="feaf_user"
DB_PASSWORD="$(openssl rand -base64 24)"
DB_NAME="feaf"
DB_HOST="feaf-postgres"
DB_PORT="5432"
JWT_SECRET="$(openssl rand -base64 32)"
POSTGRES_PASSWORD="$(openssl rand -base64 24)"

# Create the secret
kubectl create secret generic feaf-secrets \
  --namespace=feaf-dashboard \
  --from-literal=db-user="${DB_USER}" \
  --from-literal=db-password="${DB_PASSWORD}" \
  --from-literal=db-name="${DB_NAME}" \
  --from-literal=db-host="${DB_HOST}" \
  --from-literal=db-port="${DB_PORT}" \
  --from-literal=database-url="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" \
  --from-literal=jwt-secret="${JWT_SECRET}" \
  --from-literal=postgres-password="${POSTGRES_PASSWORD}"

# Save the passwords securely (e.g., password manager)
echo "Database Password: ${DB_PASSWORD}"
echo "JWT Secret: ${JWT_SECRET}"
echo "Postgres Admin Password: ${POSTGRES_PASSWORD}"
```

### Method 3: External Secret Management (Recommended for Production)

For production environments, use external secret management systems:

#### Option A: Sealed Secrets

[Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets) allows you to encrypt secrets and store them in Git safely.

1. Install Sealed Secrets controller:

```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml
```

2. Install kubeseal CLI:

```bash
# macOS
brew install kubeseal

# Linux
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/kubeseal-linux-amd64 -O kubeseal
chmod +x kubeseal
sudo mv kubeseal /usr/local/bin/
```

3. Create and seal the secret:

```bash
# Create a temporary secret file
kubectl create secret generic feaf-secrets \
  --namespace=feaf-dashboard \
  --from-literal=db-user="feaf_user" \
  --from-literal=db-password="$(openssl rand -base64 24)" \
  --from-literal=jwt-secret="$(openssl rand -base64 32)" \
  --dry-run=client -o yaml > /tmp/feaf-secrets.yaml

# Seal the secret
kubeseal --format=yaml < /tmp/feaf-secrets.yaml > k8s/05-sealed-secrets.yaml

# Apply the sealed secret
kubectl apply -f k8s/05-sealed-secrets.yaml

# Clean up temporary file
rm /tmp/feaf-secrets.yaml
```

#### Option B: HashiCorp Vault

Use [Vault](https://www.vaultproject.io/) for centralized secret management:

1. Install Vault Agent Injector:

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault --namespace vault --create-namespace
```

2. Store secrets in Vault:

```bash
vault kv put secret/feaf-dashboard/database \
  username="feaf_user" \
  password="$(openssl rand -base64 24)"

vault kv put secret/feaf-dashboard/jwt \
  secret="$(openssl rand -base64 32)"
```

3. Configure Vault annotations in deployment manifests (see Vault documentation).

#### Option C: AWS Secrets Manager / Azure Key Vault / GCP Secret Manager

Use cloud provider secret management with [External Secrets Operator](https://external-secrets.io/):

1. Install External Secrets Operator:

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets-system --create-namespace
```

2. Create ExternalSecret resource pointing to your cloud provider's secret store.

## Verifying Secrets

### Check if secrets exist:

```bash
kubectl get secrets -n feaf-dashboard
```

Expected output:
```
NAME           TYPE     DATA   AGE
feaf-secrets   Opaque   8      1m
```

### View secret keys (not values):

```bash
kubectl describe secret feaf-secrets -n feaf-dashboard
```

### Decode secret values (use with caution):

```bash
# View specific secret value
kubectl get secret feaf-secrets -n feaf-dashboard -o jsonpath='{.data.db-user}' | base64 -d
echo

# View all secret values (SENSITIVE!)
kubectl get secret feaf-secrets -n feaf-dashboard -o json | jq -r '.data | map_values(@base64d)'
```

## Rotating Secrets

Secrets should be rotated periodically for security. Here's how to rotate each secret:

### Rotating Database Password

1. Generate new password:

```bash
NEW_DB_PASSWORD="$(openssl rand -base64 24)"
```

2. Update the database user password:

```bash
# Connect to PostgreSQL pod
kubectl exec -it feaf-postgres-0 -n feaf-dashboard -- psql -U postgres -d feaf

# In PostgreSQL shell:
ALTER USER feaf_user WITH PASSWORD 'new-password-here';
\q
```

3. Update the Kubernetes secret:

```bash
kubectl patch secret feaf-secrets -n feaf-dashboard \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/db-password", "value": "'$(echo -n "${NEW_DB_PASSWORD}" | base64)'"}]'

# Also update database-url
NEW_DB_URL="postgresql://feaf_user:${NEW_DB_PASSWORD}@feaf-postgres:5432/feaf"
kubectl patch secret feaf-secrets -n feaf-dashboard \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/database-url", "value": "'$(echo -n "${NEW_DB_URL}" | base64)'"}]'
```

4. Restart backend pods to pick up new secret:

```bash
kubectl rollout restart deployment/feaf-backend -n feaf-dashboard
```

### Rotating JWT Secret

**WARNING**: Rotating the JWT secret will invalidate all existing user sessions.

1. Generate new JWT secret:

```bash
NEW_JWT_SECRET="$(openssl rand -base64 32)"
```

2. Update the Kubernetes secret:

```bash
kubectl patch secret feaf-secrets -n feaf-dashboard \
  --type='json' \
  -p='[{"op": "replace", "path": "/data/jwt-secret", "value": "'$(echo -n "${NEW_JWT_SECRET}" | base64)'"}]'
```

3. Restart backend pods:

```bash
kubectl rollout restart deployment/feaf-backend -n feaf-dashboard
```

4. Notify users that they need to log in again.

## ConfigMap Management

ConfigMaps store non-sensitive configuration. These can be updated without the same security concerns as secrets.

### Viewing ConfigMaps

```bash
kubectl get configmap feaf-config -n feaf-dashboard -o yaml
```

### Updating ConfigMaps

1. Edit the ConfigMap:

```bash
kubectl edit configmap feaf-config -n feaf-dashboard
```

2. Or apply updated YAML:

```bash
kubectl apply -f k8s/04-configmap.yaml
```

3. Restart pods to pick up changes:

```bash
kubectl rollout restart deployment/feaf-backend -n feaf-dashboard
kubectl rollout restart deployment/feaf-frontend -n feaf-dashboard
```

## Security Best Practices

### 1. Never Commit Secrets to Git

Ensure secrets are never committed to version control:

```bash
# Add to .gitignore
echo "k8s/*secrets*.yaml" >> .gitignore
echo "k8s/*.env" >> .gitignore
echo "!k8s/05-secrets.yaml.example" >> .gitignore
```

### 2. Use RBAC to Restrict Secret Access

Only authorized service accounts and users should access secrets:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
  namespace: feaf-dashboard
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["feaf-secrets"]
  verbs: ["get"]
```

### 3. Enable Encryption at Rest

Ensure Kubernetes encrypts secrets at rest:

```yaml
# /etc/kubernetes/encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - aescbc:
        keys:
        - name: key1
          secret: <base64-encoded-secret>
    - identity: {}
```

### 4. Audit Secret Access

Enable audit logging to track secret access:

```bash
kubectl get events -n feaf-dashboard --field-selector involvedObject.kind=Secret
```

### 5. Use Separate Secrets per Environment

Maintain separate secrets for development, staging, and production:

```bash
# Development
kubectl create secret generic feaf-secrets --namespace=feaf-dashboard-dev ...

# Staging
kubectl create secret generic feaf-secrets --namespace=feaf-dashboard-staging ...

# Production
kubectl create secret generic feaf-secrets --namespace=feaf-dashboard-prod ...
```

### 6. Implement Secret Rotation Policy

Establish a regular rotation schedule:
- Database passwords: Every 90 days
- JWT secrets: Every 180 days
- Review and rotate immediately if compromise is suspected

### 7. Limit Secret Scope

Use separate secrets for different components when possible:

```bash
# Database secrets
kubectl create secret generic feaf-db-secrets ...

# JWT secrets
kubectl create secret generic feaf-jwt-secrets ...

# External API keys
kubectl create secret generic feaf-api-secrets ...
```

## Troubleshooting

### Secret not found error

```bash
# Check if secret exists
kubectl get secret feaf-secrets -n feaf-dashboard

# If not found, create it using one of the methods above
```

### Pod can't read secret

```bash
# Check pod events
kubectl describe pod <pod-name> -n feaf-dashboard

# Check if secret is mounted
kubectl exec <pod-name> -n feaf-dashboard -- ls -la /etc/secrets/

# Check service account permissions
kubectl auth can-i get secrets --as=system:serviceaccount:feaf-dashboard:feaf-backend-sa
```

### Secret values not updating in pods

Kubernetes doesn't automatically restart pods when secrets change. You must manually restart:

```bash
kubectl rollout restart deployment/feaf-backend -n feaf-dashboard
```

## References

- [Kubernetes Secrets Documentation](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [External Secrets Operator](https://external-secrets.io/)
- [HashiCorp Vault](https://www.vaultproject.io/)
- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## Support

For questions or issues with secret management, contact the DevOps team or refer to the main [README.md](README.md).
