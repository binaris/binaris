node {
    checkout scm;
    properties([
            parameters([
                stringParam(
                    defaultValue: "master",
                    description: 'tag to use when deploying CLI image',
                    name: 'tag'
                ),
                stringParam(
                    defaultValue: "false",
                    description: 'build docker without cache',
                    name: 'NO_CACHE'
                ),
            ]),
    ]);
    try {
        def tag = params.tag;
        if (!tag) { error('tag not defined'); }

        ansiColor('xterm') {
            stage('Build') {
                echo 'Building docker image';
                sh """
                   export NO_CACHE
                   tag=${tag} make build
                """
            }
            stage('Lint') {
                echo 'Linting'
                sh """
                   tag=${tag} make lint
                """
            }
            stage('Run remote tests') {
                echo 'Deploying and running tests'
                build(
                    job: "bn-cli-trigger",
                    wait: true,
                    parameters: [
                      string(name: 'tag', value: "${tag}")
                    ]
                )
            }
        }
    } catch (err) {
        throw err;
    }
}
