require "test_helper"

class BlockTest < ActiveSupport::TestCase
  test "prevents blocking yourself" do
    owner = users(:owner_amy)
    block = Block.new(blocker: owner, blocked_user: owner)

    assert_not block.valid?
    assert_includes block.errors[:blocked_user_id], "can't be yourself"
  end

  test "prevents blocking the same user twice" do
    owner = users(:owner_amy)
    sitter_user = users(:sitter_sam_user)
    Block.create!(blocker: owner, blocked_user: sitter_user)

    duplicate = Block.new(blocker: owner, blocked_user: sitter_user)

    assert_not duplicate.valid?
  end

  test "User#blocked? is true regardless of which side initiated the block" do
    owner = users(:owner_amy)
    sitter_user = users(:sitter_sam_user)
    Block.create!(blocker: owner, blocked_user: sitter_user)

    assert owner.blocked?(sitter_user)
    assert sitter_user.blocked?(owner)
  end
end
