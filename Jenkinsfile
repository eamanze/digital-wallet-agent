pipeline {
  agent { label 'docker-aws' }
  options { timestamps(); disableConcurrentBuilds(); skipDefaultCheckout(true) }
  parameters {
    string(name: 'SERVICE', defaultValue: 'api-gateway', description: 'Workspace service name')
    booleanParam(name: 'DEPLOY', defaultValue: false, description: 'Deploy after validation')
    choice(name: 'TARGET_ENVIRONMENT', choices: ['dev', 'staging', 'prod'], description: 'Highest environment to deploy')
  }
  environment {
    AWS_REGION = credentials('wallet-aws-region')
    ECR_REGISTRY = credentials('wallet-ecr-registry')
    IMAGE_TAG = "${env.GIT_COMMIT ?: 'unknown'}-${env.BUILD_NUMBER}"
    IMAGE_URI = "${ECR_REGISTRY}/${params.SERVICE}:${env.IMAGE_TAG}"
  }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('Install dependencies') { steps { sh 'npm ci' } }
    stage('Lint') { steps { sh 'npm run lint --if-present' } }
    stage('Unit tests') { steps { sh "npm test --workspace services/${params.SERVICE}" } }
    stage('Integration tests') { steps { sh 'npm run test:integration --if-present' } }
    stage('Contract tests') { steps { sh 'npm run test:contract --if-present' } }
    stage('Dependency scan') { steps { sh 'npm audit --audit-level=high' } }
    stage('Secret scan') { steps { sh 'gitleaks detect --no-banner --redact' } }
    stage('Build Docker image') { steps { sh 'docker build --build-arg SERVICE="$SERVICE" -t "$IMAGE_URI" -f docker/Dockerfile.service .' } }
    stage('Scan Docker image') { steps { sh 'trivy image --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed "$IMAGE_URI"' } }
    stage('Push image to ECR') {
      when { expression { params.DEPLOY } }
      steps { withAWS(credentials: 'wallet-aws-oidc', region: env.AWS_REGION) { sh 'aws ecr get-login-password | docker login --username AWS --password-stdin "$ECR_REGISTRY"; docker push "$IMAGE_URI"' } }
    }
    stage('Deploy ECS dev') {
      when { expression { params.DEPLOY } }
      steps { withAWS(credentials: 'wallet-aws-oidc', region: env.AWS_REGION) { sh 'aws ecs update-service --cluster wallet-dev --service "$SERVICE" --force-new-deployment; aws ecs wait services-stable --cluster wallet-dev --services "$SERVICE"' } }
    }
    stage('Smoke tests dev') { when { expression { params.DEPLOY } } steps { sh 'curl --fail --retry 10 --retry-delay 5 "$DEV_SMOKE_URL/health/live"' } }
    stage('Approve staging') { when { expression { params.DEPLOY && params.TARGET_ENVIRONMENT in ["staging", "prod"] } } steps { input message: 'Promote this image to staging?', ok: 'Promote' } }
    stage('Deploy staging') { when { expression { params.DEPLOY && params.TARGET_ENVIRONMENT in ["staging", "prod"] } } steps { withAWS(credentials: 'wallet-aws-oidc', region: env.AWS_REGION) { sh 'aws ecs update-service --cluster wallet-staging --service "$SERVICE" --force-new-deployment; aws ecs wait services-stable --cluster wallet-staging --services "$SERVICE"' } } }
    stage('Approve production') { when { expression { params.DEPLOY && params.TARGET_ENVIRONMENT == 'prod' } } steps { input message: 'Promote this image to production?', ok: 'Deploy production' } }
    stage('Deploy production') { when { expression { params.DEPLOY && params.TARGET_ENVIRONMENT == 'prod' } } steps { withAWS(credentials: 'wallet-aws-oidc', region: env.AWS_REGION) { sh 'aws ecs update-service --cluster wallet-prod --service "$SERVICE" --force-new-deployment; aws ecs wait services-stable --cluster wallet-prod --services "$SERVICE"' } } }
    stage('Smoke tests production') { when { expression { params.DEPLOY && params.TARGET_ENVIRONMENT == 'prod' } } steps { sh 'curl --fail --retry 10 --retry-delay 5 "$PROD_SMOKE_URL/health/live"' } }
    stage('Rollback') { when { expression { currentBuild.currentResult == 'FAILURE' && params.DEPLOY } } steps { input message: 'Deployment failed. Roll back ECS service to the previous task definition?', ok: 'Rollback'; withAWS(credentials: 'wallet-aws-oidc', region: env.AWS_REGION) { sh 'aws ecs update-service --cluster "wallet-${TARGET_ENVIRONMENT}" --service "$SERVICE" --task-definition "$PREVIOUS_TASK_DEFINITION" --force-new-deployment; aws ecs wait services-stable --cluster "wallet-${TARGET_ENVIRONMENT}" --services "$SERVICE"' } } }
  }
  post { always { archiveArtifacts artifacts: 'npm-debug.log*,reports/**', allowEmptyArchive: true } }
}
