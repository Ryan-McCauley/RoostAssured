module StripePayments
  class CustomerService
    def create_customer!(user)
      return user.stripe_customer_id if user.stripe_customer?

      customer = ::Stripe::Customer.create(email: user.email_address, name: user.name)
      user.update!(stripe_customer_id: customer.id)
      customer.id
    end

    def attach_payment_method!(user, payment_method_id)
      customer_id = create_customer!(user)

      ::Stripe::PaymentMethod.attach(payment_method_id, customer: customer_id)
      ::Stripe::Customer.update(customer_id, invoice_settings: { default_payment_method: payment_method_id })
      # Mirror it locally so User#payment_method? doesn't have to ask Stripe again.
      user.update!(stripe_default_payment_method_id: payment_method_id)
    end

    # Called from the customer.updated webhook, so a card removed or swapped in the Stripe
    # dashboard doesn't leave us believing the owner is still chargeable.
    def sync_default_payment_method!(user, customer)
      user.update!(stripe_default_payment_method_id: customer.invoice_settings&.default_payment_method)
    end
  end
end
