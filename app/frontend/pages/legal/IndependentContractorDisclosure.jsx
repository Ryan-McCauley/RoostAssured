import React from "react"
import LegalPage from "../../components/LegalPage"

export default function IndependentContractorDisclosure() {
  return (
    <LegalPage title="Independent Contractor Disclosure" updated="July 2026">
      <p>
        This page explains the relationship between Roost Assured and Sitters who use the platform to find sitting
        work. It applies to every approved Sitter.
      </p>

      <h2>1. Sitters Are Independent Contractors</h2>
      <p>
        Sitters who use Roost Assured are independent contractors — not employees, agents, joint venturers, or
        partners of Roost Assured. Roost Assured does not direct or control how a Sitter performs a sitting job. A
        Sitter sets their own price per visit, availability, and travel radius, and decides which job requests to
        bid on.
      </p>

      <h2>2. No Employment Benefits</h2>
      <p>
        Because Sitters are independent contractors, they are not entitled to employee benefits from Roost Assured
        — including but not limited to health insurance, paid leave, workers' compensation, or unemployment
        insurance.
      </p>

      <h2>3. Taxes</h2>
      <p>
        Sitters are responsible for their own tax obligations, including reporting and paying income tax on
        earnings received through the platform. Payouts are processed through Stripe Connect, which may issue tax
        forms (such as a 1099-K or 1099-NEC) as required by law.
      </p>

      <h2>4. No Guarantee of Work</h2>
      <p>
        Roost Assured does not guarantee a minimum number of job requests, bids, or income to any Sitter. Being
        approved as a Sitter does not create any ongoing obligation for Owners to select that Sitter.
      </p>

      <h2>5. Sitter Responsibility for Conduct &amp; Liability</h2>
      <p>
        Sitters are solely responsible for the manner in which they perform sitting services, including compliance
        with any applicable local, state, or federal law. Roost Assured is not responsible for a Sitter's acts or
        omissions, including damage to property or harm to animals that occurs during a sitting job. Sitters are
        responsible for carrying any insurance they believe is appropriate for their work.
      </p>
      <p>
        [Placeholder — consider whether Roost Assured will require or offer any form of liability coverage or bond
        for sitting jobs; if so, describe it here. Review with counsel and, if applicable, an insurance broker
        before publishing.]
      </p>

      <h2>6. Background Checks</h2>
      <p>
        Approval as a Sitter requires successfully completing a background check. See the{" "}
        <a href="/background-check-disclosure">Background Check Disclosure &amp; Authorization</a> for details.
        Roost Assured may deactivate a Sitter's account based on background check results at any time, consistent
        with applicable law.
      </p>

      <h2>7. Termination of Access</h2>
      <p>
        Either party may end this relationship at any time. Roost Assured may deactivate a Sitter's account for
        violation of the <a href="/terms">Terms of Service</a>, for extended inactivity, or at its discretion,
        consistent with applicable law.
      </p>
    </LegalPage>
  )
}
