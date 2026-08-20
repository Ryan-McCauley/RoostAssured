module StripePayments
  class ConnectAccountService
    def create_account!(sitter)
      return if sitter.stripe_account_id.present?

      account = ::Stripe::Account.create(
        {
          type: "express",
          email: sitter.email_address,
          business_type: "individual",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
          }
        },
        # Approving an application twice shouldn't leave a second orphaned Connect account behind.
        idempotency_key: "connect-account-#{sitter.id}"
      )
      sitter.update!(stripe_account_id: account.id, stripe_onboarding_status: "pending")
    end

    def generate_onboarding_link(sitter, refresh_url:, return_url:)
      create_account!(sitter) if sitter.stripe_account_id.blank?

      link = ::Stripe::AccountLink.create(
        account: sitter.stripe_account_id,
        refresh_url: refresh_url,
        return_url: return_url,
        type: "account_onboarding"
      )
      link.url
    end

    def sync_status!(sitter, account)
      status =
        if account.charges_enabled && account.details_submitted
          "complete"
        elsif account.requirements&.disabled_reason.present?
          "restricted"
        else
          "pending"
        end
      sitter.update!(stripe_onboarding_status: status)
    end
  end
end
