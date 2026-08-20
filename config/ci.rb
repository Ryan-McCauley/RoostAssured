# Run using bin/ci. Mirrors .github/workflows/ci.yml so a failure here means a failure there.

CI.run do
  step "Setup", "bin/setup --skip-server"

  step "Style: Ruby", "bin/rubocop"

  step "Security: Gem audit", "bin/bundler-audit"
  step "Security: Brakeman code analysis", "bin/brakeman --quiet --no-pager --exit-on-warn --exit-on-error"
  step "Security: JavaScript dependency audit", "npm audit --audit-level=high"

  step "Tests", "bin/rails test"
end
