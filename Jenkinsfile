node {
    checkout scm;
    properties([
            parameters([
                stringParam(
                    defaultValue: "false",
                    description: 'build docker without cache',
                    name: 'NO_CACHE'
                ),
            ]),
    ]);
    try {
        ansiColor('xterm') {
            stage('Build') {
                echo 'Building docker image';
                sh """
                   export NO_CACHE
                   export tag=$BUILD_TAG
                   make build
                """
            }
            stage('Lint') {
                echo 'Linting'
                sh """
                   export tag=$BUILD_TAG
                   make lint
                """
            }
        }
    } catch (err) {
        throw err;
    }
}
