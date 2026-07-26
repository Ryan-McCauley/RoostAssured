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
    end
  end
end
