ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

# Stubbing helpers for the third-party clients (Stripe, Checkr). Both are redefined at the class
# level, which is process-global, so anything that redefines a method MUST put the original back --
# `remove_method` alone deletes it outright when the original was defined on that same class, and
# every later test in the worker then fails with NoMethodError.
module ExternalServiceStubs
  # Same contract for instance methods.
  def with_instance_method(owner, name, replacement)
    had_own = owner.instance_methods(false).include?(name) || owner.private_instance_methods(false).include?(name)
    original = owner.instance_method(name) if had_own

    owner.define_method(name, replacement)
    yield
  ensure
    if had_own && original
      owner.define_method(name, original)
    elsif owner.instance_methods(false).include?(name)
      owner.send(:remove_method, name)
    end
  end

  # Installs a Stripe class-method stub and registers its teardown, so a test body can read as a
  # straight line instead of nesting blocks.
  def stub_stripe(klass, name, &replacement)
    had_own = klass.singleton_class.instance_methods(false).include?(name)
    original = klass.method(name) if had_own
    klass.define_singleton_method(name, &replacement)

    @stripe_stub_teardowns ||= []
    @stripe_stub_teardowns << lambda do
      klass.singleton_class.send(:remove_method, name) if klass.singleton_class.instance_methods(false).include?(name)
      klass.define_singleton_method(name, original) if had_own && original
    end
  end

  def teardown_stripe_stubs
    Array(@stripe_stub_teardowns).reverse_each(&:call)
    @stripe_stub_teardowns = nil
  end
end

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    include ExternalServiceStubs

    teardown { teardown_stripe_stubs }
  end
end
