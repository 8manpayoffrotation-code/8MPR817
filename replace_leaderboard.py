import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                      <div className="w-full flex flex-col gap-6 max-w-lg mt-2">
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
                        </div>"""

replacement = """                      <div className="w-full flex flex-col gap-6 max-w-lg mt-2">
                        {/* Current GM Profile Summary */}
                        {(() => {
                          const myProfile = leaderboardData.find(g => g.gmName.toLowerCase() === gmName.toLowerCase()) || {
                            gmName: gmName,
                            globalRank: '-',
                            averageScore: '0.0',
                            gamesPlayed: 0,
                            totalSkips: 0,
                            dynastyCount: 0
                          };
                          
                          return (
                            <div className="bg-slate-800/80 border-2 border-slate-600 rounded-xl p-4 flex flex-col relative overflow-hidden retro-box-dual">
                              <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 font-black font-sans px-3 py-1 text-sm uppercase rounded-bl-lg">
                                Rank #{myProfile.globalRank}
                              </div>
                              <h3 className="text-xl font-black font-sans text-white mb-3 truncate">My GM Profile: @{gmName}</h3>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Avg Score</p>
                                  <p className="text-xl font-black text-blue-400">{myProfile.averageScore}</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Games Played</p>
                                  <p className="text-xl font-black text-white">{myProfile.gamesPlayed}</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Total Skips</p>
                                  <p className="text-xl font-black text-red-400">{myProfile.totalSkips}</p>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Dynasties</p>
                                  <p className="text-xl font-black text-yellow-400">{myProfile.dynastyCount}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

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
                              leaderboardData.map((gm, idx) => {
                                const isCurrentUser = gm.gmName.toLowerCase() === gmName.toLowerCase();
                                return (
                                  <div key={gm.gmName} className={`flex items-center gap-3 p-3 rounded-lg border border-slate-700/50 ${isCurrentUser ? 'bg-blue-900/40 border-blue-500/50' : 'bg-slate-800/40'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black font-sans text-sm flex-shrink-0 ${idx === 0 ? 'bg-yellow-500 text-yellow-900' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-700 text-slate-300'}`}>
                                      {gm.globalRank}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white font-bold font-sans truncate">@{gm.gmName}</p>
                                      <div className="flex gap-3 text-xs font-sans mt-0.5">
                                        <span className="text-slate-400"><span className="text-blue-300">Avg:</span> {gm.averageScore}</span>
                                        <span className="text-slate-400"><span className="text-slate-300">G:</span> {gm.gamesPlayed}</span>
                                        <span className="text-slate-400"><span className="text-red-300">Skips:</span> {gm.totalSkips}</span>
                                      </div>
                                    </div>
                                    {gm.dynastyCount > 0 && (
                                      <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-md text-xs font-bold border border-yellow-500/30" title={`${gm.dynastyCount} Dynasty Architect Titles`}>
                                        <Crown className="w-3 h-3" />
                                        {gm.dynastyCount}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>"""

if target in content:
    new_content = content.replace(target, replacement)
    with open('src/App.tsx', 'w') as f:
        f.write(new_content)
    print("Replaced successfully!")
else:
    print("Target not found. Let's inspect the file.")
