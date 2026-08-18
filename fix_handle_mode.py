with open('src/App.tsx', 'r') as f:
    content = f.read()

old_handle = """  const handleModeSwitchClick = (overrideDecade?: string | React.MouseEvent) => {
    const currentSlots = isTeamBuilder ? teamBuilderSlots : slots;
    const hasProgress = currentSlots.some(s => s.player !== null);
    
    if (hasProgress) {
      if (typeof overrideDecade === 'string') {
        setPendingModeDecade(overrideDecade);
      } else {
        setPendingModeDecade(undefined);
      }
      setShowModeSwitchConfirm(true);
    } else {
      initTeamBuilder(overrideDecade);
    }
  };"""

new_handle = """  const handleModeSwitchClick = (overrideDecade?: string | React.MouseEvent) => {
    // If we are in Create Mode, there is no "progress" to lose since customDraftSlots don't hold players in the same way,
    // or maybe we just want to let them switch freely.
    let hasProgress = false;
    if (!isCreateMode) {
      const currentSlots = isTeamBuilder ? teamBuilderSlots : slots;
      hasProgress = currentSlots.some(s => s.player !== null);
    }
    
    if (hasProgress) {
      if (typeof overrideDecade === 'string') {
        setPendingModeDecade(overrideDecade);
      } else {
        setPendingModeDecade(undefined);
      }
      setShowModeSwitchConfirm(true);
    } else {
      initTeamBuilder(overrideDecade);
    }
  };"""

if old_handle in content:
    content = content.replace(old_handle, new_handle)
    print("Replaced handle successfully")
else:
    print("Could not find handleModeSwitchClick")

with open('src/App.tsx', 'w') as f:
    f.write(content)
