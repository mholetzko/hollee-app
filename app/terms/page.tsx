export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-gray-400">
            By accessing or using HolleeRides, you agree to be bound by these Terms of Service and our Privacy Policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Spotify Integration</h2>
          <div className="space-y-2 text-gray-400">
            <p>
              HolleeRides is powered by Spotify. By using our service, you acknowledge that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You must have a valid Spotify account to use HolleeRides</li>
              <li>Your use of Spotify's service is subject to Spotify's Terms of Service</li>
              <li>We are not affiliated with, endorsed, or sponsored by Spotify</li>
              <li>Spotify content and functionality may change without notice</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. User Data & Content</h2>
          <div className="space-y-2 text-gray-400">
            <p>When using HolleeRides:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>All workout configurations are stored locally on your device</li>
              <li>You retain full control over your data and can delete it at any time</li>
              <li>We do not modify your Spotify playlists or account settings</li>
              <li>You are responsible for maintaining the security of your Spotify credentials</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Limitations</h2>
          <div className="space-y-2 text-gray-400">
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use HolleeRides to download or copy Spotify content</li>
              <li>Attempt to circumvent any technical limitations or security measures</li>
              <li>Use the service in any way that violates Spotify's terms</li>
              <li>Share or distribute access to your HolleeRides configurations without permission</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Disclaimers</h2>
          <div className="space-y-4 text-gray-400">
            <p>
              HolleeRides is provided "as is" without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Uninterrupted or error-free service</li>
              <li>Continuous availability of Spotify features</li>
              <li>Compatibility with all devices or browsers</li>
              <li>Accuracy of BPM detection or workout timing</li>
            </ul>
            <p className="mt-4">
              You use HolleeRides at your own risk. Please consult a healthcare professional before starting any exercise program.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Changes to Terms</h2>
          <p className="text-gray-400">
            We reserve the right to modify these terms at any time. Continued use of HolleeRides after changes constitutes acceptance of the new terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Contact</h2>
          <p className="text-gray-400">
            For questions about these terms, please contact{' '}
            <a href="mailto:contact@holleerides.com" className="text-[#1DB954] hover:underline">
              contact@holleerides.com
            </a>
          </p>
        </section>

        <section className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-gray-400">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </section>
      </div>
    </div>
  );
} 