require "test_helper"
class CspNonceRenderTest < ActionDispatch::IntegrationTest
  test "the inline theme script is nonced and the CSP header carries the same nonce" do
    get "/"
    assert_response :success
    nonce = response.body[/<script nonce="([^"]+)"/, 1]
    assert nonce.present?, "expected a nonce on the inline theme script"
    csp = response.headers["Content-Security-Policy"]
    assert_includes csp, "'nonce-#{nonce}'"
    # 'self' must survive alongside the nonce or the Vite bundle tags stop loading.
    assert_match(/script-src[^;]*'self'/, csp)
  end
end
