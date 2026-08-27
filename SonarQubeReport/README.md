# SonarQube report

Analysis runs on SonarCloud from the workflow in `.github/workflows/sonar.yml`.

https://sonarcloud.io/project/overview?id=aimansabir_cohort-9-mern-9895-aiman

| Measure | Value |
| --- | --- |
| Quality gate | Passed |
| Coverage | 81.8% |
| Bugs | 0 |
| Vulnerabilities | 0 |
| Security hotspots | 0 |
| Duplications | 0.8% |
| Security | A |
| Reliability | A |
| Maintainability | A |

No blocker or high severity issues. What is left is medium and low, mostly
tests that check something throws without naming the error, and the
deprecated execCommand calls in the rich text editor.
