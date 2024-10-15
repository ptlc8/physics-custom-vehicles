pipeline {
    agent any

    stages {
        stage('Lint') {
            steps {
                sh 'docker compose run --rm server npm run lint'
            }
        }
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