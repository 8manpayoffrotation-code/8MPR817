import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """              <div className="w-full bg-[#111625] flex-1 flex flex-col p-5 sm:p-6 items-center overflow-y-auto relative no-scrollbar">
                <button
                  onClick={() => {
                    if (authMode === 'unified') {
                      setAuthMode('choose');
                      setAuthError(null);
                      setGmName('');
                      setPassword('');
                    } else {
                      setShowAuthModal(false);
                    }
                  }}
                  className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition-colors z-10 flex items-center justify-center gap-1 font-sans text-lg underline underline-offset-4"
                  title="Go back"
                >
                  ← Back
                </button>
                <div className="w-16 h-16 rounded-full bg-blue-900 border-2 border-blue-500 flex items-center justify-center mb-4 mt-2">
                  <Lock className="w-8 h-8 text-blue-300" />
                </div>
                
                <h2 className="text-3xl md:text-4xl font-sans font-bold text-white text-center mb-1 tracking-wide">
                  FRONT OFFICE ACCESS
                </h2>
                {authMode === 'unified' && (
                  <p className="text-slate-400 font-sans text-center text-sm md:text-base mb-6 max-w-[280px]">
                    Enter a handle and password to login or create a new GM profile.
                  </p>
                )}
                {authMode === 'choose' && <div className="mb-6"></div>}

                {authMode === 'choose' && (
                  <div className="w-full flex flex-col gap-4">
                    <button
                      onClick={() => setShowAuthModal(false)}
                      className="w-full bg-[#0f172a] text-white font-sans font-bold rounded-xl py-4 px-4 text-xl hover:brightness-110 active:scale-95 transition-all retro-box-blue uppercase"
                    >
                      FREE PLAY (GUEST)
                    </button>
                    <button
                      onClick={() => setAuthMode('unified')}
                      className="w-full bg-[#1e293b] text-white font-sans font-bold rounded-xl py-4 px-4 text-xl hover:brightness-110 active:scale-95 transition-all border-2 border-slate-600 shadow-md uppercase"
                    >
                      CREATE GM HANDLE / FRONT OFFICE LOGIN
                    </button>
                  </div>
                )}

                {authMode === 'unified' && (
                  <div className="w-full flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-blue-300 font-sans uppercase text-sm tracking-wider font-bold">GM Handle</label>
                      <div className="flex w-full">
                        <input
                          type="text"
                          value={gmName}
                          onChange={(e) => setGmName(e.target.value)}
                          className="flex-1 min-w-0 bg-slate-800 text-white font-sans text-xl px-4 py-3 border-2 border-r-0 border-slate-700 rounded-l-xl focus:outline-none focus:border-blue-500 focus:bg-slate-700 transition-colors placeholder:text-slate-500"
                          placeholder="e.g. PatRiley99"
                        />
                        <span className="text-slate-400 font-sans font-bold bg-slate-900 px-3 py-3 rounded-r-xl border-y-2 border-r-2 border-slate-700 flex items-center flex-shrink-0 text-sm md:text-base whitespace-nowrap">
                          @8mprhoops.net
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-2">
                      <label className="text-blue-300 font-sans uppercase text-sm tracking-wider font-bold">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 text-white font-sans text-xl px-4 py-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-slate-700 transition-colors"
                        placeholder="••••••••"
                      />
                    </div>

                    {authError && (
                      <div className="w-full bg-red-950/50 border border-red-500/50 rounded-lg p-3 flex items-start gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-200 text-sm font-sans leading-tight">{authError}</p>
                      </div>
                    )}

                    <button
                      onClick={handleAuthSubmit}
                      className="w-full text-white font-sans font-bold rounded-xl py-4 px-4 text-xl hover:brightness-110 active:scale-95 transition-all retro-box-dual uppercase"
                    >
                      ENTER FRONT OFFICE
                    </button>
                  </div>
                )}
              </div>"""

