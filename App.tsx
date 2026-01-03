import React, { useState, useEffect } from 'react';
import { SlideData } from './types';
import { uploadToCloudinary, setCloudConfig, getCloudConfig } from './services/cloudinaryService';
import { generateAnimeDetails, testGeminiConnection } from './services/geminiService';
import * as dataService from './services/dataService';
import { Input, TextArea } from './components/Input';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { 
  CloudArrowUpIcon, 
  ArrowDownTrayIcon, 
  ClipboardDocumentIcon, 
  SparklesIcon, 
  TrashIcon, 
  Cog6ToothIcon,
  HomeIcon,
  PlusIcon,
  LinkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';

const INITIAL_STATE: SlideData = {
  title: '',
  alternativeTitle: '',
  id: '',
  poster: '',
  posterType: 'image',
  rank: 1,
  type: 'TV',
  quality: 'HD',
  duration: '24m',
  aired: '',
  synopsis: '',
  keywords: [],
  episodes: { sub: 0, dub: 0, eps: 0 },
  publishedUrl: ''
};

type Tab = 'editor' | 'library';
type ConfigStatus = 'idle' | 'testing' | 'success' | 'error';
type View = 'home' | 'admin';

export default function App() {
  const [username, setUsername] = useState<string | null>(() => sessionStorage.getItem('hero_username'));
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [formData, setFormData] = useState<SlideData>(INITIAL_STATE);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [publishingSlideId, setPublishingSlideId] = useState<string | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [view, setView] = useState<View>('home');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cloudName, setCloudName] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [geminiStatus, setGeminiStatus] = useState<ConfigStatus>('idle');
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);

  useEffect(() => {
    if (username) {
      loadUserLibrary(username);
    } else {
      setIsLibraryLoading(false);
    }
  
    const config = getCloudConfig();
    if (config.cloudName && config.uploadPreset) {
      setCloudName(config.cloudName);
      setUploadPreset(config.uploadPreset);
      setIsConfigured(true);
      checkGemini(true);
    } else {
      setShowSettings(true);
    }
  }, [username]);

  const loadUserLibrary = async (user: string) => {
    setIsLibraryLoading(true);
    setStatusMsg('Loading Library...');
    const userSlides = await dataService.getUserLibrary(user);
    setSlides(userSlides);
    setStatusMsg('Library Loaded.');
    setView('home');
    setIsLibraryLoading(false);
    setTimeout(() => setStatusMsg(''), 2000);
  };
  
  const handleLogin = async (newUsername: string) => {
    sessionStorage.setItem('hero_username', newUsername);
    setUsername(newUsername);
  };

  const handleChangeUser = () => {
    sessionStorage.removeItem('hero_username');
    setUsername(null);
    setSlides([]);
  };

  const checkGemini = async (silent = false) => {
    if (!silent) setGeminiStatus('testing');
    const working = await testGeminiConnection();
    setGeminiStatus(working ? 'success' : 'error');
  };

  const saveSettings = () => {
    if (!cloudName || !uploadPreset) {
      alert("Configuration required.");
      return;
    }
    setCloudConfig(cloudName, uploadPreset);
    setIsConfigured(true);
    setShowSettings(false);
  };
  
  const copyUrlToClipboard = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    alert('URL Copied!');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...(prev as any)[parent], [child]: parseInt(value) || 0 } }));
    } else if (name === 'rank') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
    } else if (name === 'keywords') {
      setFormData(prev => ({ ...prev, keywords: [value] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLocalPreview(URL.createObjectURL(file));
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const response = await uploadToCloudinary(file, {}, (progress) => {
          setUploadProgress(progress);
        });
        setFormData(prev => ({
          ...prev,
          poster: response.secure_url,
          posterType: response.resource_type === 'video' ? 'video' : 'image'
        }));
        setStatusMsg('Media Uploaded');
      } catch (error) {
        alert('Upload failed: ' + error);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
        setTimeout(() => setStatusMsg(''), 2000);
      }
    }
  };

  const handleAutoFill = async () => {
    if (!formData.title) return alert("Enter title first");
    setIsAutoFilling(true);
    try {
      const details = await generateAnimeDetails(formData.title);
      setFormData(prev => ({
        ...prev, ...details,
        poster: prev.poster, posterType: prev.posterType,
        episodes: { ...prev.episodes, ...(details.episodes || {}) }
      }));
      setStatusMsg('AI Synced');
    } catch (error) {
      alert("AI Sync Error: " + (error as Error).message);
    } finally {
      setIsAutoFilling(false);
      setTimeout(() => setStatusMsg(''), 2000);
    }
  };

  const addOrUpdateSlide = async () => {
    if (!formData.title || !formData.poster || !formData.id || !username) {
        return alert("Title, Media, and Slug Identifier are required.");
    }
    
    setStatusMsg('Saving...');
    try {
        const isUpdating = slides.some(s => s.id === formData.id);
        let updatedSlides;

        if (isUpdating) {
            updatedSlides = slides.map(s => s.id === formData.id ? formData : s);
        } else {
            if (slides.some(s => s.id === formData.id)) {
                alert(`Error: A slide with slug "${formData.id}" already exists. Please change the title or slug.`);
                setStatusMsg('');
                return;
            }
            updatedSlides = [formData, ...slides];
        }

        updatedSlides.sort((a, b) => (a.rank || 0) - (b.rank || 0));

        await dataService.saveUserLibrary(username, updatedSlides);
        setSlides(updatedSlides);
        
        setStatusMsg(isUpdating ? 'Record Updated.' : 'Record Saved.');
        setFormData(INITIAL_STATE);
        setLocalPreview(null);
        if (window.innerWidth < 768) setActiveTab('library');

    } catch(error) {
        console.error("Save error:", error);
        setStatusMsg('Save Failed.');
    } finally {
        setTimeout(() => setStatusMsg(''), 2000);
    }
  };

  const deleteSlide = async (slideId: string) => {
      if (!username || !confirm('Erase Record? This is permanent.')) return;
      
      setStatusMsg('Deleting...');
      try {
          const updatedSlides = slides.filter(i => i.id !== slideId);
          await dataService.saveUserLibrary(username, updatedSlides);
          setSlides(updatedSlides);
          setStatusMsg('Record Deleted.');
      } catch(error) {
          console.error("Delete error: ", error);
          setStatusMsg('Delete failed.');
      } finally {
          setTimeout(() => setStatusMsg(''), 2000);
      }
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify({ success: true, data: { spotlight: slides } }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heroslides_${username}_backup.json`;
    a.click();
  };
  
  const publishSingleSlide = async (slideId: string) => {
    const slideToPublish = slides.find(s => s.id === slideId);
    if (!slideToPublish || !username) return;

    setPublishingSlideId(slideId);
    setStatusMsg(`Publishing ${slideId}...`);
    try {
      const jsonString = JSON.stringify({ success: true, data: { spotlight: [slideToPublish] } }, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], `${slideId}.json`, { type: 'application/json' });
      
      await uploadToCloudinary(file, {
        publicId: `hero_slide_data/${username}/${slideId}`
      });
      
      const config = getCloudConfig();
      const newUrl = `https://res.cloudinary.com/${config.cloudName}/raw/upload/hero_slide_data/${username}/${slideId}.json`;
      
      const updatedSlide = { ...slideToPublish, publishedUrl: newUrl };
      const updatedSlides = slides.map(s => s.id === slideId ? updatedSlide : s);
      await dataService.saveUserLibrary(username, updatedSlides);
      setSlides(updatedSlides);
      setStatusMsg('Published!');

    } catch (error) {
      alert(`Failed to publish ${slideId}.`);
    } finally {
      setPublishingSlideId(null);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  if (!username) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (!isConfigured || showSettings) {
    return (
      <div className="h-dvh w-screen bg-bg text-zinc-300 flex flex-col items-center justify-center p-6 z-50 fixed inset-0">
        <div className="w-full max-w-md bg-surface border border-accent/20 rounded-sm p-8 shadow-[0_0_50px_rgba(230,25,25,0.1)] overflow-y-auto max-h-screen">
          <h2 className="text-sm font-black text-white mb-8 flex items-center gap-3 tracking-widest uppercase">
            <Cog6ToothIcon className="w-5 h-5 text-accent" />
            System Console
          </h2>
          
          <div className="space-y-6">
             <div className="space-y-4">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Storage (Cloudinary)</div>
                <input 
                  value={cloudName}
                  onChange={e => setCloudName(e.target.value)}
                  className="w-full bg-input border border-border text-white px-4 py-3 rounded-sm text-xs outline-none focus:border-accent"
                  placeholder="Cloud Name"
                />
                <input 
                  value={uploadPreset}
                  onChange={e => setUploadPreset(e.target.value)}
                  className="w-full bg-input border border-border text-white px-4 py-3 rounded-sm text-xs outline-none focus:border-accent"
                  placeholder="Upload Preset"
                />
             </div>
             
             <div className="pt-6 border-t border-border">
                <div className="flex items-center justify-between bg-input border border-border rounded-sm p-4">
                   <div className="flex items-center gap-3">
                       <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${geminiStatus === 'success' ? 'bg-green-500 shadow-green-500/50' : geminiStatus === 'error' ? 'bg-accent shadow-accent/50' : 'bg-yellow-500 shadow-yellow-500/50'}`}></div>
                       <span className="text-[10px] font-bold text-zinc-500 uppercase">AI Processor</span>
                   </div>
                   <button onClick={() => checkGemini()} className="text-[10px] text-accent font-bold uppercase tracking-tighter hover:underline">
                     Re-Test
                   </button>
                </div>
             </div>
             
             {cloudName && (
                <div className="space-y-2 pt-4 border-t border-border">
                   <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Master Database</div>
                   <div className="flex items-center gap-2 bg-input border border-border p-2 rounded-sm">
                      <LinkIcon className="w-3 h-3 text-accent shrink-0 ml-1" />
                      <input 
                        readOnly 
                        value={`https://res.cloudinary.com/${cloudName}/raw/upload/userinfo.json`}
                        className="flex-1 bg-transparent text-zinc-500 text-[10px] font-mono outline-none" 
                      />
                      <button onClick={() => copyUrlToClipboard(`https://res.cloudinary.com/${cloudName}/raw/upload/userinfo.json`)} title="Copy DB URL" className="p-2 text-zinc-600 hover:text-white transition-colors">
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </button>
                  </div>
                </div>
             )}

             <button 
               onClick={saveSettings}
               className="w-full py-4 rounded-sm font-black text-xs uppercase tracking-widest transition-all bg-accent text-white hover:bg-red-700 shadow-[0_0_15px_rgba(230,25,25,0.2)]"
             >
               Apply Config
             </button>

             {isConfigured && (
               <button onClick={() => setShowSettings(false)} className="w-full py-2 text-zinc-600 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">
                 Exit Console
               </button>
             )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'home') {
    return (
      <HomePage 
        onNavigateToAdmin={() => setView('admin')}
      />
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-bg text-zinc-300 font-sans">
      <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-bg/80 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => setView('home')} className="text-zinc-500 hover:text-accent transition-colors">
            <HomeIcon className="w-5 h-5" />
          </button>
          <div className="h-4 w-px bg-border"></div>
          <div className='flex items-center gap-2'>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">User:</span>
            <span className="text-xs font-black uppercase tracking-wider text-accent">{username}</span>
          </div>
        </div>
        <div className="flex items-center gap-5">
          {statusMsg && <span className="text-[10px] text-accent font-bold uppercase tracking-widest animate-pulse">{statusMsg}</span>}
          <button onClick={() => setShowSettings(true)} className="text-zinc-500 hover:text-accent">
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
          <button onClick={downloadJSON} title="Download Library Backup" className="text-zinc-500 hover:text-white">
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
          <div className="h-4 w-px bg-border"></div>
          <button onClick={handleChangeUser} title="Change User" className="text-zinc-500 hover:text-accent">
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="md:hidden grid grid-cols-2 border-b border-border shrink-0">
        <button onClick={() => setActiveTab('editor')} className={`py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === 'editor' ? 'text-accent border-b-2 border-accent' : 'text-zinc-600'}`}>Editor</button>
        <button onClick={() => setActiveTab('library')} className={`py-4 text-[10px] font-black uppercase tracking-widest ${activeTab === 'library' ? 'text-accent border-b-2 border-accent' : 'text-zinc-600'}`}>Library ({slides.length})</button>
      </div>

      <div className="flex-1 overflow-hidden flex relative">
        {(isLibraryLoading && !slides.length) && (
            <div className="absolute inset-0 bg-bg/90 backdrop-blur-sm flex items-center justify-center z-30">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Connecting...</span>
                </div>
            </div>
        )}
        <div className={`w-full md:w-[450px] flex flex-col overflow-y-auto ${activeTab === 'editor' ? 'block' : 'hidden md:flex'} border-r border-border pb-10`}>
          <div className="p-6 flex flex-col gap-6">
            <div className="w-full aspect-video bg-input rounded-sm overflow-hidden border border-border relative flex items-center justify-center group shadow-inner">
              {(localPreview || formData.poster) ? (
                formData.posterType === 'video' || (localPreview && !formData.poster && localPreview.startsWith('blob')) ? 
                  <video src={localPreview || formData.poster} className="w-full h-full object-cover" autoPlay muted loop /> :
                  <img src={localPreview || formData.poster} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                   <CloudArrowUpIcon className="w-8 h-8 text-zinc-800" />
                   <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">No Media Asset</span>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-20">
                  <div className="w-full max-w-xs">
                      <div className="text-[10px] font-black text-accent tracking-[0.2em] uppercase mb-3">
                          Uploading... {uploadProgress !== null ? `${uploadProgress}%` : ''}
                      </div>
                      <div className="w-full bg-accent/20 h-1 rounded-full overflow-hidden">
                          <div 
                              className="bg-accent h-1 rounded-full transition-all duration-300 ease-linear" 
                              style={{ width: `${uploadProgress || 0}%` }}
                          ></div>
                      </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex gap-3 mb-6">
                <div className="flex-1">
                   <label className="text-zinc-600 text-[10px] font-black uppercase tracking-widest pl-1 block mb-2">Subject Title</label>
                   <input className="w-full bg-input border border-border text-white px-4 py-4 rounded-sm text-sm focus:border-accent focus:outline-none placeholder-zinc-800 font-medium"
                    placeholder="Enter Title..." name="title" value={formData.title} onChange={handleInputChange} 
                   />
                </div>
                <button onClick={handleAutoFill} disabled={isAutoFilling} className="mt-7 w-14 h-14 bg-accent/5 border border-accent/20 rounded-sm flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all shrink-0 shadow-[0_0_10px_rgba(230,25,25,0.05)]">
                   {isAutoFilling ? <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Slug Identifier" name="id" value={formData.id} onChange={handleInputChange} placeholder="Auto-generated if empty" />
                <Input label="Ranking" type="number" name="rank" value={formData.rank} onChange={handleInputChange} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Format Type" name="type" value={formData.type} onChange={handleInputChange} />
                <Input label="Visual Grade" name="quality" value={formData.quality} onChange={handleInputChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Primary Tag" name="keywords" value={formData.keywords[0] || ''} onChange={handleInputChange} />
                <Input label="Run Time" name="duration" value={formData.duration} onChange={handleInputChange} />
              </div>

              <div className="mb-6">
                <label className="text-zinc-600 text-[10px] font-black uppercase tracking-widest pl-1 mb-2 block">Data Nodes (Sub / Dub / Tot)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" name="episodes.sub" value={formData.episodes.sub} onChange={handleInputChange} className="bg-input border border-border text-white px-4 py-4 rounded-sm text-xs focus:border-accent outline-none text-center font-bold" />
                  <input type="number" name="episodes.dub" value={formData.episodes.dub} onChange={handleInputChange} className="bg-input border border-border text-white px-4 py-4 rounded-sm text-xs focus:border-accent outline-none text-center font-bold" />
                  <input type="number" name="episodes.eps" value={formData.episodes.eps} onChange={handleInputChange} className="bg-input border border-border text-white px-4 py-4 rounded-sm text-xs focus:border-accent outline-none text-center font-bold" />
                </div>
              </div>

              <TextArea label="Briefing / Synopsis" name="synopsis" value={formData.synopsis} onChange={handleInputChange} />
              
              <div className="flex gap-3 mt-4">
                 <label className="flex-1 bg-input border border-border text-center py-4 rounded-sm text-[10px] font-black uppercase tracking-widest cursor-pointer hover:border-accent hover:text-accent transition-all text-zinc-600">
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
                    Upload Media
                 </label>
                 <button onClick={addOrUpdateSlide} className="flex-1 bg-accent text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-[0_0_15px_rgba(230,25,25,0.2)]">
                    Save Record
                 </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto bg-surface p-6 ${activeTab === 'library' ? 'block' : 'hidden md:block'}`}>
           <div className="grid gap-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Global Asset Library</div>
                <div className="text-[10px] font-black text-accent uppercase tracking-widest">{slides.length} Units Active</div>
              </div>
              {slides.map(slide => (
                <div key={slide.id} className="p-4 bg-bg border border-border rounded-sm group transition-all space-y-4">
                   <div className="flex gap-5 items-center">
                      <div className="w-24 h-14 bg-input rounded-sm overflow-hidden shrink-0 relative border border-border group-hover:border-accent/30 cursor-pointer" onClick={() => { setFormData(slide); setLocalPreview(null); setActiveTab('editor'); }}>
                         {slide.posterType === 'video' ? <video src={slide.poster} className="w-full h-full object-cover" /> : <img src={slide.poster} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setFormData(slide); setLocalPreview(null); setActiveTab('editor'); }}>
                         <h4 className="text-white text-xs font-black uppercase tracking-wider truncate group-hover:text-accent transition-colors">{slide.title}</h4>
                         <p className="text-zinc-600 text-[10px] font-mono tracking-tighter mt-1">{slide.id} | RANK #{slide.rank}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }} className="p-3 text-zinc-700 hover:text-accent transition-colors">
                         <TrashIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => publishSingleSlide(slide.id)} disabled={publishingSlideId === slide.id} className="p-3 text-zinc-700 hover:text-accent disabled:opacity-30 transition-colors">
                        {publishingSlideId === slide.id ? <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" /> : <CloudArrowUpIcon className="w-4 h-4" />}
                      </button>
                   </div>
                   {slide.publishedUrl && (
                    <div className="flex items-center gap-2 bg-input border border-border p-2 rounded-sm">
                        <LinkIcon className="w-3 h-3 text-accent shrink-0 ml-1" />
                        <input 
                          readOnly 
                          value={slide.publishedUrl} 
                          className="flex-1 bg-transparent text-zinc-500 text-[10px] font-mono outline-none" 
                        />
                        <button onClick={() => copyUrlToClipboard(slide.publishedUrl)} title="Copy Direct URL" className="p-2 text-zinc-600 hover:text-white transition-colors">
                          <ClipboardDocumentIcon className="w-4 h-4" />
                        </button>
                    </div>
                   )}
                </div>
              ))}
              {slides.length === 0 && !isLibraryLoading && (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-sm">
                   <PlusIcon className="w-8 h-8 text-zinc-800 mb-2" />
                   <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest">Library Empty</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}