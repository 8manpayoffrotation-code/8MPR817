with open('src/App.tsx', 'r') as f:
    content = f.read()

target = """                      setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
                    }}"""

replacement = """                      setCustomDraftSlots(Array(8).fill({ pos: '', teamOrConf: '', statOrAward: '', decade: '', draftYear: '', exclude: [] }));
                      setShowWelcome(true);
                      window.scrollTo(0, 0);
                    }}"""

content = content.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(content)
