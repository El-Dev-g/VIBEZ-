'use client';

import { useState, useEffect } from 'react';
import { fetchOfficialCommunities, fetchOfficialCommunity, updateOfficialCommunity, createOfficialPost, fetchOfficialCommunityMembers, banUser, unbanUser, flagUserInCommunity } from '@/services/api';

export default function OfficialCommunityPage() {
  const [officialCommunities, setOfficialCommunities] = useState<any[]>([]);
  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);
  
  // New Post State
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('TEXT');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const list = await fetchOfficialCommunities();
    setOfficialCommunities(list || []);
    
    if (list && list.length > 0) {
      // Load the first one by default if none selected or keep current if valid
      const targetId = community?.id || list[0].id;
      const data = list.find(c => c.id === targetId) || list[0];
      
      // Fetch full details including posts
      const fullData = await fetchOfficialCommunity(); // This currently returns "first" official
      // To be truly robust for multiple, we should have fetchOfficialCommunityById(id)
      // But let's adapt with what we have or assume the first one is the "main" for now
      // Actually, let's just use the data from the list if it has what we need
      setCommunity(fullData || data);
      
      if (fullData || data) {
        const memberData = await fetchOfficialCommunityMembers(fullData?.id || data.id);
        setMembers(memberData);
      }
    } else {
      setCommunity(null);
    }
    setIsLoading(false);
  };

  const handleSelectCommunity = async (comm: any) => {
    // Note: To support full switching, we'd need an API that takes an ID
    // For now we'll just update the local state and member list
    setIsLoading(true);
    setCommunity(comm);
    const memberData = await fetchOfficialCommunityMembers(comm.id);
    setMembers(memberData);
    setIsLoading(false);
  };

  const showToast = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdateCommunity = async () => {
    setIsSaving(true);
    const result = await updateOfficialCommunity(community);
    if (result) {
      showToast('System community protocols updated.');
    } else {
      showToast('Failed to update community.', true);
    }
    setIsSaving(false);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    
    setIsSaving(true);
    const newPost = await createOfficialPost(community.id, {
      content: postContent,
      type: postType
    });
    
    if (newPost) {
      setCommunity({
        ...community,
        posts: [newPost, ...(community.posts || [])]
      });
      setPostContent('');
      showToast('Global announcement transmitted.');
    } else {
      showToast('Transmission failed.', true);
    }
    setIsSaving(false);
  };

  const handleBanToggle = async (user: any) => {
    const isBanned = user.status === 'Banned';
    const success = isBanned ? await unbanUser(user.id) : await banUser(user.id);
    
    if (success) {
      setMembers(members.map(m => m.id === user.id ? { ...m, status: isBanned ? 'Active' : 'Banned' } : m));
      showToast(`User ${isBanned ? 'unbanned' : 'banned'} successfully.`);
    } else {
      showToast('Operation failed.', true);
    }
  };

  const handleFlagToggle = async (user: any) => {
    const success = await flagUserInCommunity(user.id, !user.isFlagged);
    if (success) {
      setMembers(members.map(m => m.id === user.id ? { ...m, isFlagged: !user.isFlagged } : m));
      showToast(`User ${!user.isFlagged ? 'flagged' : 'unflagged'} successfully.`);
    } else {
      showToast('Operation failed.', true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!community && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-3xl">🏛️</div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900">No Official Community Found</h2>
          <p className="text-slate-500 font-bold mt-2">The system community has not been initialized yet.</p>
        </div>
        <button 
          onClick={async () => {
            setIsLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/admin/communities/official`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'VIBEZ Official', description: 'System community' })
            });
            if (res.ok) loadData();
            setIsLoading(false);
          }}
          className="px-8 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-600 transition-all"
        >
          Initialize System Community
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">System Protocol</span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Official Systems</h1>
          </div>
          <p className="text-slate-500 font-bold max-w-2xl">Manage global official communities. These communities are the primary touchpoints for system-wide announcements.</p>
        </div>
      </div>

      {/* Community Selector */}
      {officialCommunities.length > 1 && (
        <div className="flex flex-wrap gap-4 items-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Community:</span>
          {officialCommunities.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectCommunity(c)}
              className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${
                community?.id === c.id 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Configuration */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Community Identity</label>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-slate-900/20">
                  {community.name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{community.name}</h3>
                  <p className="text-xs font-bold text-slate-400">{(community.membersCount || 0).toLocaleString()} Citizens Enrolled</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Permissions Hub</label>
              
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Allow Comments</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Citizens can reply to posts.</p>
                </div>
                <button
                  onClick={() => setCommunity({ ...community, allowComments: !community.allowComments })}
                  className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${!!community.allowComments ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${!!community.allowComments ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Allow Reactions</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Enable emoji responses.</p>
                </div>
                <button
                  onClick={() => setCommunity({ ...community, allowReactions: !community.allowReactions })}
                  className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${!!community.allowReactions ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-300 ${!!community.allowReactions ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <button
              onClick={handleUpdateCommunity}
              disabled={isSaving}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 active:scale-95"
            >
              {isSaving ? 'Syncing...' : 'Save Protocols'}
            </button>
          </div>
        </div>

        {/* Right: Broadcast & Feed */}
        <div className="lg:col-span-2 space-y-8">
          {/* New Post Composer */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Global Transmission</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Announcement Content</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Draft your global signal..."
                  className="w-full min-h-[150px] p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPostType('TEXT')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${postType === 'TEXT' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setPostType('IMAGE')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${postType === 'IMAGE' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    Image
                  </button>
                  <button
                    onClick={() => setPostType('VIDEO')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${postType === 'VIDEO' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    Video
                  </button>
                </div>
                
                <button
                  onClick={handleCreatePost}
                  disabled={isSaving || !postContent.trim()}
                  className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 active:scale-95 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Broadcast Post
                </button>
              </div>
            </div>
          </div>

          {/* Post Feed */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] ml-1">Transmission History</h2>
            {(community.posts || []).map((post: any) => (
              <div key={post.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-lg shadow-slate-200/30 p-8 group hover:border-slate-900 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">V</div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">System Command</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.createdAt ? new Date(post.createdAt).toLocaleString() : 'System Time'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-100">
                    {post.type}
                  </span>
                </div>
                <p className="text-slate-900 font-bold leading-relaxed">{post.content}</p>
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{(post.likes || 0).toLocaleString()} Reactions</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">{(post.comments || 0).toLocaleString()} Comments</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Citizen Roster - Member Management */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Citizen Roster</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage community members and network access</p>
          </div>
          <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{members.length} Enrolled Citizens</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled At</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.map((member) => (
                <tr key={member.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                  <td className="whitespace-nowrap px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs border border-slate-200 group-hover:scale-110 transition-transform">
                        {member.name?.charAt(0) || '?'}
                      </div>
                      <div className="text-sm font-black text-slate-900">{member.name || 'Unknown Citizen'}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-8 py-6 text-sm font-bold text-slate-500 font-mono text-[10px]">{member.phoneNumber || 'N/A'}</td>
                  <td className="whitespace-nowrap px-8 py-6 text-sm font-black text-slate-900">{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Protocol Entry'}</td>
                  <td className="whitespace-nowrap px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        member.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {member.status}
                      </span>
                      {member.isFlagged && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100 animate-pulse">
                          Flagged
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleFlagToggle(member)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          member.isFlagged ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600'
                        }`}
                      >
                        {member.isFlagged ? 'Unflag' : 'Flag'}
                      </button>
                      <button 
                        onClick={() => handleBanToggle(member)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          member.status === 'Banned' ? 'bg-slate-900 text-white' : 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        {member.status === 'Banned' ? 'Unban' : 'Ban Citizen'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-5 rounded-2xl shadow-2xl font-black text-sm animate-bounce ${
          toast.isError ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'
        }`}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
