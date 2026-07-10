def call(Map options = [:]) {
  def service = options.service ?: params.SERVICE ?: 'api-gateway'
  sh 'npm ci'
  sh "npm test --workspace services/${service}"
  sh "docker build --build-arg SERVICE=${service} -t ${service}:${env.GIT_COMMIT} -f docker/Dockerfile.service ."
}
