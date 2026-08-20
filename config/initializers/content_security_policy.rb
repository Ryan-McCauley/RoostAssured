# Be sure to restart your server when you modify this file.

# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

# Third-party origins the app genuinely needs. Everything else it loads is same-origin, so the
# policy names these explicitly rather than allowing the whole `https:` scheme — a bare `:https`
# in script-src lets *any* HTTPS host serve script, which gives away most of the XSS protection
# the policy exists to provide.
stripe_script_src = "https://js.stripe.com".freeze
stripe_frame_src = [ "https://js.stripe.com", "https://hooks.stripe.com", "https://m.stripe.network" ].freeze
stripe_connect_src = [ "https://api.stripe.com", "https://maps.stripe.com", "https://m.stripe.network" ].freeze
stripe_img_src = "https://*.stripe.com".freeze
osm_tile_src = "https://*.tile.openstreetmap.org".freeze

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.font_src    :self, :data
    policy.img_src     :self, :data, :blob, osm_tile_src, stripe_img_src
    policy.object_src  :none
    policy.base_uri    :self
    policy.form_action :self
    policy.frame_ancestors :none
    policy.script_src  :self, stripe_script_src
    policy.frame_src   *stripe_frame_src
    # React components set inline `style` attributes throughout the admin dashboard and app pages.
    policy.style_src   :self, :unsafe_inline
    # `:self` covers the same-origin wss:// Action Cable connection under the current CSP spec.
    policy.connect_src :self, *stripe_connect_src

    # Allow @vite/client to hot reload in development. `vite_react_refresh_tag` emits an inline
    # module preamble, so development additionally needs unsafe-inline/unsafe-eval for script.
    if Rails.env.development?
      vite_origin = ViteRuby.config.host_with_port
      policy.script_src *policy.script_src, :unsafe_eval, :unsafe_inline, "http://#{vite_origin}"
      policy.connect_src *policy.connect_src, "ws://#{vite_origin}", "http://#{vite_origin}"
    end
  end

  # The layout carries one inline <script>: the theme resolver that has to run before first paint,
  # which is exactly why it can't be moved into the bundle. Under `script_src :self` the browser
  # refused it in production, so `data-theme` was never set, ThemeContext fell back to "dark", and
  # a light-mode user got a dark flash on every load -- the flash the script exists to prevent.
  # A per-response nonce admits that one tag without opening the policy to inline script generally.
  config.content_security_policy_nonce_generator = ->(request) { request.session.id.to_s.presence || SecureRandom.base64(16) }
  config.content_security_policy_nonce_directives = %w[script-src]

  # Report violations without enforcing the policy.
  config.content_security_policy_report_only = false
end
