class AddDefaultPaymentMethodToUsers < ActiveRecord::Migration[8.1]
  def change
    # Mirrors the Stripe customer's invoice_settings.default_payment_method so that asking
    # "can this owner be charged?" is a column read rather than a network round trip. Kept fresh
    # by StripePayments::CustomerService on attach and by the customer.updated webhook.
    add_column :users, :stripe_default_payment_method_id, :string
  end
end
