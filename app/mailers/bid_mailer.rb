class BidMailer < ApplicationMailer
  def on_the_way(bid)
    @bid = bid
    @owner = bid.owner
    @sitter = bid.sitter

    mail to: @owner.email_address, subject: "#{@sitter.name} is on the way"
  end

  def request_edited(bid)
    @bid = bid
    @owner = bid.owner
    @sitter = bid.sitter

    mail to: @sitter.email_address, subject: "#{@owner.name} updated their care request"
  end
end
