pipeline {
    agent any

    parameters {
        string(name: 'BASE_URL', defaultValue: params.BASE_URL ?: null, description: 'Base URL')
    }

    stages {
        stage('Build') {
            steps {
                sh 'docker compose build'
            }
        }
        stage('Deploy') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }
}