import React from "react"
import LegalPage from "../../components/LegalPage"

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" updated="July 2026">
      <p>
        This Privacy Policy explains what information Roost Assured collects, how we use it, and who we share it
        with. It applies to everyone who uses the Service.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly:</p>
      <ul>
        <li>Account information: name, email address, phone number, password</li>
        <li>Location information: address, city, state, ZIP code (used to match Owners and Sitters nearby)</li>
        <li>Flock and coop details you provide as an Owner, and profile/application details you provide as a Sitter</li>
        <li>Payment information, which is collected and stored directly by Stripe — Roost Assured does not store full card numbers</li>
        <li>Background check consent and results, obtained through Checkr for Sitter applicants</li>
        <li>Messages and content you submit through the Service, such as bios, job notes, and reviews</li>
      </ul>
      <p>We also automatically collect some technical information, such as IP address and general location derived from it, browser type, and pages visited, to operate and secure the Service.</p>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>To operate the marketplace — matching Owners and Sitters, processing bids, and facilitating payments</li>
        <li>To run background checks for Sitter applicants, through Checkr</li>
        <li>To send transactional emails (account, application, and payment notifications) via Resend</li>
        <li>To maintain the security and integrity of the Service, including fraud prevention and rate limiting</li>
        <li>To comply with legal obligations</li>
      </ul>

      <h2>3. How We Share Information</h2>
      <p>We share information only as needed to operate the Service:</p>
      <ul>
        <li><strong>Stripe</strong> — payment processing and payouts</li>
        <li><strong>Checkr</strong> — background check processing for Sitter applicants; Checkr collects sensitive identity information (such as SSN and date of birth) directly from applicants and does not share that raw information back to Roost Assured</li>
        <li><strong>Resend</strong> — transactional email delivery</li>
        <li>Other Owners or Sitters, limited to what's needed to complete a booking (e.g., a Sitter sees the Owner's address for an accepted job)</li>
        <li>Law enforcement or regulators, when required by law</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>4. Cookies</h2>
      <p>
        We use essential cookies to keep you signed in and to protect the Service from abuse (see our rate-limiting
        and security measures). We do not currently use third-party advertising or tracking cookies.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain account and transaction information for as long as your account is active and as needed to
        comply with legal, tax, and accounting obligations. Background check results are retained in accordance
        with FCRA requirements and our background check partner's policies.
      </p>

      <h2>6. Your Choices</h2>
      <p>
        You can review and update most of your account information directly in your account settings. You can
        request deletion of your account by contacting us at <a href="mailto:support@roostassured.com">support@roostassured.com</a>; some information may be retained
        where required by law (e.g., payment and tax records).
      </p>
      <p>
        [Placeholder — if Roost Assured serves California residents, CCPA-specific disclosures and a "Do Not Sell or
        Share My Personal Information" mechanism should be added here; review with counsel based on where users are
        located.]
      </p>

      <h2>7. Children's Privacy</h2>
      <p>The Service is not directed to anyone under 18, and we do not knowingly collect information from children.</p>

      <h2>8. Security</h2>
      <p>
        We use industry-standard measures — including encrypted connections, rate limiting, and a content security
        policy — to protect information submitted through the Service. No method of transmission or storage is
        completely secure, and we can't guarantee absolute security.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. We'll update the "Last updated" date above when we do.
      </p>

      <h2>10. Contact Us</h2>
      <p>Questions about this policy can be sent to <a href="mailto:support@roostassured.com">support@roostassured.com</a>.</p>
    </LegalPage>
  )
}
