class AddIdempotencyKeyToPayments < ActiveRecord::Migration[8.1]
  def up
    # Written before the charge goes out, so a retry that reaches Stripe twice is collapsed into
    # one PaymentIntent rather than billing the owner twice.
    add_column :payments, :idempotency_key, :string
    Payment.reset_column_information
    # Existing rows were charged before this column existed; the intent id is already unique per
    # charge, so it is a safe stand-in and keeps the NOT NULL constraint satisfiable.
    execute "UPDATE payments SET idempotency_key = stripe_payment_intent_id WHERE idempotency_key IS NULL"
    change_column_null :payments, :idempotency_key, false
    add_index :payments, :idempotency_key, unique: true

    # Filled in only once Stripe returns. Until then the row exists in `pending` so the
    # already-paid guard can see it.
    change_column_null :payments, :stripe_payment_intent_id, true
  end

  def down
    remove_index :payments, :idempotency_key
    remove_column :payments, :idempotency_key
    change_column_null :payments, :stripe_payment_intent_id, false
  end
end
