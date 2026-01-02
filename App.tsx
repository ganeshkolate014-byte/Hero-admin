import React, { useState, useEffect, useCallback } from 'react';
import { SlideData, HeroSlidesJSON } from './types';
import { uploadToCloudinary, setCloudConfig, getCloudConfig } from './services/cloudinaryService';
import { generateAnimeDetails, testGeminiConnection } from './services/geminiService';
import { Input, TextArea } from './components/Input';
import { 
  CloudArrowUpIcon, 
  ArrowDownTrayIcon, 
  ClipboardDocumentIcon, 
  SparklesIcon, 
  TrashIcon, 
  PlusIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  GlobeAltIcon,
  KeyIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid';

const INITIAL_STATE: SlideData = {
  title: '',
  alternativeTitle: '',
  id: '',
  poster: '',
  posterType: 'image',
  logo: '',
  rank: 1,
  type: 'TV',
  quality: 'HD',
  duration: '24m',
  aired: '',
  synopsis: '',
  keywords: [],
  episodes: { sub: 0, dub: 0, eps: 0 }
};

type Tab = 'editor' | 'library';
type ConfigStatus = 'idle' | 'testing' | 'success' | 'error';


// Simple component to render raw JSON, mimicking a real API response
const JsonResponse = ({ data }: { data: any }) => {
  useEffect(() => {
    document.body.style.backgroundColor = '#ffffff'; // Use a standard document background
    return () => {
      document.body.style.backgroundColor = '#000000'; // Reset on unmount
    }
  }, []);
  
  return (
    <pre style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap', color: '#111', padding: '10px', fontFamily: 'monospace', fontSize: '13px' }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};


export default function App() {
  // --- ROUTING LOGIC FOR JSON OUTPUT ---
  const path = window.location.pathname;
  if (path.startsWith('/heroslide')) {
    const slides: SlideData[] = JSON.parse(localStorage.getItem('hero_slides') || '[]');
    let responseData: any = { error: 'Not Found' };

    const cleanPath = path.replace(/\/$/, '');
    const parts = cleanPath.split('/');
    const requestedId = parts[parts.length - 1];

    if (requestedId === 'heroslide') {
       responseData = { success: true, data: { spotlight: slides } };
    } else {
       const slide = slides.find(s => s.id === requestedId);
       if (slide) {
         responseData = slide;
       }
    }
    
    // Render the special JSON component instead of the main app
    return <JsonResponse data={responseData} />;
  }
  // -------------------------------------

  // Main App State
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [formData, setFormData] = useState<SlideData>(INITIAL_STATE);
  const [isUploading, setIsUploading] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('editor');

  // Config State
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cloudName, setCloudName] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [geminiStatus, setGeminiStatus] = useState<ConfigStatus>('idle');
  
  // Endpoint Config
  const [targetEndpoint, setTargetEndpoint] = useState('');
  const [endpointKey, setEndpointKey] = useState('');
  const [endpointStatus, setEndpointStatus] = useState<ConfigStatus>('idle');

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem('hero_slides');
    if (saved) {
      try { setSlides(JSON.parse(saved)); } catch (e) {}
    }
    
    // Check Config
    const config = getCloudConfig();
    const savedEndpoint = localStorage.getItem('hero_endpoint') || '';
    const savedKey = localStorage.getItem('hero_endpoint_key') || '';

    if (config.cloudName && config.uploadPreset) {
       setCloudName(config.cloudName);
       setUploadPreset(config.uploadPreset);
       setTargetEndpoint(savedEndpoint);
       setEndpointKey(savedKey);
       
       checkGemini(true);
       if (savedEndpoint) checkEndpoint(savedEndpoint, savedKey, true);
    } else {
       setShowSettings(true);
    }
  }, []);

  const checkGemini = async (silent = false) => {
    if (!silent) setGeminiStatus('testing');
    const working = await testGeminiConnection();
    if (working) {
      setGeminiStatus('success');
      setIsConfigured(true);
    } else {
      setGeminiStatus('error');
      if (!silent) setIsConfigured(false);
    }
  };

  const checkEndpoint = async (url: string, key: string, silent = false) => {
    if (!url) return;
    if (!silent) setEndpointStatus('testing');
    
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: key ? { 'x-api-key': key, 'Authorization': `Bearer ${key}` } : {}
      });
      
      if (res.ok || res.status === 404) {
        setEndpointStatus('success');
      } else {
        throw new Error(res.statusText);
      }
    } catch (e) {
      setEndpointStatus('error');
    }
  };

  const saveSettings = () => {
    if (!cloudName || !uploadPreset) {
      alert("Cloudinary configuration is required.");
      return;
    }
    
    if (targetEndpoint && endpointStatus === 'error') {
       if(!confirm("Endpoint check failed. Save anyway?")) return;
    }

    setCloudConfig(cloudName, uploadPreset);
    localStorage.setItem('hero_endpoint', targetEndpoint);
    localStorage.setItem('hero_endpoint_key', endpointKey);

    if (geminiStatus === 'success') {
      setIsConfigured(true);
      setShowSettings(false);
    } else {
      alert("Please ensure Gemini API Key is working.");
    }
  };

  useEffect(() => {
    localStorage.setItem('hero_slides', JSON.stringify(slides));
  }, [slides]);

  // Handlers
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
      try {
        const response = await uploadToCloudinary(file);
        setFormData(prev => ({
          ...prev,
          poster: response.secure_url,
          posterType: response.resource_type === 'video' ? 'video' : 'image'
        }));
        setStatusMsg('Uploaded');
      } catch (error) {
        alert('Upload failed: ' + error);
      } finally {
        setIsUploading(false);
        setTimeout(() => setStatusMsg(''), 2000);
      }
    }
  };

  const handleAutoFill = async () => {
    if (!formData.title) return alert("Enter title");
    setIsAutoFilling(true);
    try {
      const details = await generateAnimeDetails(formData.title);
      setFormData(prev => ({
        ...prev, ...details,
        poster: prev.poster, posterType: prev.posterType,
        episodes: { ...prev.episodes, ...(details.episodes || {}) }
      }));
      setStatusMsg('Filled');
    } catch (error) {
      alert("AI Failed");
    } finally {
      setIsAutoFilling(false);
      setTimeout(() => setStatusMsg(''), 2000);
    }
  };

  const addSlide = () => {
    if (!formData.title || !formData.poster) return alert("Title & Poster required");
    const index = slides.findIndex(s => s.id === formData.id);
    if (index >= 0) {
      const newSlides = [...slides];
      newSlides[index] = formData;
      setSlides(newSlides);
    } else {
      setSlides(prev => [formData, ...prev]);
    }
    setFormData(INITIAL_STATE);
    setLocalPreview(null);
    setStatusMsg('Saved');
    setTimeout(() => setStatusMsg(''), 2000);
    if (window.innerWidth < 768) setActiveTab('library');
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify({ success: true, data: { spotlight: slides } }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'heroslides.json';
    a.click();
  };
  
  const pushToEndpoint = async () => {
    if (!targetEndpoint) return alert("No endpoint configured in settings.");
    
    setStatusMsg('Pushing...');
    try {
        const res = await fetch(targetEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(endpointKey ? { 'x-api-key': endpointKey, 'Authorization': `Bearer ${endpointKey}` } : {})
            },
            body: JSON.stringify({ spotlight: slides })
        });
        if (res.ok) setStatusMsg('Synced');
        else throw new Error(res.statusText);
    } catch (e) {
        alert("Sync failed");
        setStatusMsg('Error');
    }
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Render Setup Screen
  if (!isConfigured || showSettings) {
    return (
      <div className="h-dvh w-screen bg-bg text-zinc-300 flex flex-col items-center justify-center p-6 z-50 fixed inset-0">
        <div className="w-full max-w-sm bg-surface border border-border rounded-xl p-6 shadow-2xl overflow-y-auto max-h-full">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Cog6ToothIcon className="w-6 h-6 text-zinc-400" />
            System Config
          </h2>
          
          <div className="space-y-5">
             <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase">
                    <CloudArrowUpIcon className="w-4 h-4" />
                    Cloudinary (Required)
                </div>
                <input 
                  value={cloudName}
                  onChange={e => setCloudName(e.target.value)}
                  className="w-full bg-input border border-border text-white px-3 py-2 rounded-lg text-sm focus:border-white outline-none placeholder-zinc-700"
                  placeholder="Cloud Name"
                />
                <input 
                  value={uploadPreset}
                  onChange={e => setUploadPreset(e.target.value)}
                  className="w-full bg-input border border-border text-white px-3 py-2 rounded-lg text-sm focus:border-white outline-none placeholder-zinc-700"
                  placeholder="Upload Preset"
                />
             </div>

             <div className="space-y-3 pt-2 border-t border-zinc-900">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase">
                    <GlobeAltIcon className="w-4 h-4" />
                    Target API (Optional)
                </div>
                <div className="flex gap-2">
                    <input 
                      value={targetEndpoint}
                      onChange={e => setTargetEndpoint(e.target.value)}
                      className="flex-1 bg-input border border-border text-white px-3 py-2 rounded-lg text-sm focus:border-white outline-none placeholder-zinc-700"
                      placeholder="https://api.site.com/hero"
                    />
                    <button 
                        onClick={() => checkEndpoint(targetEndpoint, endpointKey)} 
                        className={`px-3 rounded-lg border border-border transition-colors ${endpointStatus === 'success' ? 'text-green-500 border-green-900 bg-green-900/10' : endpointStatus === 'error' ? 'text-red-500 border-red-900' : 'text-zinc-500 hover:text-white'}`}
                    >
                        {endpointStatus === 'testing' ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"/> : <ArrowPathIcon className="w-4 h-4" />}
                    </button>
                </div>
                <div className="relative">
                    <KeyIcon className="w-4 h-4 absolute left-3 top-2.5 text-zinc-600" />
                    <input 
                      value={endpointKey}
                      type="password"
                      onChange={e => setEndpointKey(e.target.value)}
                      className="w-full bg-input border border-border text-white pl-9 pr-3 py-2 rounded-lg text-sm focus:border-white outline-none placeholder-zinc-700"
                      placeholder="API Access Key"
                    />
                </div>
             </div>

             <div className="pt-2 border-t border-zinc-900">
                <div className="flex items-center justify-between bg-input border border-border rounded-lg p-3">
                   <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${geminiStatus === 'success' ? 'bg-green-500' : geminiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                       <span className="text-xs font-medium text-zinc-400">Gemini AI</span>
                   </div>
                   <button onClick={() => checkGemini()} className="text-xs text-zinc-500 hover:text-white underline">
                     Retry
                   </button>
                </div>
             </div>

             <button 
               onClick={saveSettings}
               className={`w-full py-3 rounded-lg font-bold text-sm mt-2 transition-colors ${
                 (cloudName && uploadPreset && geminiStatus === 'success') 
                 ? 'bg-white text-black hover:bg-zinc-200' 
                 : 'bg-zinc-800 text-zinc-500'
               }`}
             >
               {isConfigured ? 'Save Changes' : 'Initialize App'}
             </button>

             {isConfigured && (
               <button onClick={() => setShowSettings(false)} className="w-full py-2 text-zinc-500 text-xs hover:text-white">
                 Close Settings
               </button>
             )}
          </div>
        </div>
      </div>
    );
  }

  // Main App
  return (
    <div className="flex flex-col h-dvh bg-bg text-zinc-300 font-sans">
      
      <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-bg z-20 shrink-0">
        <h1 className="font-bold text-white text-lg tracking-tight">Admin</h1>
        <div className="flex items-center gap-3">
          {statusMsg && <span className="text-xs text-green-500 font-mono">{statusMsg}</span>}
          {targetEndpoint && (
            <button onClick={pushToEndpoint} className="text-zinc-400 hover:text-green-400" title="Sync to Endpoint">
               <GlobeAltIcon className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setShowSettings(true)} className="text-zinc-400 hover:text-white">
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
          <button onClick={downloadJSON} className="text-white hover:text-primary transition-colors">
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="md:hidden grid grid-cols-2 border-b border-border shrink-0">
        <button 
          onClick={() => setActiveTab('editor')} 
          className={`py-3 text-xs font-semibold uppercase tracking-wide ${activeTab === 'editor' ? 'text-white border-b-2 border-white' : 'text-zinc-600'}`}
        >
          Editor
        </button>
        <button 
          onClick={() => setActiveTab('library')} 
          className={`py-3 text-xs font-semibold uppercase tracking-wide ${activeTab === 'library' ? 'text-white border-b-2 border-white' : 'text-zinc-600'}`}
        >
          Library ({slides.length})
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex relative">
        
        <div className={`w-full md:w-[400px] flex flex-col overflow-y-auto ${activeTab === 'editor' ? 'block' : 'hidden md:flex'} border-r border-border pb-10`}>
          <div className="p-4 flex flex-col gap-4">
            
            <div className="w-full aspect-video bg-input rounded-lg overflow-hidden border border-border relative flex items-center justify-center group">
              {(localPreview || formData.poster) ? (
                formData.posterType === 'video' || (localPreview && !formData.poster && localPreview.startsWith('blob')) ? 
                  <video src={localPreview || formData.poster} className="w-full h-full object-cover" autoPlay muted loop /> :
                  <img src={localPreview || formData.poster} className="w-full h-full object-cover" alt="" />
              ) : (
                <span className="text-xs text-zinc-600">No Media</span>
              )}
              {formData.logo && (
                 <img src={formData.logo} className="absolute bottom-4 right-4 h-1/3 object-contain drop-shadow-lg z-10" alt="logo" />
              )}
              {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-white z-20">Uploading...</div>}
            </div>

            <div>
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                   <label className="text-zinc-500 text-xs font-medium pl-1 block mb-1.5">Title</label>
                   <input className="w-full bg-input border border-border text-white px-3 py-3 rounded-lg text-sm focus:border-white focus:outline-none placeholder-zinc-700"
                    placeholder="Anime Name" name="title" value={formData.title} onChange={handleInputChange} 
                   />
                </div>
                <button onClick={handleAutoFill} disabled={isAutoFilling} className="mt-6 w-12 h-11 bg-input border border-border rounded-lg flex items-center justify-center text-zinc-400 hover:text-white shrink-0">
                   {isAutoFilling ? "..." : <SparklesIcon className="w-5 h-5" />}
                </button>
              </div>

              <Input label="Slug / ID" name="id" value={formData.id} onChange={handleInputChange} />
              
              <Input label="Logo / Cover URL" name="logo" value={formData.logo || ''} onChange={handleInputChange} placeholder="https://..." />
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Rank" type="number" name="rank" value={formData.rank} onChange={handleInputChange} />
                <Input label="Type" name="type" value={formData.type} onChange={handleInputChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Quality" name="quality" value={formData.quality} onChange={handleInputChange} />
                <Input label="Keyword" name="keywords" value={formData.keywords[0] || ''} onChange={handleInputChange} />
              </div>

              <div className="mb-4">
                <label className="text-zinc-500 text-xs font-medium pl-1 mb-1.5 block">Episodes (Sub / Dub / Total)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" placeholder="Sub" name="episodes.sub" value={formData.episodes.sub} onChange={handleInputChange} className="bg-input border border-border text-white px-3 py-3 rounded-lg text-sm focus:border-white outline-none text-center" />
                  <input type="number" placeholder="Dub" name="episodes.dub" value={formData.episodes.dub} onChange={handleInputChange} className="bg-input border border-border text-white px-3 py-3 rounded-lg text-sm focus:border-white outline-none text-center" />
                  <input type="number" placeholder="Total" name="episodes.eps" value={formData.episodes.eps} onChange={handleInputChange} className="bg-input border border-border text-white px-3 py-3 rounded-lg text-sm focus:border-white outline-none text-center" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Duration" name="duration" value={formData.duration} onChange={handleInputChange} />
                <Input label="Aired" name="aired" value={formData.aired} onChange={handleInputChange} />
              </div>

              <TextArea label="Synopsis" name="synopsis" value={formData.synopsis} onChange={handleInputChange} />
              
              <div className="flex gap-2 mt-2">
                 <label className="flex-1 bg-input border border-border text-center py-3 rounded-lg text-sm cursor-pointer hover:bg-zinc-900 text-zinc-400">
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
                    {isUploading ? "Uploading..." : "Upload Media"}
                 </label>
                 <button onClick={addSlide} className="flex-1 bg-white text-black py-3 rounded-lg font-bold text-sm">
                    Save
                 </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto bg-surface p-4 ${activeTab === 'library' ? 'block' : 'hidden md:block'}`}>
           <div className="grid gap-3">
              {slides.map(slide => (
                <div key={slide.id} onClick={() => { setFormData(slide); setLocalPreview(null); setActiveTab('editor'); }} className="flex gap-3 p-3 bg-bg border border-border rounded-lg items-center cursor-pointer hover:border-zinc-700">
                   <div className="w-16 h-10 bg-input rounded overflow-hidden shrink-0 relative">
                      {slide.posterType === 'video' ? <video src={slide.poster} className="w-full h-full object-cover" /> : <img src={slide.poster} className="w-full h-full object-cover" />}
                      {slide.logo && <img src={slide.logo} className="absolute bottom-0.5 right-0.5 h-1/3 object-contain drop-shadow-lg" />}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm font-medium truncate">{slide.title}</h4>
                      <p className="text-zinc-500 text-xs">{slide.id}</p>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) setSlides(s => s.filter(i => i.id !== slide.id)); }} className="p-2 text-zinc-600 hover:text-red-500">
                      <TrashIcon className="w-4 h-4" />
                   </button>
                </div>
              ))}
              {slides.length === 0 && <div className="text-center text-zinc-600 text-sm mt-10">No slides yet.</div>}
           </div>
        </div>

      </div>
    </div>
  );
}