replacement = """              <div className="w-full bg-[#111625] flex-1 flex flex-col p-5 sm:p-6 items-center overflow-y-auto relative no-scrollbar">
                {gmName ? (
                  <>
                    <button 
                      onClick={() => setShowAuthModal(false)}
                      className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition-colors z-10 flex items-center justify-center gap-1 font-sans text-lg underline underline-offset-4"
                      title="Go back"
                    >
                      ← Back
                    </button>
                    
                    <div className="w-16 h-16 rounded-full bg-blue-900 border-2 border-blue-500 flex items-center justify-center mb-4 mt-2">
                      <Trophy className="w-8 h-8 text-blue-300" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-sans font-bold text-white text-center mb-1 tracking-wide uppercase">
                      Front Office Dashboard
                    </h2>
                    
                    <p className="text-slate-400 font-sans text-center text-sm md:text-base mb-6 max-w-[280px]">
                      Global rankings and GM analytics.
                    </p>

                    {isLoadingLeaderboard ? (
                      <div className="flex flex-col items-center justify-center py-10">
                        <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-4" />
                        <p className="text-slate-400 font-sans">Loading front office data...</p>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col gap-6 max-w-lg mt-2">
                        {/* Current GM Profile Summary */}
                        {leaderboardData.find(g => g.gmName === gmName) && (
                          <div className="bg-slate-800/80 border-2 border-slate-600 rounded-xl p-4 flex flex-col relative overflow-hidden retro-box-dual">
                            <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 font-black font-sans px-3 py-1 text-sm uppercase rounded-bl-lg">
                              Rank #{leaderboardData.find(g => g.gmName === gmName)?.globalRank}
                            </div>
                            <h3 className="text-xl font-black font-sans text-white mb-3 truncate">My GM Profile: @{gmName}</h3>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Avg Score</p>
                                <p className="text-xl font-black text-blue-400">{leaderboardData.find(g => g.gmName === gmName)?.averageScore}</p>
                              </div>
                              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Games Played</p>
                                <p className="text-xl font-black text-white">{leaderboardData.find(g => g.gmName === gmName)?.gamesPlayed}</p>
                              </div>
                              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Total Skips</p>
                                <p className="text-xl font-black text-red-400">{leaderboardData.find(g => g.gmName === gmName)?.totalSkips}</p>
                              </div>
                              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Dynasties</p>
                                <p className="text-xl font-black text-yellow-400">{leaderboardData.find(g => g.gmName === gmName)?.dynastyCount}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Global Leaderboard */}
                        <div className="bg-[#0f172a] border-2 border-slate-600 rounded-xl overflow-hidden flex flex-col max-h-[35vh]">
                          <div className="bg-slate-800 p-3 border-b-2 border-slate-600">
                            <h3 className="text-lg font-black font-sans text-white uppercase text-center flex items-center justify-center gap-2">
                              <Crown className="w-5 h-5 text-yellow-500" />
                              Global Leaderboard
                            </h3>
                          </div>
                          <div className="overflow-y-auto flex-1 p-2 flex flex-col gap-2">
                            {leaderboardData.length === 0 ? (
                              <p className="text-slate-400 text-center py-4 text-sm font-sans">No GM data available yet.</p>
                            ) : (
                              leaderboardData.map((gm, idx) => (
                                <div key={gm.gmName} className={`flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 ${gm.gmName === gmName ? 'bg-blue-900/40 border-blue-500/50' : 'bg-slate-800/40'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black font-sans text-sm flex-shrink-0 ${idx === 0 ? 'bg-yellow-500 text-yellow-900' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-700 text-slate-300'}`}>
                                    {gm.globalRank}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold font-sans truncate">@{gm.gmName}</p>
                                    <div className="flex gap-3 text-xs font-sans mt-0.5">
                                      <span className="text-slate-400"><span className="text-blue-300">Avg:</span> {gm.averageScore}</span>
                                      <span className="text-slate-400"><span className="text-slate-300">G:</span> {gm.gamesPlayed}</span>
                                    </div>
                                  </div>
                                  {gm.dynastyCount > 0 && (
                                    <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-md text-xs font-bold border border-yellow-500/30" title={`${gm.dynastyCount} Dynasty Architect Titles`}>
                                      <Crown className="w-3 h-3" />
                                      {gm.dynastyCount}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => {
                            setGmName('');
                            setAuthMode('choose');
                          }}
                          className="mt-2 text-slate-400 hover:text-white font-sans text-sm underline underline-offset-4 mb-2"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (authMode === 'unified') {
                          setAuthMode('choose');
                          setAuthError(null);
                          setGmName('');
                          setPassword('');
                        } else {
                          setShowAuthModal(false);
                        }
                      }}
                      className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition-colors z-10 flex items-center justify-center gap-1 font-sans text-lg underline underline-offset-4"
                      title="Go back"
                    >
                      ← Back
                    </button>
                    <div className="w-16 h-16 rounded-full bg-blue-900 border-2 border-blue-500 flex items-center justify-center mb-4 mt-2">
                      <Lock className="w-8 h-8 text-blue-300" />
                    </div>
                    
                    <h2 className="text-3xl md:text-4xl font-sans font-bold text-white text-center mb-1 tracking-wide">
                      FRONT OFFICE ACCESS
                    </h2>
                    {authMode === 'unified' && (
                      <p className="text-slate-400 font-sans text-center text-sm md:text-base mb-6 max-w-[280px]">
                        Enter a handle and password to login or create a new GM profile.
                      </p>
                    )}
                    {authMode === 'choose' && <div className="mb-6"></div>}

                    {authMode === 'choose' && (
                      <div className="w-full flex flex-col gap-4">
                        <button
                          onClick={() => setShowAuthModal(false)}
                          className="w-full bg-[#0f172a] text-white font-sans font-bold rounded-xl py-4 px-4 text-xl hover:brightness-110 active:scale-95 transition-all retro-box-blue uppercase"
                        >
                          FREE PLAY (GUEST)
                        </button>
                        <button
                          onClick={() => setAuthMode('unified')}
                          className="w-full bg-[#1e293b] text-white font-sans font-bold rounded-xl py-4 px-4 text-xl hover:brightness-110 active:scale-95 transition-all border-2 border-slate-600 shadow-md uppercase"
                        >
                          CREATE GM HANDLE / FRONT OFFICE LOGIN
                        </button>
                      </div>
                    )}

                    {authMode === 'unified' && (
                      <div className="w-full flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-blue-300 font-sans uppercase text-sm tracking-wider font-bold">GM Handle</label>
                          <div className="flex w-full">
                            <input
                              type="text"
                              value={gmName}
                              onChange={(e) => setGmName(e.target.value)}
                              className="flex-1 min-w-0 bg-slate-800 text-white font-sans text-xl px-4 py-3 border-2 border-r-0 border-slate-700 rounded-l-xl focus:outline-none focus:border-blue-500 focus:bg-slate-700 transition-colors placeholder:text-slate-500"
                              placeholder="e.g. PatRiley99"
                            />
                            <span className="text-slate-400 font-sans font-bold bg-slate-900 px-3 py-3 rounded-r-xl border-y-2 border-r-2 border-slate-700 flex items-center flex-shrink-0 text-sm md:text-base whitespace-nowrap">
                              @8mprhoops.net
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 mb-2">
                          <label className="text-blue-300 font-sans uppercase text-sm tracking-wider font-bold">Password</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800 text-white font-sans text-xl px-4 py-3 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-slate-700 transition-colors"
                            placeholder="••••••••"
                          />
                        </div>

                        {authError && (
                          <div className="w-full bg-red-950/50 border border-red-500/50 rounded-lg p-3 flex items-start gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-200 text-sm font-sans leading-tight">{authError}</p>
                          </div>
                        )}

                        <button
                          onClick={handleAuthSubmit}
                          className="w-full text-white font-sans font-bold rounded-xl py-4 px-4 text-xl hover:brightness-110 active:scale-95 transition-all retro-box-dual uppercase"
                        >
                          ENTER FRONT OFFICE
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>"""

if target in content:
    new_content = content.replace(target, replacement)
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)
    print("Replaced successfully!")
else:
    print("Target not found. Let's inspect the file.")
