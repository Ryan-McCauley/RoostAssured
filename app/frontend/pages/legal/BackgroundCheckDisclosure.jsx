import React from "react"
import LegalPage from "../../components/LegalPage"

export default function BackgroundCheckDisclosure() {
  return (
    <LegalPage title="Background Check Disclosure & Authorization" updated="July 2026">
      <div
        style={{
          background: "var(--red-100)", color: "var(--red-100-text)", textAlign: "left",
          borderRadius: "0.5rem", padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: "0.85rem", lineHeight: 1.5,
        }}
      >
        This document has specific requirements under the federal Fair Credit Reporting Act (FCRA), and many states
        (including California, Minnesota, New York, and Oklahoma) require additional disclosure language beyond
        what's shown here. <strong>This draft must be reviewed by counsel before any real background check is run
        against a live applicant.</strong>
      </div>

      <h2>Disclosure</h2>
      <p>
        Roost Assured may obtain a "consumer report" and/or "investigative consumer report" about you from Checkr,
        Inc. ("Checkr"), a consumer reporting agency, for the purpose of evaluating your application to become a
        Sitter on the Roost Assured platform. This report may include information about your criminal history and
        other background information permitted by law, as configured in the screening package Roost Assured has
        selected for Sitter applicants.
      </p>
      <p>
        This disclosure is provided to you separately from Roost Assured's{" "}
        <a href="/terms">Terms of Service</a>, as required by the FCRA.
      </p>

      <h2>Your Rights Under the FCRA</h2>
      <ul>
        <li>You have the right to request a copy of any report obtained about you.</li>
        <li>
          If Roost Assured takes an adverse action (such as declining your application) based in whole or in part
          on your background check, you will receive a pre-adverse action notice, a copy of the report, and a
          summary of your rights under the FCRA before a final decision is made, along with a reasonable
          opportunity to respond or dispute inaccurate information directly with Checkr.
        </li>
        <li>You have the right to dispute inaccurate or incomplete information in your report directly with Checkr.</li>
      </ul>

      <h2>Authorization</h2>
      <p>
        By checking the authorization box on your Sitter application, you authorize Roost Assured and Checkr to
        obtain the consumer report(s) described above. You may withdraw this authorization at any time by
        contacting <a href="mailto:support@roostassured.com">support@roostassured.com</a>, though doing so may
        prevent your Sitter application from being processed or approved.
      </p>

      <h2>How Checkr Handles Your Information</h2>
      <p>
        You'll provide identifying information (such as your Social Security number and date of birth) directly to
        Checkr through Checkr's own hosted portal — Roost Assured does not collect, see, or store that information.
        Checkr's use of your information is governed by{" "}
        <a href="https://checkr.com/privacy-policy" target="_blank" rel="noreferrer">Checkr's Privacy Policy</a>.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this disclosure can be sent to <a href="mailto:support@roostassured.com">support@roostassured.com</a>.
        Questions about a specific report should be directed to Checkr.
      </p>
    </LegalPage>
  )
}
