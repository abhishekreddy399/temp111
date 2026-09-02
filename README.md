# CivicSense — Microservices Architecture

CivicSense is a cloud-native, microservices-based civic issue reporting and resolution platform for smart cities.

---

## 🏛️ System Architecture

```text
                                 ┌───────────────────────┐
                                 │   Frontend (React)    │
                                 └───────────┬───────────┘
                                             │
                                             ▼
                                 ┌───────────────────────┐
                                 │      API Gateway      │
                                 │      (Port 5000)      │
                                 └───────────┬───────────┘
                                             │
         ┌───────────────────┬───────────────┼───────────────┬───────────────────┐
         │                   │               │               │                   │
         ▼                   ▼               ▼               ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Auth Service   │ │Complaint Service│ │  Admin Service  │ │Analytics Service│ │ legacy /backend │
│   (Port 5001)   │ │   (Port 5002)   │ │   (Port 5003)   │ │   (Port 5004)   │ │   (Monolith)    │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └─────────────────┘
         │                   │                   │                   │
         ▼                   ▼                   └─────────┬─────────┘
  ┌──────────────┐    ┌──────────────┐                     │
  │ civicsense_  │    │ civicsense_  │                     │ (HTTP REST API)
  │ auth (MongoDB│    │complaints DB │ ◄───────────────────┘
  └──────────────┘    └──────────────┘
```

---

## 📁 Directory Layout

- `services/api-gateway/`: Central entry point & reverse proxy router (Port 5000)
- `services/auth-service/`: User authentication, JWT issuance, password hashing (Port 5001)
- `services/complaint-service/`: Issue reporting, geocoding, Cloudinary uploads, email notifications (Port 5002)
- `services/admin-service/`: Municipal admin operations via Complaint Service APIs (Port 5003)
- `services/analytics-service/`: Statistical reporting & hotspot analytics via Complaint Service APIs (Port 5004)
- `frontend/`: React + Vite SPA client (Port 80 / 3000)
- `k8s/`: Kubernetes deployments, ClusterIP/NodePort services, & secret manifests
- `infra/`: Terraform AWS Infrastructure provisioning
- `docker-compose.yml`: Multi-container orchestrator for local development

---

## 🚀 Quick Start (Local Development)

### Run all microservices using Docker Compose
```bash
docker-compose up --build
```

### Accessing Services
- **Frontend App**: `http://localhost:80` (or `http://localhost:3000`)
- **API Gateway**: `http://localhost:5000`
- **Auth Service**: `http://localhost:5001`
- **Complaint Service**: `http://localhost:5002`
- **Admin Service**: `http://localhost:5003`
- **Analytics Service**: `http://localhost:5004`
- **MongoDB**: `localhost:27017`

---

## ⚓ Kubernetes Deployment

### Deploy to Kubernetes Cluster
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/
```

### Exposed Kubernetes Ports (NodePort)
- **Frontend**: `http://<Node-IP>:30080`
- **API Gateway**: `http://<Node-IP>:30001`

---

## 🔐 Environment Variables

Key service environment variables:

| Variable | Description | Default |
| --- | --- | --- |
| `AUTH_SERVICE_URL` | Auth Microservice URL | `http://auth-service:5001` |
| `COMPLAINT_SERVICE_URL` | Complaint Microservice URL | `http://complaint-service:5002` |
| `ADMIN_SERVICE_URL` | Admin Microservice URL | `http://admin-service:5003` |
| `ANALYTICS_SERVICE_URL` | Analytics Microservice URL | `http://analytics-service:5004` |
| `AUTH_MONGODB_URI` | Auth MongoDB Database Connection | `mongodb://mongodb:27017/civicsense_auth` |
| `COMPLAINT_MONGODB_URI` | Complaint MongoDB Database Connection | `mongodb://mongodb:27017/civicsense_complaints` |
| `JWT_SECRET` | Secret key for JWT verification | `supersecretjwtkey` |

---

Built for Hackathon & Production DevOps Microservices Infrastructure.
