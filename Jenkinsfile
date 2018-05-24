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
                    description: 'publish to NPM if tests pass',
                    name: 'NPM_PUBLISH'
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
            def env = ["tag=${BUILD_TAG}", "NO_CACHE=${params.NO_CACHE}"]
            withEnv(env) {
                stage('Build') {
                    echo 'Building docker image';
                    sh "make build"
                }
                stage('Lint') {
                    echo 'Linting'
                    sh "make lint"
                }
                stage('Tag') {
                    echo 'Tagging local images';
                    sh "make tag"
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
        }
        if (!params.NO_PRECIOUS) {
            trigger_precious("${BRANCH_NAME}", "${JOB_NAME}");
        }
        if (params.NPM_PUBLISH) {
            stage('Publish') {
                timeout(time: 1, unit: 'MINUTES') {
                    try {
                        withCredentials([string(credentialsId: 'binaris-jenkins-github-user', variable: 'GITHUB_TOKEN')]) {
                            withEnv(['CI=1']) {
                                sh '''
                                    version=$(cat package.json | jq -r ".version")
                                    git remote set-url origin https://${GITHUB_TOKEN}@github.com/binaris/binaris.git
                                    git tag $version
                                    git push --tags
                                ''';
                                echo 'Publishing to NPM'
                                sh 'make publish'
                            }
                        }
                    } finally {
                        sh('''git remote set-url origin https://github.com/binaris/binaris.git''');
                    }
                }
            }
        }
        slack('SUCCESS');
    } catch (err) {
        slack('FAILURE');
        throw err;
    }
}
