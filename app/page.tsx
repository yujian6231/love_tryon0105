'use client';

import { useState, useRef, useEffect } from 'react';

// 定义图片生成配置
const imageGenerations = [
  { title: "Frontal", view: "full frontal view" },
  { title: "Profile", view: "side profile view" },
  { title: "Low Angle", view: "dramatic low angle shot" },
  { title: "High Angle", view: "chic high angle from above" },
  { title: "Details", view: "high-fashion torso close-up" }
];

export default function Home() {
  const [uploadedItems, setUploadedItems] = useState<(string | null)[]>([null, null, null, null]);
  const [generatedImages, setGeneratedImages] = useState<{[key: string]: string}>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('READY');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [activePage, setActivePage] = useState('studio');

  // 更新上传状态显示
  useEffect(() => {
    const count = uploadedItems.filter(item => item !== null).length;
    const generateButton = document.getElementById('generate-button') as HTMLButtonElement;
    const buttonText = document.getElementById('button-text') as HTMLElement;
    
    if (count > 0) {
      generateButton?.removeAttribute('disabled');
      if(buttonText) buttonText.textContent = 'Generate Look';
    } else {
      generateButton?.setAttribute('disabled', 'true');
      if(buttonText) buttonText.textContent = 'Select Items';
    }
  }, [uploadedItems]);

  const handleFileChange = (index: number) => {
    const fileInput = fileInputRefs.current[index];
    if (!fileInput) return;

    const file = fileInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        setUploadedItems(prev => {
          const newItems = [...prev];
          newItems[index] = base64Data;
          return newItems;
        });
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedItems(prev => {
        const newItems = [...prev];
        newItems[index] = null;
        return newItems;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const uploadBox = document.getElementById(`upload-box-${index}`);
    if (uploadBox) {
      uploadBox.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e: React.DragEvent, index: number) => {
    const uploadBox = document.getElementById(`upload-box-${index}`);
    if (uploadBox) {
      uploadBox.classList.remove('drag-over');
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    const uploadBox = document.getElementById(`upload-box-${index}`);
    if (uploadBox) {
      uploadBox.classList.remove('drag-over');
    }
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fileInput = fileInputRefs.current[index];
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        handleFileChange(index);
      }
    }
  };

  const handleGenerateLook = async () => {
    const uploadedBase64Images = uploadedItems.filter(item => item !== null) as string[];
    const uploadedCount = uploadedBase64Images.length;

    if (uploadedCount === 0) {
      setStatus("Please upload at least one image before generating.");
      return;
    }

    // 初始化生成过程
    setGeneratedImages({});
    setCurrentSessionId(Date.now());
    setIsGenerating(true);
    setProgress(0);
    
    const statusContainer = document.getElementById('status-container');
    if (statusContainer) statusContainer.classList.remove('opacity-0');

    // 逐个生成图像
    for (let i = 0; i < imageGenerations.length; i++) {
      const item = imageGenerations[i];
      setStatus(`Developing: ${item.title}`);
      setProgress(Math.floor((i / imageGenerations.length) * 100));
      
      try {
        // 构建明确要求模型执行虚拟试穿的 Prompt
        const prompt = `Professional model wearing uploaded clothes, minimalist style, white background, ${item.view}`;
        
        // 调用后端 API
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            images: uploadedBase64Images
          }),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();
        
        // 立即更新状态中的图片
        setGeneratedImages(prev => {
          const newImages = { ...prev };
          newImages[`res-${i}`] = result.generatedImage;
          return newImages;
        });
      } catch (error) {
        console.error(`Error generating ${item.title}:`, error);
        setStatus(`Error generating ${item.title}`);
      }
    }

    setProgress(100);
    setStatus("Finished");
    
    // 启用下载按钮
    const downloadBtn = document.getElementById('download-all-btn');
    if (downloadBtn) downloadBtn.classList.remove('hidden');
    
    setIsGenerating(false);
    setTimeout(() => {
      const statusContainer = document.getElementById('status-container');
      if (statusContainer) statusContainer.classList.add('opacity-0');
    }, 2500);
  };

  const openModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const createPlaceholder = (title: string, id: string) => {
    const div = document.createElement('div');
    div.className = 'image-card group relative';
    div.innerHTML = `<div id="${id}" class="w-full aspect-2by3 bg-gray-100 flex flex-col items-center justify-center border border-gray-300 text-gray-400"><svg className="w-8 h-8 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 18m-4-2h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-xs">LOADING...</span></div><div class="mt-3 flex justify-between px-1"><span class="text-[9px] tracking-widest font-bold uppercase">${title}</span></div>`;
    return div;
  };

  return (
    <div id="app" className="max-w-7xl mx-auto border-t border-gray-200">
      {/* 顶部导航栏 */}
      <header className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-center text-sm font-medium">
          <div className="flex space-x-8 uppercase">
            <a href="javascript:void(0)" className="text-black tracking-[0.2em] text-xl font-bold italic">VIRTUAL ATELIER</a>
          </div>
          <div className="flex space-x-8 text-gray-400">
            <button 
              onClick={() => setActivePage('studio')}
              className={`${activePage === 'studio' ? 'text-black border-b-2 border-black pb-1 transition-all' : 'hover:text-black transition-all'} text-sm font-medium`}
            >
              STUDIO
            </button>
            <button 
              onClick={() => setActivePage('archive')}
              className={`${activePage === 'archive' ? 'text-black border-b-2 border-black pb-1 transition-all' : 'hover:text-black transition-all'} text-sm font-medium`}
            >
              ARCHIVE
            </button>
            <button className="hover:text-black transition-colors cursor-not-allowed uppercase">Collections</button>
          </div>
          <div className="flex items-center space-x-5">
            <button className="hover:opacity-60 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
            <button className="hover:opacity-60 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* STUDIO 页面 */}
      <main id="page-studio" className={`${activePage === 'studio' ? 'page-transition flex flex-col lg:flex-row min-h-[calc(100vh-65px)]' : 'hidden-page'}`}>
        <div className="lg:w-1/2 p-8 lg:p-12 border-r border-gray-100 bg-[#fafafa]">
          <div className="max-w-md mx-auto">
            <h2 className="text-sm tracking-[0.3em] font-bold mb-1 text-gray-400 uppercase">Step 01</h2>
            <h1 className="text-2xl font-bold mb-8 italic">Upload Your Wardrobe</h1>
            <div id="upload-grid" className="grid grid-cols-2 gap-6">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="upload-slot group">
                  <input 
                    type="file" 
                    ref={el => fileInputRefs.current[index] = el}
                    className="hidden" 
                    id={`file-input-${index}`} 
                    data-index={index}
                    accept="image/*" 
                    onChange={() => handleFileChange(index)}
                  />
                  <div 
                    className="dashed-upload-box w-full aspect-square bg-white flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:shadow-sm group-hover:scale-110 duration-300 z-20" 
                    id={`upload-box-${index}`} 
                    onClick={() => fileInputRefs.current[index]?.click()}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={(e) => handleDragLeave(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="transition-transform group-hover:scale-110 duration-300 flex flex-col items-center z-20" id={`icon-container-${index}`}>
                      <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      <p className="text-[10px] tracking-widest uppercase">Select Item</p>
                    </div>
                    {uploadedItems[index] && (
                      <img 
                        id={`preview-${index}`} 
                        className="upload-preview" 
                        src={uploadedItems[index] || ''} 
                        alt="Preview"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12">
              <button 
                id="generate-button" 
                className="w-full h-14 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-zinc-800 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center" 
                onClick={handleGenerateLook}
                disabled={uploadedItems.filter(item => item !== null).length === 0 || isGenerating}
              >
                {isGenerating && (
                  <svg id="loading-spinner-btn" className="animate-spin h-4 w-4 text-white mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span id="button-text">Select Items</span>
              </button>
            </div>
          </div>
        </div>
        <div className="lg:w-1/2 p-8 lg:p-12 bg-white">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-sm tracking-[0.3em] font-bold mb-1 text-gray-400 uppercase">Step 02</h2>
                <h1 className="text-2xl font-bold italic">A.I. Lookbook</h1>
              </div>
              <button 
                id="download-all-btn" 
                className="hidden text-[10px] tracking-widest font-bold uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-all"
              >
                Save Full Lookbook
              </button>
            </div>
            <div id="results-grid" className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-12">
              {imageGenerations.map((item, idx) => {
                const imageId = `res-${idx}`;
                const hasImage = generatedImages[imageId] !== undefined;
                
                return (
                  <div key={imageId} className="image-card group relative">
                    <div 
                      className={`w-full aspect-2by3 ${
                        hasImage 
                          ? 'bg-transparent' 
                          : isGenerating // 只有在生成过程中才显示loading
                            ? 'bg-gray-100 flex flex-col items-center justify-center border border-gray-300 text-gray-400'
                            : 'hidden' // 未生成时隐藏
                      }`}
                      id={imageId}
                    >
                      {hasImage ? (
                        <img 
                          src={generatedImages[imageId]} 
                          className="w-full h-full object-cover cursor-zoom-in transition-transform duration-700 hover:scale-110" 
                          onClick={() => openModal(generatedImages[imageId])}
                        />
                      ) : isGenerating ? ( // 只有在生成过程中才显示loading
                        <>
                          <svg className="w-8 h-8 mb-2 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 18m-4-2h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-xs">LOADING...</span>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-3 flex justify-between px-1">
                      <span className="text-[9px] tracking-widest font-bold uppercase">{item.title}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div id="status-container" className={`${isGenerating ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
              <div className="flex justify-between items-end mb-2">
                <p id="generating-status" className="text-[10px] font-bold tracking-widest uppercase text-black">{status}</p>
                <p id="progress-percent" className="text-[10px] font-mono text-gray-400">{Math.floor(progress)}%</p>
              </div>
              <div className="w-full bg-gray-100 h-[1px]">
                <div id="progress-bar" className="bg-black h-[1px] transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ARCHIVE 页面 */}
      <main id="page-archive" className={`${activePage === 'archive' ? 'page-transition p-8 lg:p-12 min-h-[calc(100vh-65px)]' : 'hidden-page'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-baseline mb-12 border-b border-gray-100 pb-8">
            <h1 className="text-3xl font-bold italic">Archive History</h1>
            <div className="flex items-center space-x-4">
              <button className="text-[9px] tracking-widest text-red-400 uppercase hover:underline">Clear All</button>
              <p className="text-[10px] tracking-widest text-gray-400 uppercase font-mono">IDB STORAGE</p>
            </div>
          </div>
          <div id="archive-list" className="space-y-16">
            <div className="text-center py-20 text-gray-300 italic tracking-widest uppercase">Initializing Database...</div>
          </div>
        </div>
      </main>

      {/* 模态框 */}
      <div 
        id="image-modal" 
        className={`${selectedImage ? 'fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center p-6 z-50 cursor-zoom-out' : 'hidden'}`} 
        onClick={closeModal}
      >
        <div className="max-w-3xl w-full flex flex-col items-center modal-animate" onClick={e => e.stopPropagation()}>
          <img 
            id="modal-image" 
            src={selectedImage || ''} 
            alt="Zoomed" 
            className="max-h-[80vh] w-auto shadow-2xl rounded-sm"
          />
          <button 
            className="mt-8 text-[10px] tracking-[0.4em] uppercase font-bold border-b border-black pb-1 hover:opacity-50 transition" 
            onClick={closeModal}
          >
            Close View
          </button>
        </div>
      </div>
      
      {/* Toast 提示 */}
      <div id="toast" className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] tracking-widest uppercase px-6 py-3 rounded-full opacity-0 pointer-events-none transition-all duration-300 z-50">
        Message
      </div>
    </div>
  );
}