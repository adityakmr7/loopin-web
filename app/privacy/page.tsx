import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 py-12">
      <div className="container mx-auto max-w-4xl">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <Card className="border-slate-800 bg-slate-900 text-slate-50">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Privacy Policy
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-invert prose-slate max-w-none">
            <div className="space-y-6 text-slate-300">
              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">1. Introduction</h2>
                <p>
                  Welcome to Loopin (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">2. Information We Collect</h2>
                <p className="mb-2">We collect information that you provide directly to us, including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
                  <li><strong>Profile Information:</strong> Any additional information you choose to add to your profile</li>
                  <li><strong>Usage Data:</strong> Information about how you use our application, including features accessed and actions taken</li>
                  <li><strong>Device Information:</strong> Device type, operating system, browser type, and IP address</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">3. How We Use Your Information</h2>
                <p className="mb-2">We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Create and manage your account</li>
                  <li>Send you technical notices, updates, and support messages</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, prevent, and address technical issues and security threats</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">4. Information Sharing and Disclosure</h2>
                <p className="mb-2">We do not sell your personal information. We may share your information in the following circumstances:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>With your consent:</strong> When you explicitly agree to share your information</li>
                  <li><strong>Service providers:</strong> With third-party vendors who perform services on our behalf</li>
                  <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">5. Data Security</h2>
                <p>
                  We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">6. Data Retention</h2>
                <p>
                  We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">7. Your Rights</h2>
                <p className="mb-2">Depending on your location, you may have the following rights:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                  <li><strong>Objection:</strong> Object to processing of your personal information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">8. Cookies and Tracking Technologies</h2>
                <p>
                  We use cookies and similar tracking technologies to track activity on our application and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">9. Third-Party Services</h2>
                <p>
                  Our application may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">10. Children's Privacy</h2>
                <p>
                  Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">11. Changes to This Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-50 mb-3">12. Contact Us</h2>
                <p className="mb-2">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                  <p className="font-mono text-sm">
                    Email: <a href="mailto:privacy@loopin.app" className="text-indigo-400 hover:text-indigo-300">privacy@loopin.app</a>
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
