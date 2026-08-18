with open('src/App.tsx', 'r') as f:
    content = f.read()

old_block = """              <div className="retro-box-dual p-5 sm:p-7 flex flex-col items-center rounded-2xl shrink-0 w-[320px] sm:w-[420px] gap-6 relative mt-6 z-10">
                {/* Top Row: Playbook, Score, Front Office */}
                <div className="flex items-start justify-between w-full">
                  <button 
                    onClick={() => setShowPlaybook(true)}
                    className="flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-opacity w-[80px] sm:w-[90px] shrink-0 pt-1"
                  >
                    <ClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                    <span className="text-[10px] sm:text-[11px] text-yellow-400 uppercase tracking-widest font-bold font-sans text-center leading-tight whitespace-pre-wrap">8MPR<br/>Playbook</span>
                  </button>
                  
                  <div className="flex flex-col items-center justify-start border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full">
                    <span className="text-slate-400 text-[11px] sm:text-xs uppercase tracking-widest leading-[1.1] font-bold text-center mb-1">GM<br/>Score</span>
                    <span className="text-4xl sm:text-5xl font-retro text-yellow-400 leading-none mt-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] truncate w-full text-center">{totalScore.toFixed(1)}</span>
                  </div>
                  
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-opacity w-[80px] sm:w-[90px] shrink-0 pt-1"
                  >
                    <TableOfContents className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                    <span className="text-[10px] sm:text-[11px] text-yellow-400 uppercase tracking-widest font-bold font-sans text-center leading-tight whitespace-pre-wrap">Front<br/>Office</span>
                  </button>
                </div>

                {/* Bottom Row: Team Builder, Hoop/Trivia, Create Draft */}
                <div className="flex items-end justify-between w-full mt-2">
                  {/* Team Builder (Square-ish) */}
                  <div className="w-[80px] sm:w-[90px] flex flex-col items-center justify-end">
                    <button 
                      onClick={(e) => {
                        if (isTeamBuilder) return; // Already in Team Builder mode
                        handleModeSwitchClick(e);
                      }}
                      className="flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-opacity w-[80px] sm:w-[90px] shrink-0 pt-1 focus:outline-none"
                    >
                      <TeamworkIcon className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                      <span className="text-[10px] sm:text-[11px] text-yellow-400 uppercase tracking-widest font-bold font-sans text-center leading-tight whitespace-pre-wrap">
                        TeamBuilder
                      </span>
                    </button>
                  </div>

                  {/* Center Logo & Text */}
                  <button 
                    onClick={() => {
                      setIsCreateMode(false);
                      setIsTeamBuilder(false);
                      if (isCustomDraft) {
                        window.location.href = window.location.pathname;
                      }
                      setSlotPenalties(Array(8).fill(0));
                      setActiveDraftIndex(0);
                      setSearchQuery('');
                      setSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                      setTeamBuilderSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                      setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
                      setShowWelcome(false);
                      window.scrollTo(0, 0);
                    }}
                    className="flex flex-col items-center justify-end w-[110px] sm:w-[140px] pb-1 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mb-3 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                      <PixelBasketballHoopLogo className="w-full h-full relative z-10 drop-shadow-md" />
                    </div>
                    <span className="text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest font-sans text-center whitespace-nowrap">
                       {isCustomDraft ? 'Custom Draft' : 'Daily Trivia'}
                    </span>
                    <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest font-sans text-center mt-1">
                       {isCustomDraft ? '' : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </span>
                  </button>

                  {/* Create Draft (Square-ish) */}
                  <div className="w-[80px] sm:w-[90px] flex flex-col items-center justify-end">
                    <button 
                      onClick={() => {
                        if (isCreateMode) return; // Already in Create Mode
                        if (isCustomDraft) {
                          window.location.href = window.location.pathname;
                          return;
                        }
                        
                        setSlotPenalties(Array(8).fill(0));
                        setActiveDraftIndex(0);
                        setSearchQuery('');
                        setSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                        setTeamBuilderSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                        setIsLoadingCreateMode(true);
                        setCreateModeProgress(0);
                        let prog = 0;
                        const interval = setInterval(() => {
                          prog += 20;
                          setCreateModeProgress(Math.min(100, prog));
                          if (prog >= 100) {
                            clearInterval(interval);
                            setIsCreateMode(true);
                            setIsTeamBuilder(false);
                            setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
                            setIsLoadingCreateMode(false);
                          }
                        }, 50);
                      }}
                      className="flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-opacity w-[80px] sm:w-[90px] shrink-0 pt-1 focus:outline-none"
                    >
                      <DraftsIcon className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                      <span className="text-[10px] sm:text-[11px] text-yellow-400 uppercase tracking-widest font-bold font-sans text-center leading-tight whitespace-pre-wrap">
                        CreateDraft
                      </span>
                    </button>
                  </div>
                </div>
              </div>"""

