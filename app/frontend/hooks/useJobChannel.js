import { useEffect } from "react"
import { consumer } from "../lib/cable"

// Subscribes to live job updates (status changes, checklist progress) for a single
// accepted bid, so an owner sees their sitter's progress without refreshing the page.
export default function useJobChannel(bidId, onUpdate) {
  useEffect(() => {
    if (!bidId) return

    const subscription = consumer.subscriptions.create(
      { channel: "JobChannel", bid_id: bidId },
      { received: onUpdate }
    )

    return () => subscription.unsubscribe()
  }, [bidId, onUpdate])
}
