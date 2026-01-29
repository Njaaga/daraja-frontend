"use client";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-zinc-800 py-10 px-6 sm:px-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-zinc-600">Effective Date: [Insert Date]</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>
            Daraja Reporting Platform (“we,” “our,” or “us”) values your privacy. This
            Privacy Policy explains how we collect, use, and protect your personal information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Personal Information:</strong> Name, email, company name, and other account-related data.</li>
            <li><strong>Usage Data:</strong> How you interact with the Service, including IP address, browser type, and pages visited.</li>
            <li><strong>Cookies:</strong> Small files stored on your device to improve user experience and analytics.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Provide and maintain the Service</li>
            <li>Process payments and manage subscriptions</li>
            <li>Communicate with you regarding updates or support</li>
            <li>Improve our Service and user experience</li>
            <li>Ensure legal or regulatory compliance</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Sharing Your Information</h2>
          <p>We do not sell your personal information. We may share information with:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Service providers who help us operate the platform</li>
            <li>Legal authorities if required by law</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Data Security</h2>
          <p>
            We implement reasonable security measures to protect your information. However, no method of transmission over the Internet is 100% secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Data Retention</h2>
          <p>
            We retain personal information only as long as necessary for the purposes outlined in this Privacy Policy or as required by law.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have rights to access, correct, or delete your personal information. Contact us at support@darajatechnologies.ca to exercise these rights.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">8. Cookies and Tracking</h2>
          <p>
            Our platform uses cookies and similar technologies to enhance user experience and for analytics. You can control cookies via your browser settings.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">9. Changes to this Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Updated versions will be posted on the platform.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at: support@darajatechnologies.ca
          </p>
        </section>
      </div>
    </div>
  );
}