new_block = """              <div className="retro-box-dual p-5 sm:p-7 flex flex-col items-center rounded-2xl shrink-0 w-[320px] sm:w-[420px] gap-6 relative mt-6 z-10">
                {/* Top Row: Playbook, Hoop Logo, Front Office */}
                <div className="flex items-start justify-between w-full">
                  <button 
                    onClick={() => setShowPlaybook(true)}
                    className="flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-opacity w-[80px] sm:w-[90px] shrink-0 pt-1"
                  >
                    <ClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                    <span className="text-[10px] sm:text-[11px] text-yellow-400 uppercase tracking-widest font-bold font-sans text-center leading-tight whitespace-pre-wrap">8MPR<br/>Playbook</span>
                  </button>
                  
                  {/* Center Logo & Text (Moved to Top) */}
                  <button 
                    onClick={() => {
                      setIsCreateMode(false);
                      setIsTeamBuilder(false);
                      if (isCustomDraft) {
                        window.location.href = window.location.pathname;
                      }
                      setSlotPenalties(Array(8).fill(0));
                      setActiveDraftIndex(0);
                      setSearchQuery('');
                      setSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                      setTeamBuilderSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                      setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
                      setShowWelcome(false);
                      window.scrollTo(0, 0);
                    }}
                    className="flex flex-col items-center justify-start border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                      <PixelBasketballHoopLogo className="w-full h-full relative z-10 drop-shadow-md" />
                    </div>
                    <span className="text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest font-sans text-center whitespace-nowrap">
                       {isCustomDraft ? 'Custom Draft' : 'Daily Trivia'}
                    </span>
                    <span className="text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest font-sans text-center mt-1">
                       {isCustomDraft ? '' : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </span>
                  </button>
                  
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-opacity w-[80px] sm:w-[90px] shrink-0 pt-1"
                  >
                    <TableOfContents className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                    <span className="text-[10px] sm:text-[11px] text-yellow-400 uppercase tracking-widest font-bold font-sans text-center leading-tight whitespace-pre-wrap">Front<br/>Office</span>
                  </button>
                </div>

                {/* Bottom Row: Team Builder, Score, Create Draft */}
                <div className="flex items-end justify-between w-full mt-2">
                  {/* Team Builder (Square-ish) */}
                  <div className="w-[80px] sm:w-[90px] flex flex-col items-center justify-end">
                    <button 
                      onClick={(e) => {
                        if (isTeamBuilder) return; // Already in Team Builder mode
                        handleModeSwitchClick(e);
                      }}
                      className="flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-opacity w-[80px] sm:w-[90px] shrink-0 pt-1 focus:outline-none"
                    >
                      <TeamworkIcon className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                      <span className="text-[10px] sm:text-[11px] text-yellow-400 uppercase tracking-widest font-bold font-sans text-center leading-tight whitespace-pre-wrap">
                        Team<br/>Builder
                      </span>
                    </button>
                  </div>

                  {/* GM Score (Moved to Bottom) */}
                  <div className="flex flex-col items-center justify-end border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full pb-1">
                    <span className="text-slate-400 text-[11px] sm:text-xs uppercase tracking-widest leading-[1.1] font-bold text-center mb-1">GM<br/>Score</span>
                    <span className="text-4xl sm:text-5xl font-retro text-yellow-400 leading-none mt-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] truncate w-full text-center">{totalScore.toFixed(1)}</span>
                  </div>

                  {/* Create Draft (Square-ish) */}
                  <div className="w-[80px] sm:w-[90px] flex flex-col items-center justify-end">
                    <button 
                      onClick={() => {
                        if (isCreateMode) return; // Already in Create Mode
                        if (isCustomDraft) {
                          window.location.href = window.location.pathname;
                          return;
                        }
                        
                        setSlotPenalties(Array(8).fill(0));
                        setActiveDraftIndex(0);
                        setSearchQuery('');
                        setSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                        setTeamBuilderSlots(current => current.map(s => ({ ...s, player: null, isValid: null })));
                        setIsLoadingCreateMode(true);
                        setCreateModeProgress(0);
                        let prog = 0;
                        const interval = setInterval(() => {
                          prog += 20;
                          setCreateModeProgress(Math.min(100, prog));
                          if (prog >= 100) {
                            clearInterval(interval);
                            setIsCreateMode(true);
                            setIsTeamBuilder(false);
                            setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
                            setIsLoadingCreateMode(false);
                          }
                        }, 50);
                      }}
                      className="flex flex-col items-center justify-start gap-2 hover:opacity-80 transition-opacity w-[80px] sm:w-[90px] shrink-0 pt-1 focus:outline-none"
                    >
                      <DraftsIcon className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />
                      <span className="text-[10px] sm:text-[11px] text-yellow-400 uppercase tracking-widest font-bold font-sans text-center leading-tight whitespace-pre-wrap">
                        Create<br/>Draft
                      </span>
                    </button>
                  </div>
                </div>
              </div>"""

# Ensure exact whitespace match by iterating or replace
if old_block in content:
    content = content.replace(old_block, new_block)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("Dashboard replaced successfully.")
else:
    print("Could not find the exact old_block.")
    import difflib
    # Debugging
    # Find closest match
