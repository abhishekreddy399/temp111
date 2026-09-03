pipeline {
    agent any

    environment {
        // "Username with password" credential in Jenkins called 'dockerhub-creds'
        DOCKERHUB_CREDS = credentials('dockerhub-creds') 
        
        // Configuration
        EC2_USER = "ubuntu"
        EC2_IP = "3.236.9.180" 
        SSH_CRED_ID = "ec2-ssh-key"
        DEPLOY_PATH = "/home/${EC2_USER}/civic-sense"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Login') {
            steps {
                echo 'Logging in to Docker Hub...'
                sh "echo ${DOCKERHUB_CREDS_PSW} | docker login -u ${DOCKERHUB_CREDS_USR} --password-stdin"
            }
        }

        stage('Build & Push Microservices') {
            parallel {
                stage('API Gateway') {
                    steps {
                        sh "docker build -t abhi754/civicsense-api-gateway:${BUILD_NUMBER} -t abhi754/civicsense-api-gateway:latest ./services/api-gateway"
                        sh "docker push abhi754/civicsense-api-gateway:${BUILD_NUMBER}"
                        sh "docker push abhi754/civicsense-api-gateway:latest"
                    }
                }
                stage('Auth Service') {
                    steps {
                        sh "docker build -t abhi754/civicsense-auth-service:${BUILD_NUMBER} -t abhi754/civicsense-auth-service:latest ./services/auth-service"
                        sh "docker push abhi754/civicsense-auth-service:${BUILD_NUMBER}"
                        sh "docker push abhi754/civicsense-auth-service:latest"
                    }
                }
                stage('Complaint Service') {
                    steps {
                        sh "docker build -t abhi754/civicsense-complaint-service:${BUILD_NUMBER} -t abhi754/civicsense-complaint-service:latest ./services/complaint-service"
                        sh "docker push abhi754/civicsense-complaint-service:${BUILD_NUMBER}"
                        sh "docker push abhi754/civicsense-complaint-service:latest"
                    }
                }
                stage('Admin Service') {
                    steps {
                        sh "docker build -t abhi754/civicsense-admin-service:${BUILD_NUMBER} -t abhi754/civicsense-admin-service:latest ./services/admin-service"
                        sh "docker push abhi754/civicsense-admin-service:${BUILD_NUMBER}"
                        sh "docker push abhi754/civicsense-admin-service:latest"
                    }
                }
                stage('Analytics Service') {
                    steps {
                        sh "docker build -t abhi754/civicsense-analytics-service:${BUILD_NUMBER} -t abhi754/civicsense-analytics-service:latest ./services/analytics-service"
                        sh "docker push abhi754/civicsense-analytics-service:${BUILD_NUMBER}"
                        sh "docker push abhi754/civicsense-analytics-service:latest"
                    }
                }
                stage('Frontend') {
                    steps {
                        sh "docker build --no-cache --build-arg VITE_API_URL='' -t abhi754/civicsense-frontend:${BUILD_NUMBER} -t abhi754/civicsense-frontend:latest ./frontend"
                        sh "docker push abhi754/civicsense-frontend:${BUILD_NUMBER}"
                        sh "docker push abhi754/civicsense-frontend:latest"
                    }
                }
            }
        }

        stage('Deploy Microservices to Kubernetes') {
            steps {
                sshagent([SSH_CRED_ID]) {
                    echo "Deploying microservices to Kubernetes Cluster on Master Node (${EC2_IP})..."
                    
                    // 1. Ensure directory exists on the Master Node
                    sh "ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} 'mkdir -p ${DEPLOY_PATH}/k8s'"
                    
                    // 2. Copy the Kubernetes YAML files to the Master Node
                    sh "scp -o StrictHostKeyChecking=no k8s/*.yaml ${EC2_USER}@${EC2_IP}:${DEPLOY_PATH}/k8s/"
                    
                    // 3. Apply manifests & update container images
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} '
                            cd ${DEPLOY_PATH}
                            kubectl apply -f k8s/namespace.yaml
                            sleep 2
                            
                            # Clean up old monolithic backend service if present
                            kubectl delete svc civic-backend-service --namespace default || true
                            
                            # Apply all Kubernetes manifests
                            kubectl apply -f k8s/
                            
                            # Update deployment images to current build
                            kubectl set image deployment/api-gateway api-gateway=abhi754/civicsense-api-gateway:${BUILD_NUMBER} -n civic-sense || true
                            kubectl set image deployment/auth-service auth-service=abhi754/civicsense-auth-service:${BUILD_NUMBER} -n civic-sense || true
                            kubectl set image deployment/complaint-service complaint-service=abhi754/civicsense-complaint-service:${BUILD_NUMBER} -n civic-sense || true
                            kubectl set image deployment/admin-service admin-service=abhi754/civicsense-admin-service:${BUILD_NUMBER} -n civic-sense || true
                            kubectl set image deployment/analytics-service analytics-service=abhi754/civicsense-analytics-service:${BUILD_NUMBER} -n civic-sense || true
                            kubectl set image deployment/civic-frontend frontend=abhi754/civicsense-frontend:${BUILD_NUMBER} -n civic-sense || true
                            
                            # Restart deployments
                            kubectl rollout restart deployment -n civic-sense
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Microservices Kubernetes Deployment successful! 🎉'
        }
        failure {
            echo 'Deployment failed. Check Jenkins build logs.'
        }
    }
}
