export default function PrivacyMode() {
  return (
    <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto text-sm text-slate-200">
      <h2 className="text-xl font-bold text-slate-100">Privacy Policy</h2>
      <p>
        Riichi Companion is designed to run locally. Game state, settings profiles, and crash diagnostics are stored on your device.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-slate-300">
        <li>No account is required.</li>
        <li>No personal data is intentionally collected by the app.</li>
        <li>Crash logs and support bundles stay local unless you explicitly export/share them.</li>
        <li>Settings and game data are stored in local app/browser storage.</li>
      </ul>
      <p>
        If you choose to share an exported support bundle for debugging, review the file before sharing.
      </p>
      <p className="text-xs text-slate-400">Last updated: 2026-03-14</p>
    </div>
  )
}
