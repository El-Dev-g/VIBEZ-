'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchOfficialCommunities, 
  fetchOfficialCommunity, 
  updateOfficialCommunity, 
  createOfficialPost, 
  fetchOfficialCommunityMembers, 
  banUser, 
  unbanUser, 
  flagUserInCommunity,
  updateCommunityMemberRole,
  addCommunityMember,
  fetchUsers
} from '../../services/api';

export default function OfficialCommunityPage() {
  const [officialCommunities, setOfficialCommunities] = useState<any[]>([]);
  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);

  // New Post Announcement State
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'>('TEXT');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaName, setMediaName] = useState<string>('');
  const [mediaSize, setMediaSize] = useState<string>('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staff Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MODERATOR' | 'CONTENT_ADMIN' | 'MEMBER'>('CONTENT_ADMIN');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const list = await fetchOfficialCommunities();
      setOfficialCommunities(list || []);

      if (list && list.length > 0) {
        const targetId = community?.id || list[0].id;
        const data = list.find((c: any) => c.id === targetId) || list[0];
        const fullData = await fetchOfficialCommunity();
        setCommunity(fullData || data);

        if (fullData || data) {
          const memberData = await fetchOfficialCommunityMembers(fullData?.id || data.id);
          setMembers(memberData || []);
        }
      } else {
        setCommunity(null);
      }
    } catch (err) {
      console.error('Failed to load official community data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllUsersForAssignment = async () => {
    try {
      const usersData = await fetchUsers();
      setAllUsers(usersData || []);
    } catch (err) {
      console.error('Failed to fetch system users:', err);
    }
  };

  const handleSelectCommunity = async (comm: any) => {
    setIsLoading(true);
    setCommunity(comm);
    const memberData = await fetchOfficialCommunityMembers(comm.id);
    setMembers(memberData || []);
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

  // --- File Upload Handler (Any Type of Media) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setMediaName(file.name);
    
    // Calculate formatted file size
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setMediaSize(`${sizeInMb} MB`);

    // Determine type automatically based on MIME if user hasn't explicitly set it
    if (file.type.startsWith('image/')) {
      setPostType('IMAGE');
    } else if (file.type.startsWith('video/')) {
      setPostType('VIDEO');
    } else if (file.type.startsWith('audio/')) {
      setPostType('AUDIO');
    } else {
      setPostType('DOCUMENT');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setMediaUrl(result);
      setIsUploadingMedia(false);
      showToast(`Media attached: ${file.name}`);
    };
    reader.onerror = () => {
      setIsUploadingMedia(false);
      showToast('Failed to process attached file', true);
    };
    reader.readAsDataURL(file);
  };

  const clearAttachedMedia = () => {
    setMediaUrl('');
    setMediaName('');
    setMediaSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && !mediaUrl) return;

    setIsSaving(true);
    
    // Store full media metadata if media is attached
    const postPayload = {
      content: postContent,
      type: postType,
      mediaUrl: mediaUrl || undefined,
      mediaName: mediaName || undefined,
      mediaSize: mediaSize || undefined
    };

    const newPost = await createOfficialPost(community.id, postPayload);

    if (newPost) {
      setCommunity({
        ...community,
        posts: [newPost, ...(community.posts || [])]
      });
      setPostContent('');
      clearAttachedMedia();
      setPostType('TEXT');
      showToast('Global announcement transmitted with media.');
    } else {
      showToast('Transmission failed.', true);
    }
    setIsSaving(false);
  };

  // --- Role Assignment Handlers ---
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!community) return;
    const success = await updateCommunityMemberRole(community.id, userId, newRole);
    if (success) {
      setMembers(members.map(m => m.id === userId ? { ...m, role: newRole } : m));
      showToast(`Role updated to ${getRoleBadgeLabel(newRole)}.`);
    } else {
      showToast('Failed to update member role.', true);
    }
  };

  const handleAssignMemberSubmit = async () => {
    if (!selectedUserId || !community) return;
    setIsAssigning(true);
    const success = await addCommunityMember(community.id, selectedUserId, selectedRole);
    if (success) {
      showToast(`Staff/Member enrolled with role ${getRoleBadgeLabel(selectedRole)}.`);
      setIsAssignModalOpen(false);
      setSelectedUserId('');
      // Reload members list
      const updatedMembers = await fetchOfficialCommunityMembers(community.id);
      setMembers(updatedMembers || []);
    } else {
      showToast('Failed to assign staff member.', true);
    }
    setIsAssigning(false);
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

  const getRoleBadgeLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Community Admin';
      case 'MODERATOR': return 'Moderation Staff';
      case 'CONTENT_ADMIN': return 'Content Admin';
      case 'MEMBER': return 'Member';
      default: return role || 'Member';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MODERATOR': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CONTENT_ADMIN': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
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

  // Filtered users for assignment modal
  const filteredUsersForModal = allUsers.filter(u => {
    const q = searchUserQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q)) ||
      (u.googleEmail && u.googleEmail.toLowerCase().includes(q)) ||
      (u.id && u.id.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">System Protocol</span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Official Community & Staff Control</h1>
          </div>
          <p className="text-slate-500 font-bold max-w-2xl">
            Assign staff roles (Admin, Moderator, Content Admin) to community members and transmit announcements with rich multi-media support.
          </p>
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
        {/* Left: Community Identity & Configuration */}
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
                  <p className="text-xs font-bold text-slate-400">{(community.membersCount || members.length || 0).toLocaleString()} Enrolled Citizens</p>
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

        {/* Right: Broadcast & Feed with Multi-Media Attachment */}
        <div className="lg:col-span-2 space-y-8">
          {/* New Post / Announcement Composer */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Content Admin Announcement Broadcast</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transmit text, images, videos, audio notes, or documents</p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-widest rounded-full">
                Content Admin Ready
              </span>
            </div>

            <div className="p-8 space-y-6">
              {/* Media Type Bar */}
              <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                <button
                  onClick={() => setPostType('TEXT')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${postType === 'TEXT' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  📝 Text
                </button>
                <button
                  onClick={() => setPostType('IMAGE')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${postType === 'IMAGE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  📷 Image
                </button>
                <button
                  onClick={() => setPostType('VIDEO')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${postType === 'VIDEO' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  🎥 Video
                </button>
                <button
                  onClick={() => setPostType('AUDIO')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${postType === 'AUDIO' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  🎙️ Audio / Voice
                </button>
                <button
                  onClick={() => setPostType('DOCUMENT')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${postType === 'DOCUMENT' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  📄 Document / File
                </button>
              </div>

              {/* Text Input */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Announcement Caption / Message</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Draft official community signal..."
                  className="w-full min-h-[120px] p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Media File Attachment Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Attach Media File (Any Format)</label>
                  {mediaUrl && (
                    <button
                      onClick={clearAttachedMedia}
                      className="text-[10px] font-black text-red-500 hover:underline uppercase tracking-widest"
                    >
                      Remove Attachment
                    </button>
                  )}
                </div>

                {!mediaUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer group p-6 border-2 border-dashed border-slate-200 hover:border-slate-900 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all text-center flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                      📁
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Click to upload or drag any media file</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">Supports Images, Videos, MP3/WAV Audio, PDFs, Word, ZIP & more</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      accept="*/*"
                      className="hidden"
                    />
                  </div>
                ) : (
                  /* Media Attachment Preview Box */
                  <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded uppercase">
                          {postType}
                        </span>
                        <span className="truncate max-w-[200px]">{mediaName || 'Attached File'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{mediaSize}</span>
                    </div>

                    {/* Type specific preview */}
                    {postType === 'IMAGE' && (
                      <div className="relative rounded-xl overflow-hidden max-h-56 bg-black flex items-center justify-center">
                        <img src={mediaUrl} alt="Upload preview" className="max-h-56 object-contain" />
                      </div>
                    )}

                    {postType === 'VIDEO' && (
                      <div className="rounded-xl overflow-hidden max-h-56 bg-black">
                        <video src={mediaUrl} controls className="w-full max-h-56 object-contain" />
                      </div>
                    )}

                    {postType === 'AUDIO' && (
                      <div className="p-3 bg-slate-800 rounded-xl">
                        <audio src={mediaUrl} controls className="w-full" />
                      </div>
                    )}

                    {postType === 'DOCUMENT' && (
                      <div className="p-4 bg-slate-800 rounded-xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-xl">
                          📄
                        </div>
                        <div>
                          <p className="text-xs font-black">{mediaName || 'Document Attachment'}</p>
                          <p className="text-[10px] text-slate-400">Ready for global broadcast</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Broadcast Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCreatePost}
                  disabled={isSaving || isUploadingMedia || (!postContent.trim() && !mediaUrl)}
                  className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 active:scale-95 flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {isSaving ? 'Transmitting...' : 'Broadcast Announcement'}
                </button>
              </div>
            </div>
          </div>

          {/* Post Transmission History Feed */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] ml-1">Transmission Feed</h2>
            {(community.posts || []).map((post: any) => (
              <div key={post.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-lg shadow-slate-200/30 p-8 group hover:border-slate-900 transition-all duration-300 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">V</div>
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">System Official Announcement</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.createdAt ? new Date(post.createdAt).toLocaleString() : 'System Time'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                    {post.type || 'TEXT'}
                  </span>
                </div>

                {post.content && (
                  <p className="text-slate-900 font-bold leading-relaxed">{post.content}</p>
                )}

                {/* Attached Media Display */}
                {post.mediaUrl && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-2">
                    {(post.type === 'IMAGE' || (!post.type && post.mediaUrl.startsWith('data:image'))) && (
                      <img src={post.mediaUrl} alt="Announcement media" className="w-full max-h-96 object-cover rounded-xl" />
                    )}

                    {(post.type === 'VIDEO' || post.mediaUrl.startsWith('data:video')) && (
                      <video src={post.mediaUrl} controls className="w-full max-h-96 rounded-xl bg-black" />
                    )}

                    {(post.type === 'AUDIO' || post.mediaUrl.startsWith('data:audio')) && (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-700">
                          <span>🎙️ Official Audio Note</span>
                        </div>
                        <audio src={post.mediaUrl} controls className="w-full" />
                      </div>
                    )}

                    {(post.type === 'DOCUMENT' || (!['IMAGE', 'VIDEO', 'AUDIO'].includes(post.type) && !post.mediaUrl.startsWith('data:image'))) && (
                      <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                            📄
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900">{post.mediaName || 'Attached Document'}</p>
                            <p className="text-[10px] font-bold text-slate-400">Official File Attachment</p>
                          </div>
                        </div>
                        <a
                          href={post.mediaUrl}
                          download={post.mediaName || 'attachment'}
                          className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all"
                        >
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center gap-6">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                    {(post._count?.reactions || post.likes || 0).toLocaleString()} Reactions
                  </span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {(post._count?.comments || post.comments || 0).toLocaleString()} Comments
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Citizen & Staff Roster - Role Management Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Community Staff & Member Role Control</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assign members and staff with Administrator, Moderator, or Content Admin roles</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-black text-slate-900 uppercase tracking-widest">
              {members.length} Total Enrolled
            </span>
            <button
              onClick={() => {
                setIsAssignModalOpen(true);
                loadAllUsersForAssignment();
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>+</span>
              <span>Assign Staff / Enroll Member</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Citizen / Staff</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Identity</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Role</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.map((member) => (
                <tr key={member.id} className="group hover:bg-slate-50/50 transition-all duration-200">
                  <td className="whitespace-nowrap px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black text-xs border border-slate-200 group-hover:scale-110 transition-transform">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          member.name?.charAt(0) || '?'
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900">{member.name || 'Citizen'}</div>
                        <div className="text-[10px] font-bold text-slate-400">ID: {member.id?.substring(0, 12)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-8 py-6 text-sm font-bold text-slate-500 font-mono text-[10px]">
                    <div>{member.phoneNumber || 'N/A'}</div>
                    {member.googleEmail && <div className="text-[9px] text-slate-400">{member.googleEmail}</div>}
                  </td>
                  <td className="whitespace-nowrap px-8 py-6">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${getRoleBadgeColor(member.role)}`}>
                        {getRoleBadgeLabel(member.role)}
                      </span>
                      {/* Role Assignment Dropdown */}
                      <select
                        value={member.role || 'MEMBER'}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:border-slate-900 cursor-pointer hover:bg-white transition-all"
                      >
                        <option value="ADMIN">👑 Community Admin</option>
                        <option value="MODERATOR">🛡️ Moderation Staff</option>
                        <option value="CONTENT_ADMIN">📣 Content Admin</option>
                        <option value="MEMBER">👤 Member</option>
                      </select>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        member.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {member.status}
                      </span>
                      {member.isFlagged && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100">
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

      {/* Staff & Member Enrollment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-xl w-full p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Assign Community Staff & Roles</h3>
                <p className="text-xs font-bold text-slate-400">Select any platform user and grant them a specific role</p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* User Search Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search System User</label>
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Search by name, phone, email or ID..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            {/* User Selection List */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
              {filteredUsersForModal.length === 0 ? (
                <p className="text-xs font-bold text-slate-400 text-center py-6">No matching users found.</p>
              ) : (
                filteredUsersForModal.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                      selectedUserId === u.id ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-white text-slate-900'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black">{u.name || 'Unnamed User'}</p>
                      <p className={`text-[10px] ${selectedUserId === u.id ? 'text-slate-300' : 'text-slate-400'}`}>
                        {u.phoneNumber || u.googleEmail || u.id}
                      </p>
                    </div>
                    {selectedUserId === u.id && (
                      <span className="text-xs font-black px-2 py-0.5 bg-emerald-500 text-white rounded-full">Selected</span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assign Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
              >
                <option value="ADMIN">👑 Community Admin (Full Management)</option>
                <option value="MODERATOR">🛡️ Moderation Staff (Bans & Flags)</option>
                <option value="CONTENT_ADMIN">📣 Content Admin (Announcements & Media)</option>
                <option value="MEMBER">👤 Member (Standard Citizen)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignMemberSubmit}
                disabled={!selectedUserId || isAssigning}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
