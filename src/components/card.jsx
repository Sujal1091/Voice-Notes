    // / --- COMPONENT: AI SUMMARY CARD (Popup) ---
    const AiSummaryCard = ({ data, onClose }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [feedback, setFeedback] = useState(null);
    const [copied, setCopied] = useState(false);
    const [translationLang, setTranslationLang] = useState('en-US');

    const handleCopy = () => {
        const textToCopy = `${data.title}\n\nTL;DR: ${data.tldr}\n\n${data.summary}`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-50/50 to-white p-5 border-b border-gray-100 relative">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap justify-between items-start mb-3 pr-10">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
                <div className="p-1.5 bg-indigo-600 rounded-lg shadow-sm shadow-indigo-200">
                <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">AI Analysis</span>
            </div>

            {/* Translation Dropdown */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <select 
                    value={translationLang}
                    onChange={(e) => setTranslationLang(e.target.value)}
                    className="text-xs font-medium text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                >
                    <option value="en-US">English</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                </select>
            </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 leading-tight mb-2 pr-8">{data.title}</h2>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {data.readingTime}
            </div>
            <div className="flex items-center gap-1" title="AI Confidence Score">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.confidence}%` }}></div>
                </div>
                <span>{data.confidence}% confidence</span>
            </div>
            </div>
        </div>

        {/* TL;DR Section */}
        <div className="p-5 bg-indigo-50/30 border-b border-indigo-50">
            <div className="flex gap-3">
            <div className="mt-1 flex-shrink-0">
                <ArrowRight className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-1">TL;DR</h3>
                <p className="text-gray-800 text-sm leading-relaxed font-medium">
                {translationLang !== 'en-US' ? "[Translated Content Preview] " : ""}{data.tldr}
                </p>
            </div>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[60vh] overflow-y-auto">
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100' : 'opacity-50'}`}>
            <div className="p-6 space-y-8">
                
                {/* Detected Entities Section */}
                {(data.entities?.people?.length > 0 || data.entities?.dates?.length > 0 || data.entities?.locations?.length > 0) && (
                    <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detected Entities</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {data.entities.people?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2 text-indigo-600">
                                        <User className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold">People</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.entities.people.map((p, i) => (
                                            <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {data.entities.dates?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2 text-emerald-600">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold">Dates</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.entities.dates.map((d, i) => (
                                            <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                                                {d}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {data.entities.locations?.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2 text-amber-600">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="text-xs font-bold">Locations</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.entities.locations.map((l, i) => (
                                            <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">
                                                {l}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Key Takeaways */}
                <section>
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                    <List className="w-4 h-4 text-gray-500" />
                    Key Takeaways
                </h3>
                <ul className="space-y-2">
                    {data.keyPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 group-hover:bg-indigo-600 transition-colors"></div>
                        <span className="text-gray-600 text-sm leading-relaxed">{point}</span>
                    </li>
                    ))}
                </ul>
                </section>

                {/* Action Items */}
                <section className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <CheckCircle2 className="w-4 h-4 text-gray-500" />
                    Action Items
                    </h3>
                    <span className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                    {data.actionItems.length} detected
                    </span>
                </div>
                <div className="space-y-2">
                    {data.actionItems.map((item) => (
                    <label key={item.id} className="flex items-start gap-3 p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all cursor-pointer group">
                        <input 
                        type="checkbox" 
                        defaultChecked={item.status === 'done'}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                        />
                        <div className="flex-1">
                        <p className={`text-sm ${item.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {item.text}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            {item.owner && (
                                <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                    {item.owner}
                                </span>
                            )}
                        </div>
                        </div>
                    </label>
                    ))}
                </div>
                </section>

                {/* Detailed Summary */}
                {isExpanded && (
                <section>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Full Summary</h3>
                    <p className="text-sm text-gray-600 leading-7 text-justify">
                    {data.summary}
                    </p>
                </section>
                )}
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 pt-2">
                {data.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                    <Tag className="w-3 h-3" />
                    {tag}
                    </span>
                ))}
                </div>
            </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-medium transition-colors"
            >
            {isExpanded ? (
                <>Show Less <ChevronUp className="w-4 h-4" /></>
            ) : (
                <>Show Full Details <ChevronDown className="w-4 h-4" /></>
            )}
            </button>

            <div className="flex items-center gap-2">
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 shadow-sm">
                <button onClick={() => setFeedback('up')} className={`p-1.5 rounded-md transition-colors ${feedback === 'up' ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                <ThumbsUp className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-0.5"></div>
                <button onClick={() => setFeedback('down')} className={`p-1.5 rounded-md transition-colors ${feedback === 'down' ? 'text-rose-600 bg-rose-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                <ThumbsDown className="w-4 h-4" />
                </button>
            </div>

            <div className="h-4 w-px bg-gray-300 mx-1"></div>

            <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all font-medium">
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                {copied ? "Copied!" : "Copy"}
            </button>
            </div>
        </div>
        </div>
    );
    };
