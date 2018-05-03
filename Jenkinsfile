node {
    checkout scm;
    properties([
            parameters([
                stringParam(
                    defaultValue: "false",
                    description: 'build docker without cache',
                    name: 'NO_CACHE'
                ),
                booleanParam(
                    defaultValue: false,
                    description: 'whether to avoid triggering precious at the end',
                    name: 'NO_PRECIOUS'
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
            stage('Tag') {
                echo 'Tagging local images';
                sh """
                  export tag=$BUILD_TAG
                  make tag
                """
            }
            stage('Push') {
                echo 'Pushing images to ECR'
                build(
                    job: 'cli/push-cli',
                    wait: true,
                    parameters: [
                        string(name: 'TRIGGER_BRANCH', value: BRANCH_NAME),
                        string(name: 'BUILD_TAG', value: BUILD_TAG)
                    ]
                )
            }
        }
        if (!params.NO_PRECIOUS) {
            trigger_precious("${BRANCH_NAME}", "${JOB_NAME}");
        }
        slack('SUCCESS');
    } catch (err) {
        slack('FAILURE');
        throw err;
    }
}
