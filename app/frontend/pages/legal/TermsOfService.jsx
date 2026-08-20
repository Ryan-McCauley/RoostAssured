import React from "react"
import { Link } from "react-router-dom"
import LegalPage from "../../components/LegalPage"

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" updated="July 2026">
      <p>
        These Terms of Service ("Terms") govern your access to and use of Roost Assured (the "Service"), operated by
        [Roost Assured legal entity name] ("Roost Assured," "we," "us"). By creating an account or using the
        Service, you agree to these Terms. If you don't agree, don't use the Service.
      </p>

      <h2>1. What Roost Assured Is</h2>
      <p>
        Roost Assured is an online marketplace that connects backyard chicken owners ("Owners") with independent
        sitters ("Sitters") for pet-sitting services. <strong>Roost Assured does not itself provide pet-sitting
        services.</strong> We provide the platform, payment processing, and background-check facilitation that let
        Owners and Sitters find each other and transact. See our{" "}
        <Link to="/independent-contractor-disclosure">Independent Contractor Disclosure</Link> for details on the
        nature of the relationship between Roost Assured and Sitters.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old and able to form a binding contract to use the Service. By creating an
        account, you represent that the information you provide is accurate and that you'll keep it up to date.
      </p>

      <h2>3. Accounts</h2>
      <p>
        You're responsible for safeguarding your account credentials and for all activity under your account. Tell
        us immediately if you suspect unauthorized use of your account.
      </p>

      <h2>4. Sitter Applications &amp; Background Checks</h2>
      <p>
        Becoming a Sitter requires submitting an application, paying a non-refundable application fee, and
        completing a background check through our third-party partner, Checkr, Inc. The application fee covers the
        cost of the background check and application processing, and applies whether or not your application is
        approved. See our <Link to="/background-check-disclosure">Background Check Disclosure &amp; Authorization</Link>{" "}
        for details required by the Fair Credit Reporting Act. Roost Assured may approve, reject, or deactivate a
        Sitter account at its discretion, including based on background check results.
      </p>

      <h2>5. Fees &amp; Payments</h2>
      <p>
        Payments between Owners and Sitters are processed through Stripe. When an Owner accepts a Sitter's bid, the
        Owner's payment method is charged and funds are transferred to the Sitter, less Roost Assured's platform
        fee, once the job is completed. All fees are disclosed before you incur them. The sitter application fee
        described in Section 4 is separate and non-refundable.
      </p>

      <h2>6. Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Provide false or misleading information on your profile, application, or listings</li>
        <li>Use the Service for any unlawful purpose, or to harass, threaten, or defraud another user</li>
        <li>Attempt to circumvent Roost Assured's payment system to avoid platform fees</li>
        <li>Interfere with or disrupt the Service, including through unauthorized automated access</li>
        <li>Misrepresent your identity or impersonate another person</li>
      </ul>

      <h2>7. Ratings &amp; Reviews</h2>
      <p>
        Owners may rate and review Sitters after a completed job. Reviews must reflect a genuine experience and may
        not contain unlawful, defamatory, or abusive content. Roost Assured may remove reviews that violate these
        Terms.
      </p>

      <h2>8. Cancellations</h2>
      <p>
        Bid acceptance charges the Owner's payment method at the time of acceptance. Cancellation and refund
        eligibility for a sitting job depends on how far in advance the cancellation occurs; specific windows and
        refund amounts are shown at the time of booking. The sitter application fee is never refundable.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        The Service is provided "as is." Roost Assured does not guarantee the conduct, reliability, or quality of
        any Owner or Sitter, and does not guarantee outcomes for any sitting job. Roost Assured is not responsible
        for the condition of any animal, property, or premises before, during, or after a sitting job.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Roost Assured's total liability arising out of or relating to the
        Service is limited to the greater of $100 or the total fees you paid to Roost Assured in the 12 months
        before the claim arose. Roost Assured is not liable for indirect, incidental, special, or consequential
        damages, including harm to animals or property arising from a sitting arrangement between an Owner and a
        Sitter.
      </p>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify and hold Roost Assured harmless from claims, damages, and expenses (including
        reasonable attorneys' fees) arising from your use of the Service, your violation of these Terms, or your
        interactions with another user.
      </p>

      <h2>12. Dispute Resolution</h2>
      <p>
        [Placeholder — arbitration clause, class-action waiver, and governing-law/venue selection to be drafted with
        counsel. Roost Assured currently operates primarily in Texas; governing law and venue provisions should
        reflect that and be reviewed against applicable state consumer-protection rules before publishing.]
      </p>

      <h2>13. Termination</h2>
      <p>
        We may suspend or terminate your account at any time for violation of these Terms or for conduct we
        determine, in our discretion, is harmful to other users or to Roost Assured. You may close your account at
        any time.
      </p>

      <h2>14. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We'll update the "Last updated" date above when we do.
        Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
      </p>

      <h2>15. Contact</h2>
      <p>Questions about these Terms can be sent to <a href="mailto:support@roostassured.com">support@roostassured.com</a>.</p>
    </LegalPage>
  )
}
