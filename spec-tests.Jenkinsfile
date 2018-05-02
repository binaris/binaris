node {
    checkout scm;
    properties([
            parameters([
                stringParam(
                    description: 'stable tag of binaris/binaris to use for testing',
                    name: 'tag'
                    ),
                stringParam(
                    description: 'realm',
                    name: 'realm'
                    ),
            ])
    ]);
    if (!params.tag) { error('tag not defined'); }
    if (!params.realm) { error('realm not defined'); }
    currentBuild.description = "${params.realm} ${params.tag}"

    ansiColor('xterm') {
        def realm = params.realm;
        def tag = params.tag;

        timeout(time: 10, unit: 'MINUTES') {
            withEnv(['CI=true', "tag=${tag}", "realm=${realm}"]) {
                withCredentials([string(credentialsId: 'jenkins-binaris-api-key', variable: 'BINARIS_API_KEY')]) {
                   timestamps {
                       stage("install api key") {
                               build(
                                job: "/create-api-key",
                                wait: true,
                                parameters: [
                                    string(name: 'realm', value:realm),
                                    string(name: 'BUILD_TAG', value:tag),
                                    string(name: 'API_KEY', value:"${BINARIS_API_KEY}")
                                ]
                             )
                       }
                       stage("spec tests") {
                           withEnv(["tag=${BUILD_TAG}"]) {
                               // make test tags binaris/binaris with ${tag}, and we don't want to
                               // somehow override a stable tag with the result of this build.
                               sh 'make test'
                           }
                       }
                    }
                }
            }
        }

    }
}
