export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Data Collection and Usage</h2>
          <p className="text-gray-400">
            HolleeRides is committed to protecting your privacy. This policy explains how we handle your data:
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-2">Spotify Data Access</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li>Read access to your Spotify playlists</li>
                <li>Basic Spotify profile information</li>
                <li>Playback control during workout sessions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-2">Local Storage</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li>Workout configurations (stored only on your device)</li>
                <li>BPM settings for tracks (stored only on your device)</li>
                <li>Spotify access token (stored temporarily and only on your device)</li>
                <li>Active device information (stored temporarily and only on your device)</li>
              </ul>
              <p className="mt-2 text-sm text-gray-400">
                Note: All data, including your Spotify access token, is stored exclusively in your browser's local storage. 
                We never transmit or store this information on our servers.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-2">What We Don't Do</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-400">
                <li>We don't store your personal information on our servers</li>
                <li>We don't track your listening habits</li>
                <li>We don't modify your Spotify playlists</li>
                <li>We don't share your data with third parties</li>
                <li>We don't use your data for advertising</li>
                <li>We don't store your Spotify access token on our servers</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Data Deletion</h2>
          <p className="text-gray-400">
            Since all data is stored locally on your device, you can remove it at any time by:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-400">
            <li>Logging out of the application (automatically clears Spotify tokens)</li>
            <li>Clearing your browser's local storage</li>
            <li>Disconnecting HolleeRides from your Spotify account settings</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Contact</h2>
          <p className="text-gray-400">
            For any privacy-related questions, please contact us at{' '}
            <a href="mailto:contact@holleerides.com" className="text-[#1DB954] hover:underline">
              contact@holleerides.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
} 