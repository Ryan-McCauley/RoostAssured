module Authentication
  extend ActiveSupport::Concern

  included do
    before_action :require_authentication
    helper_method :authenticated?
  end

  class_methods do
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
    end
  end

  private
    def authenticated?
      resume_session
    end

    def require_authentication
      resume_session || request_authentication
    end

    def resume_session
      Current.session ||= find_session_by_cookie
    end

    def find_session_by_cookie
      return unless (session_id = cookies.signed[:session_id])
      return unless (session = Session.find_by(id: session_id))

      if session.expired?
        session.destroy
        cookies.delete(:session_id)
        return nil
      end

      session.touch_if_stale
      session
    end

    def request_authentication
      render json: { errors: [ "You must sign in to continue" ] }, status: :unauthorized
    end

    def after_authentication_url
      nil
    end

    def start_new_session_for(user)
      user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip).tap do |session|
        Current.session = session
        # `permanent` would pin this cookie 20 years out; it should not outlive the Session row.
        cookies.signed[:session_id] = {
          value: session.id,
          httponly: true,
          same_site: :lax,
          secure: Rails.env.production?,
          expires: Session::ABSOLUTE_TIMEOUT.from_now
        }
      end
    end

    def terminate_session
      Current.session.destroy
      cookies.delete(:session_id)
    end
end
