node {
    checkout scm;
    properties([
            parameters([
                stringParam(
                    defaultValue: "staging",
                    description: 'realm to run CLI Jenkins tests on',
                    name: 'realm'
                ),
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
                   make build
                """
            }
            stage('Lint') {
                echo 'Linting'
                sh """
                   make lint
                """
            }
            stage('Deploy realm') {
                echo 'Deploying realm'
                build(
                    job: "/realms/deploy",
                    wait: true,
                    parameters: [
                    string(name: 'realm', value:realm),
                    string(name: 'tag', value:"master")
                    ]
                )
            }
            stage('Generate key') {
               lock("${params.realm}-realm") {
                   echo 'Generating API key'
                   sh """
                      REGION=`curl -Ls https://ubkw9cm2nh.execute-api.us-east-1.amazonaws.com/dev/fetch/${realm} | jq -r .region`
                      REALM_ZUUL=`aws --region "\$REGION" ec2 describe-instances --filters 'Name=tag:Name,Values=${realm}-zuul' 2>/dev/null | jq -r '.Reservations[].Instances[].PublicDnsName' | tail -1`
                      sudo -E ssh -i /var/jenkins_home/.ssh/binaris-dev.pem -o StrictHostKeyChecking=no ubuntu@"\$REALM_ZUUL" 'curl -X POST localhost:80/v1/apikey/9557231848'
                   """
               }
            }
            stage('Test') {
                lock("${params.realm}-realm") {
                    timeout(time: 5, unit: 'MINUTES') {
                      echo 'Running CLI tests'
                      sh """
                         export BINARIS_INVOKE_ENDPOINT=run-${realm}.binaris.io
                         export BINARIS_DEPLOY_ENDPOINT=api-${realm}.binaris.io
                         export BINARIS_LOG_ENDPOINT=logs-${realm}.binaris.io
                         make test
                      """
                    }
                }
            }
        }
    } catch (err) {
        throw err;
    }
}
