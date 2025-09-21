
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPE DEFINITIONS ---
interface TemplateField {
  id: string;
  label: string;
}

interface Template {
  id: string;
  name: string;
  isDefault?: boolean;
  fields: TemplateField[];
}

interface Pitch {
  id: number;
  title: string;
  generatedPitch: string;
  practicedPitch: string;
  feedback: string;
  sources?: any[];
  templateName?: string;
}

interface CommunityPitch extends Pitch {
  summary: string;
  imageUrl: string;
}

interface Scores {
    audienceEngagement: number;
    fluency: number;
    bodyLanguage: number;
    structure: number;
    timeManagement: number;
}

interface PitchRecord {
    id: number;
    type: 'mine' | 'other';
    date: number;
    topic: string;
    speaker: string;
    audioUrl?: string;
    audioBase64?: string;
    photoUrl?: string;
    transcription: string;
    aiScores: Scores;
    manualScores: Scores;
    aiFeedback: string;
    notes: string;
}

interface CustomField {
    id: string;
    label: string;
    value: string;
}

interface UserProfile {
    avatar: string;
    unit: string;
    title: string;
    experience: string;
    interests: string;
    email: string;
    customFields: CustomField[];
}


// --- DEFAULT TEMPLATES & DATA ---
const PROBLEM_SOLUTION_TEMPLATE: Template = {
  id: 'default-problem-solution',
  name: '解決問題型',
  isDefault: true,
  fields: [
    { id: 'ps1', label: '核心問題 / 痛點' },
    { id: 'ps2', label: '您的解決方案' },
    { id: 'ps3', label: '解決方案如何運作' },
    { id: 'ps4', label: '帶來的關鍵效益' },
    { id: 'ps5', label: '行動呼籲 (Call to Action)' },
  ],
};

const VISIONARY_TEMPLATE: Template = {
  id: 'default-visionary',
  name: '描繪願景型',
  isDefault: true,
  fields: [
    { id: 'vis1', label: '目前的現狀' },
    { id: 'vis2', label: '未來的願景' },
    { id: 'vis3', label: '實現願景的途徑' },
    { id: 'vis4', label: '關鍵第一步' },
    { id: 'vis5', label: '邀請您加入' },
  ],
};

const PRODUCT_DEMO_TEMPLATE: Template = {
  id: 'default-product-demo',
  name: '產品介紹型',
  isDefault: true,
  fields: [
    { id: 'pd1', label: '目標用戶是誰' },
    { id: 'pd2', label: '用戶遇到的主要挑戰' },
    { id: 'pd3', label: '產品核心功能展示' },
    { id: 'pd4', label: '產品如何解決挑戰' },
    { id: 'pd5', label: '下一步/如何試用' },
  ],
};

const PROJECT_PROPOSAL_TEMPLATE: Template = {
  id: 'default-proposal',
  name: '專案提案型',
  isDefault: true,
  fields: [
    { id: 'prop1', label: '專案目標' },
    { id: 'prop2', label: '範圍與交付成果' },
    { id: 'prop3', label: '執行時程' },
    { id: 'prop4', label: '所需資源與預算' },
    { id: 'prop5', label: '預期效益' },
  ],
};

const INTERNAL_UPDATE_TEMPLATE: Template = {
  id: 'default-update',
  name: '內部進度報告',
  isDefault: true,
  fields: [
    { id: 'upd1', label: '專案/任務摘要' },
    { id: 'upd2', label: '上週進度' },
    { id: 'upd3', label: '本週計畫' },
    { id: 'upd4', label: '遇到的挑戰/所需支援' },
  ],
};


const INVESTOR_TEMPLATE: Template = {
  id: 'default-investor',
  name: '投資人簡報',
  isDefault: true,
  fields: [
    { id: 'inv1', label: '市場痛點' },
    { id: 'inv2', label: '我們的解方' },
    { id: 'inv3', label: '市場規模 (TAM, SAM, SOM)' },
    { id: 'inv4', label: '商業模式' },
    { id: 'inv5', label: '頂尖團隊' },
    { id: 'inv6', label: '募資需求與規劃' },
    { id: 'inv7', label: '行動呼籲 (Call to Action)' },
  ],
};

const SALES_TEMPLATE: Template = {
  id: 'default-sales',
  name: '銷售簡報',
  isDefault: true,
  fields: [
    { id: 'sal1', label: '客戶的挑戰' },
    { id: 'sal2', label: '我們的解決方案' },
    { id: 'sal3', label: '獨特價值主張' },
    { id: 'sal4', label: '成功案例/數據證明' },
    { id: 'sal5', label: '行動呼籲 (Call to Action)' },
  ],
};

const NETWORKING_TEMPLATE: Template = {
  id: 'default-networking',
  name: '社交自我介紹',
  isDefault: true,
  fields: [
    { id: 'net1', label: '我是誰' },
    { id: 'net2', label: '我在做什麼' },
    { id: 'net3', label: '我能提供/正在尋找' },
    { id: 'net4', label: '行動呼籲 (Call to Action)' },
  ],
};

const BUSINESS_MODEL_TEMPLATE: Template = {
  id: 'default-business-model',
  name: '商業模式介紹',
  isDefault: true,
  fields: [
    { id: 'bm1', label: '價值主張' },
    { id: 'bm2', label: '目標客群' },
    { id: 'bm3', label: '收益流' },
    { id: 'bm4', label: '關鍵活動' },
    { id: 'bm5', label: '競爭優勢' },
  ],
};

const ALL_DEFAULT_TEMPLATES = [
    PROBLEM_SOLUTION_TEMPLATE,
    VISIONARY_TEMPLATE,
    PRODUCT_DEMO_TEMPLATE,
    PROJECT_PROPOSAL_TEMPLATE,
    INTERNAL_UPDATE_TEMPLATE,
    INVESTOR_TEMPLATE,
    SALES_TEMPLATE,
    NETWORKING_TEMPLATE,
    BUSINESS_MODEL_TEMPLATE,
];

const DEFAULT_SCORES: Scores = {
    audienceEngagement: 3, fluency: 3, bodyLanguage: 3, structure: 3, timeManagement: 3
};

const DEFAULT_PROFILE: UserProfile = {
    avatar: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23CDB380\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'central\' text-anchor=\'middle\' font-size=\'45\' font-family=\'Lora, serif\' fill=\'%23031634\'%3EPF%3C/text%3E%3C/svg%3E',
    unit: '',
    title: '',
    experience: '',
    interests: '',
    email: '',
    customFields: [],
};


