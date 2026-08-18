with open('src/App.tsx', 'r') as f:
    content = f.read()

old_init = """  const initTeamBuilder = (overrideDecade?: string | React.MouseEvent) => {
    const isMouseEvent = overrideDecade && typeof overrideDecade !== 'string';
    const targetDecadeStr = (typeof overrideDecade === 'string') ? overrideDecade : teamBuilderDecade;
    const newMode = (typeof overrideDecade === 'string') ? true : !isTeamBuilder;
    
    if (isCustomDraft) {
      window.location.href = window.location.pathname;
      return;
    }
    
    setIsTeamBuilder(newMode);
    setIsCreateMode(false);
    if (typeof overrideDecade === 'string') {
      setTeamBuilderDecade(overrideDecade);
    }"""

new_init = """  const initTeamBuilder = (overrideDecade?: string | React.MouseEvent) => {
    const isMouseEvent = overrideDecade && typeof overrideDecade !== 'string';
    const targetDecadeStr = (typeof overrideDecade === 'string') ? overrideDecade : teamBuilderDecade;
    const newMode = (typeof overrideDecade === 'string') ? true : !isTeamBuilder;
    
    if (isCustomDraft) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsCustomDraft(false);
    }
    
    setIsTeamBuilder(newMode);
    setIsCreateMode(false);
    if (typeof overrideDecade === 'string') {
      setTeamBuilderDecade(overrideDecade);
    }"""

if old_init in content:
    content = content.replace(old_init, new_init)
    print("Replaced successfully")
else:
    print("Could not find initTeamBuilder")

with open('src/App.tsx', 'w') as f:
    f.write(content)
