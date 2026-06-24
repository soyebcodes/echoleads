import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account settings and preferences.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Account Information Section */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Account Information</h2>
              <p className="text-sm text-slate-400">Your personal account details</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
              <input 
                type="text" 
                value={user?.email || ""} 
                disabled 
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 opacity-70 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">User ID</label>
              <input 
                type="text" 
                value={user?.id || ""} 
                disabled 
                className="w-full bg-slate-950 border border-white/5 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 opacity-70 cursor-not-allowed font-mono"
              />
            </div>
          </div>
        </div>

        {/* App Preferences Section (Placeholder) */}
        <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Preferences</h2>
              <p className="text-sm text-slate-400">Application and notification settings</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">Email Notifications</p>
                <p className="text-slate-400 text-sm mt-0.5">Receive an email when new high-intent leads are found</p>
              </div>
              <button disabled className="w-11 h-6 bg-indigo-600 rounded-full relative cursor-not-allowed opacity-70">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">Dark Mode</p>
                <p className="text-slate-400 text-sm mt-0.5">Toggle between light and dark theme</p>
              </div>
              <button disabled className="w-11 h-6 bg-slate-700 rounded-full relative cursor-not-allowed opacity-70">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></span>
              </button>
            </div>
            
            <p className="text-xs text-slate-500 mt-4">* Note: Preferences are coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