const App = () => {
  // --- STATE MANAGEMENT ---
  const [activeView, setActiveView] = useState<'create' | 'mypitches' | 'records' | 'community' | 'profile'>('create');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');

  // Form inputs
  const [pitchLengthSelection, setPitchLengthSelection] = useState('60');
  const [customPitchLength, setCustomPitchLength] = useState('');
  const [pitchInput, setPitchInput] = useState<Record<string, string>>({});
  const [wordCountSuggestions, setWordCountSuggestions] = useState<Record<string, number>>({});
  const [searchTopic, setSearchTopic] = useState('');
  
  // Template management
  const [templates, setTemplates] = useState<Template[]>(ALL_DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(PROBLEM_SOLUTION_TEMPLATE.id);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isSuggestingStructure, setIsSuggestingStructure] = useState(false);

  // Outputs
  const [generatedPitch, setGeneratedPitch] = useState('');
  const [practicedPitch, setPracticedPitch] = useState('');
  const [feedback, setFeedback] = useState('');
  const [searchSources, setSearchSources] = useState<any[]>([]);

  // My Pitches (History)
  const [savedPitches, setSavedPitches] = useState<Pitch[]>([]);
  const [myPitchesViewTab, setMyPitchesViewTab] = useState<'creations' | 'collections'>('creations');

  // Community & Sharing
  const [communityPitches, setCommunityPitches] = useState<CommunityPitch[]>([]);
  const [collections, setCollections] = useState<number[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareablePitch, setShareablePitch] = useState<CommunityPitch | null>(null);
  const [viewingPitch, setViewingPitch] = useState<CommunityPitch | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [currentPitchTemplateName, setCurrentPitchTemplateName] = useState<string>(PROBLEM_SOLUTION_TEMPLATE.name);
  
  // Pitch Records
  const [pitchRecords, setPitchRecords] = useState<PitchRecord[]>([]);
  const [recordsViewTab, setRecordsViewTab] = useState<'mine' | 'other'>('mine');
  const [editingRecord, setEditingRecord] = useState<PitchRecord | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Profile & Login
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [profileViewTab, setProfileViewTab] = useState<'profile' | 'friends' | 'messages'>('profile');

  // Drag and Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  const ai = useRef(new GoogleGenAI({ apiKey: process.env.API_KEY }));


  // --- LOCALSTORAGE PERSISTENCE ---
  useEffect(() => {
    try {
      // Create a stable user ID for QR code if it doesn't exist
      if (!localStorage.getItem('elepitch_userId')) {
        localStorage.setItem('elepitch_userId', `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
      }

      const storedPitches = localStorage.getItem('elepitch_history');
      if (storedPitches) setSavedPitches(JSON.parse(storedPitches));
      
      const storedTemplates = localStorage.getItem('elepitch_templates');
      if (storedTemplates) {
          const customTemplates = JSON.parse(storedTemplates);
          setTemplates([...ALL_DEFAULT_TEMPLATES, ...customTemplates]);
      }
      
      const storedLogin = localStorage.getItem('elepitch_isLoggedIn');
      if (storedLogin) setIsLoggedIn(JSON.parse(storedLogin));

      const storedProfile = localStorage.getItem('elepitch_userProfile');
      if (storedProfile) {
        const loadedProfile = JSON.parse(storedProfile);
        // Ensure default avatar is used if loaded one is empty
        if (!loadedProfile.avatar) {
            loadedProfile.avatar = DEFAULT_PROFILE.avatar;
        }
        setUserProfile(loadedProfile);
      } else {
        setUserProfile(DEFAULT_PROFILE);
      }

      const storedCommunity = localStorage.getItem('elepitch_community');
      if (storedCommunity) setCommunityPitches(JSON.parse(storedCommunity));

      const storedCollections = localStorage.getItem('elepitch_collections');
      if (storedCollections) setCollections(JSON.parse(storedCollections));

      const storedRecords = localStorage.getItem('elepitch_records');
      if (storedRecords) setPitchRecords(JSON.parse(storedRecords));

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => { localStorage.setItem('elepitch_history', JSON.stringify(savedPitches)); }, [savedPitches]);
  useEffect(() => { localStorage.setItem('elepitch_isLoggedIn', JSON.stringify(isLoggedIn)); }, [isLoggedIn]);
  useEffect(() => { localStorage.setItem('elepitch_userProfile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('elepitch_community', JSON.stringify(communityPitches)); }, [communityPitches]);
  useEffect(() => { localStorage.setItem('elepitch_collections', JSON.stringify(collections)); }, [collections]);
  useEffect(() => { localStorage.setItem('elepitch_records', JSON.stringify(pitchRecords)); }, [pitchRecords]);
  useEffect(() => {
    const customTemplates = templates.filter(t => !t.isDefault);
    localStorage.setItem('elepitch_templates', JSON.stringify(customTemplates));
  }, [templates]);


  // --- CORE LOGIC ---
  useEffect(() => {
    const currentTemplate = templates.find(t => t.id === selectedTemplateId) || PROBLEM_SOLUTION_TEMPLATE;
    const newPitchInput: Record<string, string> = {};
    currentTemplate.fields.forEach(field => {
        newPitchInput[field.label] = pitchInput[field.label] || '';
    });
    setPitchInput(newPitchInput);
  }, [selectedTemplateId, templates]);
  
  const getCurrentSeconds = () => pitchLengthSelection === 'custom' ? Number(customPitchLength) || 0 : Number(pitchLengthSelection);
  
  useEffect(() => {
    const calculateSuggestions = () => {
        const currentTemplate = templates.find(t => t.id === selectedTemplateId);
        if (!currentTemplate) return;

        const totalSeconds = getCurrentSeconds();
        if (!totalSeconds || currentTemplate.fields.length === 0) {
            setWordCountSuggestions({});
            return;
        }

        const totalWords = Math.round((totalSeconds / 60) * 180);
        const fieldCount = currentTemplate.fields.length;
        const weights = [];
        if (fieldCount > 2) {
            const openingWeight = 0.15;
            const closingWeight = 0.10;
            const middleWeight = (1 - openingWeight - closingWeight) / (fieldCount - 2);
            weights.push(openingWeight);
            for (let i = 0; i < fieldCount - 2; i++) {
                weights.push(middleWeight);
            }
            weights.push(closingWeight);
        } else if (fieldCount === 2) {
            weights.push(0.6, 0.4);
        } else if (fieldCount === 1) { weights.push(1); }

        const suggestions: Record<string, number> = {};
        currentTemplate.fields.forEach((field, index) => {
            const suggestedCount = Math.round(totalWords * weights[index]);
            suggestions[field.label] = suggestedCount;
        });
        setWordCountSuggestions(suggestions);
    };
    calculateSuggestions();
  }, [pitchLengthSelection, customPitchLength, selectedTemplateId, templates]);

  const handleDynamicInputChange = (fieldName: string, value: string) => {
    setPitchInput(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleGeneratePitch = async () => {
    setIsLoading(true);
    setLoadingMessage('生成中...');
    setError('');
    setSearchSources([]);
    try {
      const currentTemplate = templates.find(t => t.id === selectedTemplateId) || PROBLEM_SOLUTION_TEMPLATE;
      setCurrentPitchTemplateName(currentTemplate.name); // Lock in the template name
      const totalSeconds = getCurrentSeconds();
      
      let response;
      if (searchTopic.trim()) {
        const prompt = `你是一位頂尖的研究員與商業演說撰稿人。請使用 Google 搜尋，深入研究以下主題，並根據研究結果，為我撰寫一份專業的電梯短講。\n\n- **研究主題:** ${searchTopic}\n- **短講模板:** ${currentTemplate.name}\n- **演講長度:** ${totalSeconds} 秒\n\n請將搜尋到的資料，有組織地填充進「${currentTemplate.name}」模板的結構中。講稿內容必須完全基於搜尋到的事實，並確保流暢、有說服力且符合指定的演講長度。`;
        response = await ai.current.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { tools: [{googleSearch: {}}] }
        });
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        setSearchSources(sources);
      } else {
        const fieldsContent = currentTemplate.fields
          .map(field => `- ${field.label} (建議約 ${wordCountSuggestions[field.label] || 'N/A'} 字): ${pitchInput[field.label] || '(未填寫)'}`)
          .join('\n');
        const prompt = `你是一位頂尖的商業演說教練。請根據以下資訊，撰寫一份專業、自信且極具說服力的電梯短講。\n\n- 短講模板名稱: ${currentTemplate.name}\n- 演講長度限制: ${totalSeconds}秒\n- 結構重點與字數分配:\n${fieldsContent}\n\n請確保講稿結構清晰，包含引人入勝的開場、清晰的問題陳述、具體的解決方案、獨特的價值主張，以及明確的行動呼籲。根據選擇的「短講模板名稱」，調整語氣和結構，並嚴格遵守各段落的建議字數，確保總長度符合 ${totalSeconds} 秒的限制。`;
        response = await ai.current.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      }

      setGeneratedPitch(response.text);
      setStep(2);

    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未知錯誤，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGetFeedback = async () => {
    if (!practicedPitch.trim()) {
        setError('請輸入您的演練版本以取得回饋。');
        return;
    }
    setIsLoading(true);
    setLoadingMessage('分析中...');
    setError('');
    try {
        const prompt = `你是一位經驗豐富的演講教練。請比較以下的「AI建議講稿」和「使用者演練版本」。針對「使用者演練版本」，請提供具體、有建設性的回饋。\n\n分析重點：\n1.  **結構與流暢度**\n2.  **說服力與影響力**\n3.  **清晰度與簡潔性**\n4.  **行動呼籲強度**\n\n請用以下格式回覆，並使用繁體中文：\n### 優點分析\n- (列點說明做得好的地方)\n\n### 可改進之處\n- (列點說明可以如何修改，並提供修改後的範例句)\n\n---\n**AI建議講稿:**\n${generatedPitch}\n\n---\n**使用者演練版本:**\n${practicedPitch}`;
        const response = await ai.current.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        setFeedback(response.text);
        setStep(3);
    } catch (err) {
        setError(err instanceof Error ? `取得回饋時發生錯誤: ${err.message}` : '取得回饋時發生錯誤，請稍後再試。');
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSavePitch = () => {
    if (savedPitches.length >= 3 && !isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    const title = searchTopic.trim() || currentPitchTemplateName || '無標題講稿';
    const newPitch: Pitch = { id: Date.now(), title, generatedPitch, practicedPitch, feedback, sources: searchSources, templateName: currentPitchTemplateName };
    setSavedPitches(prev => [newPitch, ...prev]);
    alert('講稿已成功儲存！');
  };
  
  const handleSimulatedLogin = () => {
      setIsLoggedIn(true);
      setShowLoginPrompt(false);
      // This function might be called from pitch saving or profile view
      if(activeView !== 'profile') {
        handleSavePitch(); // Retry saving after login
      }
  }

  const handleLoadPitch = (pitch: Pitch) => {
    setGeneratedPitch(pitch.generatedPitch);
    setPracticedPitch(pitch.practicedPitch);
    setFeedback(pitch.feedback);
    setSearchSources(pitch.sources || []);
    setCurrentPitchTemplateName(pitch.templateName || '未知模板');
    setStep(3);
    setActiveView('create');
  };

  const handleDeletePitch = (pitchIdToDelete: number) => {
    if (window.confirm('您確定要刪除這份創作講稿嗎？')) {
        setSavedPitches(prevPitches => prevPitches.filter(pitch => pitch.id !== pitchIdToDelete));
    }
  };
  
  const handleReset = () => {
    setStep(1);
    setGeneratedPitch('');
    setPracticedPitch('');
    setFeedback('');
    setError('');
    setSearchTopic('');
    setSearchSources([]);
    const currentTemplate = templates.find(t => t.id === selectedTemplateId);
    setCurrentPitchTemplateName(currentTemplate?.name || '');
    setPitchInput({});
  };

  const handleInitiateShare = async () => {
      if (!isLoggedIn) {
        alert("分享至社群需要登入帳號。");
        setActiveView('profile');
        return;
      }
      setIsLoading(true);
      setLoadingMessage('AI 評鑑中...');
      try {
          const evalPrompt = `You are a community manager. Is the following pitch (considering the user's version and the coach's feedback) of high quality and suitable for sharing in a public community of professionals? Respond in JSON.`;
          const evalResponse = await ai.current.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `${evalPrompt}\n\nUser's Pitch:\n${practicedPitch}\n\nFeedback:\n${feedback}`,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: { shareable: { type: Type.BOOLEAN }, reason: { type: Type.STRING } },
                      required: ['shareable', 'reason']
                  }
              }
          });
          const evalResult = JSON.parse(evalResponse.text);

          if (!evalResult.shareable) {
              alert(`AI 評鑑結果：不建議分享。\n原因：${evalResult.reason}`);
              setIsLoading(false);
              return;
          }

          setLoadingMessage('生成摘要與圖片提示...');
          const summaryPrompt = `
You are a creative director AI specializing in branding and visual storytelling. Your task is to process a pitch and generate content for a professional community platform.

**Analyze the following pitch:**
${practicedPitch}

**Based on your analysis, provide a JSON object with the following three keys:**

1.  **"title"**: A short, catchy, and professional title for the pitch. **This MUST be in Traditional Chinese (繁體中文).**
2.  **"summary"**: A concise one-sentence summary (under 25 words) that captures the core message. **This MUST be in Traditional Chinese (繁體中文).**
3.  **"imagePrompt"**: A detailed, vivid, and descriptive prompt in **English** for an image generation AI (like Imagen 4). The prompt should:
    *   Metaphorically represent the pitch's core idea, essence, or feeling.
    *   Adhere to a professional and modern business aesthetic. Think minimalist, abstract, and high-concept.
    *   Use keywords like 'corporate', 'professional', 'sleek', 'futuristic', 'abstract visualization', 'data art', 'conceptual art'.
    *   Avoid literal depictions of people or objects unless it's a core, unavoidable part of the concept.
    *   **Example style:** "An abstract visualization of interconnected data nodes glowing with a vibrant blue energy, representing innovation and seamless connectivity. Minimalist style, dark background, professional corporate aesthetic."

**Respond ONLY with the JSON object.**
`;
          const summaryResponse = await ai.current.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: summaryPrompt,
              config: {
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          title: { type: Type.STRING },
                          summary: { type: Type.STRING },
                          imagePrompt: { type: Type.STRING }
                      },
                      required: ['title', 'summary', 'imagePrompt']
                  }
              }
          });
          const { title, summary, imagePrompt } = JSON.parse(summaryResponse.text);

          setLoadingMessage('生成分享圖片...');
          const imageResponse = await ai.current.models.generateImages({
              model: 'imagen-4.0-generate-001',
              prompt: imagePrompt,
              config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
          });

          const imageUrl = `data:image/jpeg;base64,${imageResponse.generatedImages[0].image.imageBytes}`;
          
          setShareablePitch({ id: Date.now(), title, generatedPitch, practicedPitch, feedback, sources: searchSources, summary, imageUrl, templateName: currentPitchTemplateName });
          setShowShareModal(true);

      } catch (err) {
          setError(err instanceof Error ? `分享失敗: ${err.message}` : '分享過程中發生錯誤');
      } finally {
          setIsLoading(false);
      }
  };

  const handleConfirmShare = () => {
      if (shareablePitch) {
          setCommunityPitches(prev => [shareablePitch, ...prev]);
          alert('成功分享至社群！');
          setShowShareModal(false);
          setShareablePitch(null);
          handleReset();
      }
  };
  
  const handleToggleCollection = (pitchId: number) => {
      setCollections(prev => {
          if (prev.includes(pitchId)) {
              return prev.filter(id => id !== pitchId);
          } else {
              return [...prev, pitchId];
          }
      });
  };

  const handleViewDetails = (pitch: CommunityPitch) => {
    setViewingPitch(pitch);
    setExpandedSections(new Set()); // Reset expanded sections on open
  };

  const handleToggleSection = (section: string) => {
    setExpandedSections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(section)) {
            newSet.delete(section);
        } else {
            newSet.add(section);
        }
        return newSet;
    });
  };

  // --- TEMPLATE MANAGEMENT ---
  const handleSaveTemplate = () => {
    if (!editingTemplate || !editingTemplate.name.trim()) { alert("模板名稱不可為空。"); return; }
    const isCreating = !templates.some(t => t.id === editingTemplate.id);
    if (isCreating) { setTemplates(prev => [...prev, editingTemplate]); }
    else { setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t)); }
    setEditingTemplate(null);
  };
  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('您確定要刪除這個模板嗎？')) {
      if (selectedTemplateId === templateId) { setSelectedTemplateId(PROBLEM_SOLUTION_TEMPLATE.id); }
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };
  const handleStartEditing = (template: Template) => { setEditingTemplate(JSON.parse(JSON.stringify(template))); };
  const handleCreateNewTemplate = () => { setEditingTemplate({ id: `custom-${Date.now()}`, name: '我的新模板', fields: [{ id: `f-${Date.now()}`, label: '欄位 1' }] }); };
  const handleTemplateFieldChange = (fieldId: string, newLabel: string) => { if (editingTemplate) { const updatedFields = editingTemplate.fields.map(f => f.id === fieldId ? { ...f, label: newLabel } : f); setEditingTemplate({ ...editingTemplate, fields: updatedFields }); } };
  const handleAddTemplateField = () => { if (editingTemplate) { const newField: TemplateField = { id: `f-${Date.now()}`, label: '新欄位' }; const updatedFields = [...editingTemplate.fields, newField]; setEditingTemplate({ ...editingTemplate, fields: updatedFields }); } };
  const handleRemoveTemplateField = (fieldId: string) => { if (editingTemplate && editingTemplate.fields.length > 1) { const updatedFields = editingTemplate.fields.filter(f => f.id !== fieldId); setEditingTemplate({ ...editingTemplate, fields: updatedFields }); } else { alert("模板至少需要一個欄位。"); } };
  const handleAiSuggestStructure = async () => {
    if (!editingTemplate || !editingTemplate.name.trim()) { alert("請先為模板命名，AI 才能提供建議。"); return; }
    setIsSuggestingStructure(true); setError('');
    try {
        const prompt = `You are an expert in business communication. For a pitch template named "${editingTemplate.name}", suggest a concise, professional list of field labels for the structure.`;
        const response = await ai.current.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { fields: { type: Type.ARRAY, items: { type: Type.STRING } } },
                    required: ["fields"],
                },
            },
        });
        const jsonResponse = JSON.parse(response.text);
        const suggestedLabels = jsonResponse.fields;
        if (Array.isArray(suggestedLabels) && suggestedLabels.length > 0) {
            const newFields: TemplateField[] = suggestedLabels.map((label, index) => ({ id: `f-${Date.now()}-${index}`, label: String(label) }));
            setEditingTemplate(prev => prev ? { ...prev, fields: newFields } : null);
        } else { throw new Error("AI 未能提供有效的欄位建議。"); }
    } catch (err) { alert(err instanceof Error ? `AI 建議生成失敗: ${err.message}` : 'AI 建議生成失敗，請稍後再試。'); }
    finally { setIsSuggestingStructure(false); }
  };

  // --- DRAG & DROP ---
  const handleDragStart = (index: number) => { setDraggedIndex(index); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.currentTarget.classList.add('drag-over'); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.currentTarget.classList.remove('drag-over'); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.currentTarget.classList.remove('drag-over');
    if (draggedIndex === null || draggedIndex === targetIndex || !editingTemplate) return;
    const newFields = [...editingTemplate.fields];
    const [removed] = newFields.splice(draggedIndex, 1);
    newFields.splice(targetIndex, 0, removed);
    setEditingTemplate({ ...editingTemplate, fields: newFields });
    setDraggedIndex(null);
  };
  const handleDragEnd = () => { setDraggedIndex(null); };

  // --- PITCH RECORDS ---
    const handleUpdateEditingRecord = (field: keyof PitchRecord, value: any) => {
        setEditingRecord(prev => prev ? { ...prev, [field]: value } : null);
    };

    useEffect(() => {
        // Auto-save
        if (editingRecord) {
            setPitchRecords(prev => prev.map(r => r.id === editingRecord.id ? editingRecord : r));
        }
    }, [editingRecord]);

    const handleAddNewRecord = (type: 'mine' | 'other') => {
        const newRecord: PitchRecord = {
            id: Date.now(),
            type,
            date: Date.now(),
            topic: '',
            speaker: type === 'mine' ? '我' : '',
            transcription: '',
            aiScores: { ...DEFAULT_SCORES },
            manualScores: { ...DEFAULT_SCORES },
            aiFeedback: '',
            notes: '',
        };
        setEditingRecord(newRecord);
    };

    const handleCloseEditor = () => {
        if (editingRecord && !pitchRecords.some(r => r.id === editingRecord.id)) {
            // It's a new record that was opened but not yet in the main list
            setPitchRecords(prev => [editingRecord, ...prev]);
        }
        setEditingRecord(null);
    }
    
    const handleDeleteRecord = (recordIdToDelete: number) => {
        if (window.confirm('您確定要刪除這份紀錄嗎？')) {
            setPitchRecords(prevRecords => prevRecords.filter(record => record.id !== recordIdToDelete));
        }
    }

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            const audioChunks: Blob[] = [];
            mediaRecorder.current.ondataavailable = event => audioChunks.push(event.data);
            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64String = (reader.result as string).split(',')[1];
                    handleUpdateEditingRecord('audioUrl', audioUrl);
                    handleUpdateEditingRecord('audioBase64', base64String);
                };
            };
            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Recording failed:", err);
            alert("無法啟動錄音功能。請確認麥克風權限已開啟。");
        }
    };
    
    const handleStopRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleTakePhoto = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setShowCamera(true);
             setTimeout(() => {
                if(videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 0);
        } catch (err) {
            console.error("Camera access failed:", err);
            alert("無法啟動相機。請確認相機權限已開啟。");
        }
    };

    const handleCapturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const photoUrl = canvas.toDataURL('image/jpeg');
            handleUpdateEditingRecord('photoUrl', photoUrl);
            
            // Stop camera stream
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setShowCamera(false);
        }
    };

    const handleGetTranscription = async () => {
        if (!editingRecord?.audioBase64) {
            alert("請先錄音。"); return;
        }
        setIsLoading(true); setLoadingMessage("語音轉文字中..."); setError('');
        try {
            const audioPart = { inlineData: { mimeType: 'audio/webm', data: editingRecord.audioBase64 } };
            const promptPart = { text: "請將以下音檔內容逐字稿輸出為繁體中文。" };
            const response = await ai.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [promptPart, audioPart] }
            });
            handleUpdateEditingRecord('transcription', response.text);
        } catch(err) {
            setError(err instanceof Error ? err.message : "轉錄失敗");
        } finally {
            setIsLoading(false);
        }
    }

    const handleGetAIEvaluation = async () => {
        if (!editingRecord?.transcription) {
            alert("請先產生逐字稿。"); return;
        }
        setIsLoading(true); setLoadingMessage("AI 評分中..."); setError('');
        try {
            const prompt = `你是一位專業的演講教練。請根據以下講稿逐字稿，從五個維度進行評分(1-5分)，並提供綜合評語。\n\n**逐字稿:**\n${editingRecord.transcription}\n\n**評分維度:**\n- **吸引聽眾 (Audience Engagement):** 內容是否有趣、引人入勝？\n- **口條流暢 (Fluency):** 語氣、節奏和流暢度如何？(從文字推斷)\n- **肢體動作 (Body Language):** (從文字中的停頓、贅字推斷講者的自信與姿態)\n- **架構明確 (Clear Structure):** 內容組織是否有邏輯？\n- **時間掌握 (Time Management):** (從內容長度推斷) 是否簡潔有力？\n\n請以 JSON 格式回覆。`;
            const response = await ai.current.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            scores: { type: Type.OBJECT, properties: {
                                audienceEngagement: { type: Type.INTEGER, description: "分數 1-5" },
                                fluency: { type: Type.INTEGER, description: "分數 1-5" },
                                bodyLanguage: { type: Type.INTEGER, description: "分數 1-5" },
                                structure: { type: Type.INTEGER, description: "分數 1-5" },
                                timeManagement: { type: Type.INTEGER, description: "分數 1-5" }
                            }},
                            feedback: { type: Type.STRING, description: "綜合評語(繁體中文)" }
                        },
                        required: ["scores", "feedback"]
                    }
                }
            });
            const result = JSON.parse(response.text);
            handleUpdateEditingRecord('aiScores', result.scores);
            handleUpdateEditingRecord('manualScores', result.scores); // Sync manual scores initially
            handleUpdateEditingRecord('aiFeedback', result.feedback);
        } catch(err) {
            setError(err instanceof Error ? err.message : "AI 評鑑失敗");
        } finally {
            setIsLoading(false);
        }
    }

  // --- PROFILE MANAGEMENT ---
  const handleUpdateProfile = (field: keyof UserProfile, value: any) => {
    setUserProfile(prev => ({...prev, [field]: value}));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                handleUpdateProfile('avatar', event.target.result);
            }
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  const handleAddCustomField = () => {
    const newField: CustomField = { id: `cf-${Date.now()}`, label: '新欄位', value: '' };
    handleUpdateProfile('customFields', [...userProfile.customFields, newField]);
  };

  const handleUpdateCustomField = (id: string, key: 'label' | 'value', text: string) => {
    const updatedFields = userProfile.customFields.map(f =>
      f.id === id ? { ...f, [key]: text } : f
    );
    handleUpdateProfile('customFields', updatedFields);
  };
  
  const handleDeleteCustomField = (id: string) => {
    const updatedFields = userProfile.customFields.filter(f => f.id !== id);
    handleUpdateProfile('customFields', updatedFields);
  };

  const getQrCodeUrl = () => {
    const userId = localStorage.getItem('elepitch_userId');
    const data = `https://elepitch.app/user/${userId}`; // Simulated URL
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(data)}`;
  };


  // --- RENDER FUNCTIONS ---
  const renderLoginPrompt = () => (
      <div className="modal-overlay">
          <div className="modal-content login-prompt">
              <h2>解鎖無限儲存</h2>
              <p>儲存 3 篇以上的講稿需要登入您的 Google 帳號。</p>
              <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowLoginPrompt(false)}>稍後再說</button>
                  <button className="btn btn-primary" onClick={handleSimulatedLogin}>使用 Google 帳號登入 (模擬)</button>
              </div>
          </div>
      </div>
  );

  const renderShareModal = () => (
    <div className="modal-overlay">
      <div className="modal-content share-modal">
        <h2>分享至社群</h2>
        <p>AI 已為您的講稿生成了圖片與摘要，請預覽並確認發布。</p>
        {shareablePitch && (
            <div className="share-preview">
                <img src={shareablePitch.imageUrl} alt={shareablePitch.title} className="share-image-preview" />
                <h3>{shareablePitch.title}</h3>
                <p>{shareablePitch.summary}</p>
            </div>
        )}
        <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>取消</button>
            <button className="btn btn-primary" onClick={handleConfirmShare}>確認發布</button>
        </div>
      </div>
    </div>
  );
  
  const renderQrCodeModal = () => (
    <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
      <div className="modal-content qr-code-modal" onClick={(e) => e.stopPropagation()}>
        <h2>我的 QR Code</h2>
        <p>讓他人掃描以快速連結您的個人檔案。</p>
        <img src={getQrCodeUrl()} alt="Your QR Code" />
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => setShowQrModal(false)}>完成</button>
        </div>
      </div>
    </div>
  );

  const renderCommunityDetailModal = () => {
    if (!viewingPitch) return null;
    const isFeedbackExpanded = expandedSections.has('feedback');
    const isSourcesExpanded = expandedSections.has('sources');

    return (
        <div className="modal-overlay" onClick={() => setViewingPitch(null)}>
            <div className="community-detail-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="detail-modal-header">
                    <div className="detail-modal-title-group">
                         <h2 title={viewingPitch.title}>{viewingPitch.title}</h2>
                         <button
                            className={`btn btn-sm ${collections.includes(viewingPitch.id) ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCollection(viewingPitch.id);
                            }}
                        >
                            {collections.includes(viewingPitch.id) ? '✓ 已收藏' : '收藏'}
                        </button>
                    </div>
                    <button className="btn-close" onClick={() => setViewingPitch(null)}>&times;</button>
                </div>
                <div className="detail-modal-body">
                    <img src={viewingPitch.imageUrl} alt={viewingPitch.title} className="detail-modal-image" />
                    <div className="detail-section">
                        <h4>摘要</h4>
                        <p>{viewingPitch.summary}</p>
                    </div>
                    <div className="detail-section">
                        <h4>使用者演練版本</h4>
                        <div className="output-container">{viewingPitch.practicedPitch}</div>
                    </div>
                     <div className="detail-section">
                        <div className="collapsible-header" onClick={() => handleToggleSection('feedback')}>
                            <h4>AI 教練回饋</h4>
                            <button className="btn-toggle">{isFeedbackExpanded ? '−' : '+'}</button>
                        </div>
                        {isFeedbackExpanded && <div className="output-container">{viewingPitch.feedback}</div>}
                    </div>
                    {viewingPitch.sources && viewingPitch.sources.length > 0 && (
                         <div className="detail-section">
                            <div className="collapsible-header" onClick={() => handleToggleSection('sources')}>
                                <h4>資料來源</h4>
                                <button className="btn-toggle">{isSourcesExpanded ? '−' : '+'}</button>
                            </div>
                            {isSourcesExpanded && <div className="sources-container">
                                <ul className="sources-list">{viewingPitch.sources.map((source, index) => (source.web && (<li key={index} className="source-item"><a href={source.web.uri} target="_blank" rel="noopener noreferrer">{source.web.title || source.web.uri}</a></li>)))}</ul>
                            </div>}
                        </div>
                    )}
                </div>
                <div className="detail-modal-footer">
                    <button className={`btn ${collections.includes(viewingPitch.id) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleToggleCollection(viewingPitch.id)}>
                        {collections.includes(viewingPitch.id) ? '✓ 已收藏' : '收藏'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setViewingPitch(null)}>關閉</button>
                </div>
            </div>
        </div>
    );
  };

  const renderTemplateManager = () => (
    <div className="template-modal-overlay" onClick={() => setShowTemplateManager(false)}>
      <div className="template-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal-header">
          <h2>{editingTemplate ? '編輯模板' : '管理模板'}</h2>
          <button className="btn-close" onClick={() => { setShowTemplateManager(false); setEditingTemplate(null); }}>&times;</button>
        </div>
        <div className="template-modal-body">
        {editingTemplate ? (
            <div className="template-editor">
                <div className="form-group">
                    <label>模板名稱 (這將成為您的新短講類型)</label>
                    <input type="text" className="input" value={editingTemplate.name} onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                </div>
                <div className="ai-suggest-container">
                    <button className="btn btn-secondary" onClick={handleAiSuggestStructure} disabled={isSuggestingStructure || !editingTemplate.name.trim()}>
                        {isSuggestingStructure && <span className="loader"></span>}
                        {isSuggestingStructure ? '思考中...' : 'AI 建議結構'}
                    </button>
                </div>
                <h4>欄位 (可拖曳排序)</h4>
                <div className="field-editor-list">
                {editingTemplate.fields.map((field, index) => (
                    <div key={field.id} className={`field-editor-item ${draggedIndex === index ? 'dragging' : ''}`} draggable={true} onDragStart={() => handleDragStart(index)} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
                        <span className="drag-handle">⠿</span>
                        <input type="text" className="input" value={field.label} onChange={(e) => handleTemplateFieldChange(field.id, e.target.value)} />
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemoveTemplateField(field.id)}>&times;</button>
                    </div>
                ))}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={handleAddTemplateField}>新增欄位</button>
            </div>
        ) : (
            <>
              <ul className="template-list">
                {templates.map(template => (
                    <li key={template.id} className="template-item">
                        <span>{template.name} {template.isDefault && "(專家)"}</span>
                        <div className="template-item-actions">
                            {template.isDefault ? (<button className="btn btn-secondary btn-sm" disabled>無法編輯</button>) : (
                                <>
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleStartEditing(template)}>編輯</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTemplate(template.id)}>刪除</button>
                                </>
                            )}
                        </div>
                    </li>
                ))}
              </ul>
              <button className="btn btn-primary" style={{marginTop: '1rem'}} onClick={handleCreateNewTemplate}>建立新模板</button>
            </>
        )}
        </div>
        <div className="template-modal-footer">
          {editingTemplate && (<>
            <button className="btn btn-secondary" onClick={() => setEditingTemplate(null)}>取消</button>
            <button className="btn btn-primary" onClick={handleSaveTemplate}>儲存</button>
          </>)}
        </div>
      </div>
    </div>
  );

    const renderCameraModal = () => (
        <div className="modal-overlay" onClick={() => setShowCamera(false)}>
            <div className="camera-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>拍照</h2>
                <video ref={videoRef} autoPlay playsInline className="camera-preview"></video>
                <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={() => setShowCamera(false)}>取消</button>
                    <button className="btn btn-primary" onClick={handleCapturePhoto}>拍攝</button>
                </div>
            </div>
        </div>
    );

    const renderRecordEditorModal = () => {
        if (!editingRecord) return null;

        const scoreLabels: Record<keyof Scores, string> = {
            audienceEngagement: "吸引聽眾", fluency: "口條流暢", bodyLanguage: "肢體動作", structure: "架構明確", timeManagement: "時間掌握"
        };
        
        return (
            <div className="modal-overlay" onClick={handleCloseEditor}>
                <div className="record-editor-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="template-modal-header">
                        <h2>{editingRecord.type === 'mine' ? '編輯我的短講紀錄' : '編輯他人短講紀錄'}</h2>
                        <button className="btn-close" onClick={handleCloseEditor}>&times;</button>
                    </div>
                    <div className="template-modal-body">
                       <div className="editor-section">
                            <h4 className="editor-section-title">基本資訊</h4>
                            <div className="editor-grid">
                                <div className="form-group">
                                    <label>主題</label>
                                    <input type="text" className="input" value={editingRecord.topic} onChange={e => handleUpdateEditingRecord('topic', e.target.value)} />
                                    {editingRecord.type === 'mine' && (
                                        <select className="select" style={{marginTop: '0.5rem'}} onChange={e => handleUpdateEditingRecord('topic', e.target.value)}>
                                            <option value="">或從我的創作匯入...</option>
                                            {savedPitches.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                                        </select>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>講者</label>
                                    <input type="text" className="input" value={editingRecord.speaker} onChange={e => handleUpdateEditingRecord('speaker', e.target.value)} />
                                </div>
                            </div>
                       </div>

                        <div className="editor-section">
                            <h4 className="editor-section-title">步驟 1 & 2: 錄音與轉錄</h4>
                            <div className="media-item">
                                <button className="btn" onClick={isRecording ? handleStopRecording : handleStartRecording}>{isRecording ? "停止錄音" : "開始錄音"}</button>
                                {isRecording && <span className="recording-indicator"></span>}
                                {editingRecord.audioUrl && <audio src={editingRecord.audioUrl} controls style={{width: '100%', marginTop: '1rem'}}></audio>}
                                <button className="btn btn-secondary" onClick={handleGetTranscription} disabled={isLoading || !editingRecord.audioUrl}>
                                    {isLoading && loadingMessage.startsWith("語音") && <span className="loader"></span>}
                                    {isLoading && loadingMessage.startsWith("語音") ? "轉錄中..." : "AI 語音轉文字"}
                                </button>
                                <textarea className="textarea" rows={5} placeholder="錄音後，點擊上方按鈕生成逐字稿..." value={editingRecord.transcription} onChange={e => handleUpdateEditingRecord('transcription', e.target.value)}></textarea>
                            </div>
                        </div>

                        <div className="editor-section">
                            <h4 className="editor-section-title">步驟 3: AI 評分與回饋</h4>
                            <button className="btn btn-primary" style={{marginBottom: '1rem'}} onClick={handleGetAIEvaluation} disabled={isLoading || !editingRecord.transcription}>
                                {isLoading && loadingMessage.startsWith("AI") && <span className="loader"></span>}
                                {isLoading && loadingMessage.startsWith("AI") ? "評分中..." : "取得 AI 評分與評語"}
                            </button>
                            <div className="output-container" style={{minHeight: '80px', marginBottom: '1.5rem'}}>{editingRecord.aiFeedback || "點擊上方按鈕以生成 AI 評語。"}</div>

                            <div className="scores-grid">
                                {Object.keys(scoreLabels).map(key => (
                                    <div key={key} className="score-item">
                                        <label>{scoreLabels[key as keyof Scores]}</label>
                                        <input type="range" min="1" max="5" step="1" value={editingRecord.manualScores[key as keyof Scores]} onChange={e => handleUpdateEditingRecord('manualScores', {...editingRecord.manualScores, [key]: Number(e.target.value)})} />
                                        <div className="score-values">
                                            <span>AI: {editingRecord.aiScores[key as keyof Scores]} / 5</span>
                                            <span>您: {editingRecord.manualScores[key as keyof Scores]} / 5</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="editor-section">
                            <h4 className="editor-section-title">補充資訊</h4>
                            <div className="media-item">
                                <label>證件/名片 (選填)</label>
                                <button className="btn" onClick={handleTakePhoto}>拍照</button>
                                {editingRecord.photoUrl && <img src={editingRecord.photoUrl} alt="captured" className="photo-thumbnail"/>}
                            </div>
                            <div className="form-group" style={{marginTop: '1rem'}}>
                                <label>其他筆記</label>
                                <textarea className="textarea" rows={3} value={editingRecord.notes} onChange={e => handleUpdateEditingRecord('notes', e.target.value)}></textarea>
                            </div>
                        </div>
                        
                         {error && <p className="error-message">{error}</p>}
                    </div>
                    <div className="template-modal-footer">
                        <button className="btn btn-primary" onClick={handleCloseEditor}>完成</button>
                    </div>
                </div>
            </div>
        )
    };

  const renderCreateView = () => {
    const currentTemplate = templates.find(t => t.id === selectedTemplateId) || PROBLEM_SOLUTION_TEMPLATE;
    switch (step) {
      case 1:
        return (
          <div className="card">
            <h2>1. 打造您的電梯短講</h2>
            <p className="text-secondary" style={{marginBottom: '2rem'}}>請填寫以下欄位，AI 將為您生成講稿初稿。</p>
            <div className="form-group"><label htmlFor="searchTopic">主題/事件 (選填，AI將為您搜尋資料)</label><input id="searchTopic" type="text" className="input" placeholder="例如：AI 在巴黎奧運的應用" value={searchTopic} onChange={(e) => setSearchTopic(e.target.value)} /></div>
            <div className="form-group">
                <label htmlFor="pitchLength">演講長度</label>
                <div className="pitch-length-group">
                    <select id="pitchLength" name="pitchLength" className="select" value={pitchLengthSelection} onChange={(e) => setPitchLengthSelection(e.target.value)}>
                        <option value="30">30秒</option><option value="60">60秒</option><option value="90">90秒</option><option value="120">120秒</option><option value="150">150秒</option><option value="180">180秒</option><option value="210">210秒</option><option value="300">300秒</option><option value="custom">自訂秒數</option>
                    </select>
                    {pitchLengthSelection === 'custom' && (<input type="number" className="input custom-length-input" value={customPitchLength} onChange={(e) => setCustomPitchLength(e.target.value)} placeholder="秒數" aria-label="Custom pitch length in seconds"/>)}
                </div>
            </div>
            <div className="form-group">
                <label htmlFor="templateSelect">短講模板</label>
                <div className="template-select-group">
                    <select id="templateSelect" className="select" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}>
                        {templates.map(template => (<option key={template.id} value={template.id}>{template.name}</option>))}
                    </select>
                    <button className="btn btn-secondary" onClick={() => setShowTemplateManager(true)}>管理模板</button>
                </div>
            </div>
            <hr className="form-divider" />
            {currentTemplate.fields.map(field => (
                <div className="form-group" key={field.id}>
                    <div className="label-container">
                        <label htmlFor={field.id}>{field.label}</label>
                        {wordCountSuggestions[field.label] > 0 && (<span className="word-count-suggestion">建議 {wordCountSuggestions[field.label]} 字</span>)}
                    </div>
                    <textarea id={field.id} className="textarea" value={pitchInput[field.label] || ''} onChange={(e) => handleDynamicInputChange(field.label, e.target.value)} disabled={!!searchTopic.trim()}></textarea>
                </div>
            ))}
            <button className="btn btn-primary" onClick={handleGeneratePitch} disabled={isLoading}>{isLoading && <span className="loader"></span>}{isLoading ? loadingMessage : 'AI 生成講稿'}</button>
            {error && <p className="error-message">{error}</p>}
          </div>
        );
      case 2:
      case 3:
        return (
          <div className="card">
            <h2>2. 演練與優化</h2>
            <p className="text-secondary">這是AI生成的講稿。請以此為基礎進行演練，然後在下方貼上您的版本以取得AI回饋。</p>
            <div className="feedback-container">
                <div>
                    <h3>AI 建議講稿</h3>
                    <div className="output-container">{generatedPitch}</div>
                    {searchSources.length > 0 && (
                        <div className="sources-container">
                            <h4>資料來源:</h4>
                            <ul className="sources-list">{searchSources.map((source, index) => (source.web && (<li key={index} className="source-item"><a href={source.web.uri} target="_blank" rel="noopener noreferrer">{source.web.title || source.web.uri}</a></li>)))}</ul>
                        </div>
                    )}
                </div>
                <div>
                    <h3>您的演練版本</h3>
                    <textarea className="textarea" placeholder="請在此處輸入或貼上您練習後的講稿..." value={practicedPitch} onChange={(e) => setPracticedPitch(e.target.value)} />
                </div>
            </div>
            <div className="button-group">
                <button className="btn btn-primary" onClick={handleGetFeedback} disabled={isLoading || !practicedPitch.trim()}>{isLoading && <span className="loader"></span>}{isLoading ? loadingMessage : '取得 AI 回饋'}</button>
                <button className="btn btn-secondary" onClick={handleReset}>重新開始</button>
            </div>
            {error && <p className="error-message">{error}</p>}
            {step === 3 && feedback && (
                 <div className="feedback-result-container">
                    <h2>3. AI 教練回饋</h2>
                    <div className="output-container" aria-live="polite">{feedback}</div>
                    <div className="button-group" style={{marginTop: '1rem', justifyContent: 'flex-start'}}>
                      <button className="btn btn-success" onClick={handleSavePitch}>儲存到我的講稿</button>
                      <button className="btn btn-primary" onClick={handleInitiateShare} disabled={isLoading}>{isLoading && <span className="loader"></span>}{isLoading ? loadingMessage : '分享至社群'}</button>
                      <button className="btn btn-secondary" onClick={handleReset}>重新開始</button>
                    </div>
                </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMyPitchesView = () => {
    const collectedPitches = communityPitches.filter(p => collections.includes(p.id));

    return (
        <div className="card">
            <div className="my-pitches-header">
                <h2>我的講稿</h2>
                <div className="sub-nav">
                    <button 
                        className={`sub-nav-item ${myPitchesViewTab === 'creations' ? 'active' : ''}`} 
                        onClick={() => setMyPitchesViewTab('creations')}>
                        我的創作 ({savedPitches.length})
                    </button>
                    <button 
                        className={`sub-nav-item ${myPitchesViewTab === 'collections' ? 'active' : ''}`} 
                        onClick={() => setMyPitchesViewTab('collections')}>
                        我的收藏 ({collections.length})
                    </button>
                </div>
            </div>
            
            {myPitchesViewTab === 'creations' && (
                 <>
                    {savedPitches.length === 0 ? (
                        <p className="text-secondary" style={{marginTop: '2rem'}}>尚未儲存任何您創作的講稿。</p>
                    ) : (
                        <ul className="history-list">
                            {savedPitches.map(pitch => (
                                <li key={pitch.id} className="history-item">
                                    <div className="history-item-info">
                                        <strong>{pitch.title}</strong>
                                        <p className="text-secondary">儲存於 {new Date(pitch.id).toLocaleString()}</p>
                                    </div>
                                    <div className="history-item-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleLoadPitch(pitch)}>查看與演練</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeletePitch(pitch.id)}>刪除</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                 </>
            )}

            {myPitchesViewTab === 'collections' && (
                <>
                    {collectedPitches.length === 0 ? (
                        <p className="text-secondary" style={{marginTop: '2rem'}}>您尚未收藏任何講稿。</p>
                    ) : (
                        <ul className="history-list">
                            {collectedPitches.map(pitch => (
                                <li key={pitch.id} className="collected-item">
                                    <img src={pitch.imageUrl} alt={pitch.title} className="collected-item-thumbnail" />
                                    <div className="history-item-info">
                                        {pitch.templateName && <div className="pitch-type-tag" style={{marginBottom: '0.5rem'}}>{pitch.templateName}</div>}
                                        <strong>{pitch.title}</strong>
                                        <p>{pitch.summary}</p>
                                    </div>
                                    <div className="history-item-actions">
                                        <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetails(pitch)}>查看詳情</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => handleToggleCollection(pitch.id)}>移除收藏</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
  };
  
  const renderCommunityView = () => {
    return (
      <div className="card">
        <div className="community-header">
            <h2>社群分享</h2>
            <p className="text-secondary">探索由社群成員分享的優秀講稿</p>
        </div>
        {communityPitches.length === 0 ? (
            <p className="text-secondary" style={{marginTop: '1rem'}}>社群中還沒有分享。快去創作並分享您的第一份講稿吧！</p>
        ) : (
            <div className="community-grid">
                {communityPitches.map(pitch => (
                    <div key={pitch.id} className="community-card">
                        <img src={pitch.imageUrl} alt={pitch.title} className="card-image"/>
                        <div className="card-content">
                            {pitch.templateName && <div className="pitch-type-tag">{pitch.templateName}</div>}
                            <h3>{pitch.title}</h3>
                            <p>{pitch.summary}</p>
                        </div>
                        <div className="card-actions">
                            <button className="btn btn-secondary btn-sm" onClick={() => handleViewDetails(pitch)}>查看詳情</button>
                            <button className={`btn btn-sm ${collections.includes(pitch.id) ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleToggleCollection(pitch.id)}>
                                {collections.includes(pitch.id) ? '✓ 已收藏' : '收藏'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    );
  };

    const renderPitchRecordsView = () => {
        const filteredRecords = pitchRecords.filter(r => r.type === recordsViewTab).sort((a, b) => b.date - a.date);
        return (
             <div className="card">
                <div className="my-pitches-header">
                    <h2>短講紀錄</h2>
                    <div className="sub-nav">
                        <button 
                            className={`sub-nav-item ${recordsViewTab === 'mine' ? 'active' : ''}`} 
                            onClick={() => setRecordsViewTab('mine')}>
                            我的短講
                        </button>
                        <button 
                            className={`sub-nav-item ${recordsViewTab === 'other' ? 'active' : ''}`} 
                            onClick={() => setRecordsViewTab('other')}>
                            他人短講
                        </button>
                    </div>
                </div>

                <button className="btn btn-primary" style={{marginTop: '1.5rem'}} onClick={() => handleAddNewRecord(recordsViewTab)}>
                    新增{recordsViewTab === 'mine' ? '我的短講' : '他人短講'}紀錄
                </button>
                
                {filteredRecords.length === 0 ? (
                    <p className="text-secondary" style={{marginTop: '2rem'}}>尚未建立任何紀錄。</p>
                ) : (
                    <ul className="record-list">
                        {filteredRecords.map(record => (
                            <li key={record.id} className="record-item">
                                <div className="history-item-info">
                                    <strong>{record.topic || '無主題'}</strong>
                                    <span>講者: {record.speaker}</span>
                                    <span>日期: {new Date(record.date).toLocaleString()}</span>
                                </div>
                                <div className="history-item-actions">
                                    <button className="btn btn-secondary btn-sm" onClick={() => setEditingRecord(JSON.parse(JSON.stringify(record)))}>編輯</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRecord(record.id)}>刪除</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
             </div>
        )
    };
    
    const renderProfileView = () => {
        if (!isLoggedIn) {
            return (
                <div className="card profile-login-prompt">
                    <h2>建立您的專業檔案</h2>
                    <p>登入以編輯您的個人簡介、與他人連結並解鎖所有功能。</p>
                    <button className="btn btn-google" onClick={handleSimulatedLogin}>
                        <svg viewBox="0 0 48 48" width="24px" height="24px"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.082,5.571l6.19,5.238C39.904,36.213,44,30.668,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                        <span>使用 Google 帳號登入 (模擬)</span>
                    </button>
                </div>
            );
        }

        return (
            <div className="card profile-view">
                 <div className="my-pitches-header">
                    <h2>個人檔案</h2>
                    <div className="sub-nav">
                        <button className={`sub-nav-item ${profileViewTab === 'profile' ? 'active' : ''}`} onClick={() => setProfileViewTab('profile')}>我的簡介</button>
                        <button className="sub-nav-item" disabled>好友列表 (即將推出)</button>
                        <button className="sub-nav-item" disabled>訊息中心 (即將推出)</button>
                    </div>
                </div>
                
                {profileViewTab === 'profile' && (
                    <div className="profile-grid">
                        <div className="avatar-uploader">
                            <img src={userProfile.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${userProfile.unit || 'EP'}`} alt="User Avatar" className="profile-avatar" />
                             <input type="file" id="avatar-upload" accept="image/*" style={{display: 'none'}} onChange={handleAvatarChange} />
                            <label htmlFor="avatar-upload" className="btn btn-secondary btn-sm">上傳新照片</label>
                        </div>

                        <div className="profile-info">
                            <div className="editor-grid">
                                <div className="form-group"><label>單位</label><input type="text" className="input" value={userProfile.unit} onChange={e => handleUpdateProfile('unit', e.target.value)} /></div>
                                <div className="form-group"><label>系級 / 職稱</label><input type="text" className="input" value={userProfile.title} onChange={e => handleUpdateProfile('title', e.target.value)} /></div>
                                <div className="form-group"><label>電郵</label><input type="email" className="input" value={userProfile.email} onChange={e => handleUpdateProfile('email', e.target.value)} /></div>
                                <div className="form-group"><label>關注領域</label><input type="text" className="input" value={userProfile.interests} onChange={e => handleUpdateProfile('interests', e.target.value)} /></div>
                            </div>
                             <div className="form-group">
                                <label>經歷</label>
                                <textarea className="textarea" rows={4} value={userProfile.experience} onChange={e => handleUpdateProfile('experience', e.target.value)}></textarea>
                            </div>

                            <div className="custom-field-editor">
                                <h4>自訂資訊 (例如: 個人網站, LinkedIn)</h4>
                                {userProfile.customFields.map(field => (
                                    <div key={field.id} className="custom-field-item">
                                        <input type="text" placeholder="標籤 (例: LinkedIn)" className="input" value={field.label} onChange={e => handleUpdateCustomField(field.id, 'label', e.target.value)} />
                                        <input type="text" placeholder="內容 (例: https://...)" className="input" value={field.value} onChange={e => handleUpdateCustomField(field.id, 'value', e.target.value)} />
                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCustomField(field.id)}>&times;</button>
                                    </div>
                                ))}
                                <button className="btn btn-secondary btn-sm" onClick={handleAddCustomField}>新增自訂欄位</button>
                            </div>
                            
                            <div className="profile-actions">
                                <button className="btn btn-primary" onClick={() => setShowQrModal(true)}>顯示我的 QR Code</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    };

  return (
    <div className="container">
      {showLoginPrompt && renderLoginPrompt()}
      {showShareModal && renderShareModal()}
      {showTemplateManager && renderTemplateManager()}
      {viewingPitch && renderCommunityDetailModal()}
      {editingRecord && renderRecordEditorModal()}
      {showCamera && renderCameraModal()}
      {showQrModal && renderQrCodeModal()}

      <header className="header">
        <div className="header-content">
            <h1>Ele<span className="highlight">Pitch</span></h1>
            <p>一個專為新世代設計的短講訓練與交流平台。</p>
        </div>
        <div className="header-nav-wrapper">
            <nav className="header-nav">
              <button className={`nav-item ${activeView === 'create' ? 'active' : ''}`} onClick={() => setActiveView('create')}>短講創作</button>
              <button className={`nav-item ${activeView === 'mypitches' ? 'active' : ''}`} onClick={() => setActiveView('mypitches')}>我的講稿</button>
              <button className={`nav-item ${activeView === 'records' ? 'active' : ''}`} onClick={() => setActiveView('records')}>短講紀錄</button>
              <button className={`nav-item ${activeView === 'community' ? 'active' : ''}`} onClick={() => setActiveView('community')}>社群分享</button>
            </nav>
            <button className="profile-avatar-btn" onClick={() => setActiveView('profile')}>
                <img src={userProfile.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${userProfile.unit || 'EP'}`} alt="User Profile" />
            </button>
        </div>
      </header>
      <main>
        {activeView === 'create' && renderCreateView()}
        {activeView === 'mypitches' && renderMyPitchesView()}
        {activeView === 'records' && renderPitchRecordsView()}
        {activeView === 'community' && renderCommunityView()}
        {activeView === 'profile' && renderProfileView()}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
