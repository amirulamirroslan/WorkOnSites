import { useState } from "react";

// Malaysia's Personal Data Protection Act 2010 requires a notice — what's
// collected, why, and who to contact — before personal data (here: GPS
// location and clock-in/out photos) is processed. Shown once per device
// before login; see Login.tsx for the storage flag and the consent record
// written to the account on first accept.
export default function PdpaConsentModal({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
      <div className="bg-white text-ink-900 rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-cloud-100">
          <h2 className="font-display text-lg font-bold">Personal Data Protection Notice</h2>
          <p className="text-ink-900/50 text-xs mt-1">Required under Malaysia's Personal Data Protection Act 2010</p>
        </div>

        <div className="px-6 py-4 overflow-y-auto text-sm text-ink-900/80 space-y-3">
          <p>To verify attendance, WorkOnSite collects and processes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your name, phone number and role</li>
            <li>Your GPS location at clock-in and clock-out</li>
            <li>A verification photo at clock-in and clock-out, timestamped and geotagged</li>
          </ul>
          <p>
            This data is used only for attendance verification and workforce management by your organization, and
            is stored securely. It is not sold or shared with third parties outside your organization. You may
            request access to, or correction of, your data by contacting your organization's admin or owner.
          </p>
          <p>By continuing, you consent to this collection and processing under the PDPA 2010.</p>
        </div>

        <div className="px-6 py-4 border-t border-cloud-100 space-y-3">
          <label className="flex items-start gap-2.5 text-xs text-ink-900/70">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5"
            />
            I have read and agree to this Personal Data Protection Notice
          </label>
          <button className="action-band disabled:opacity-40" disabled={!checked} onClick={onAccept}>
            Accept &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
}
