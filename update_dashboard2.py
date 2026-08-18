import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Swap Top Center and Bottom Center.
# Find Top Center (GM Score)
top_center_pattern = r'<div className="flex flex-col items-center justify-start border-l border-r border-slate-700/50 px-2 sm:px-4 w-\[110px\] sm:w-\[140px\] shrink-0 h-full">.*?</div>'
top_match = re.search(top_center_pattern, content, flags=re.DOTALL)
top_center = top_match.group(0)

# Find Bottom Center (Logo button)
bottom_center_pattern = r'<button[^>]*className="flex flex-col items-center justify-end w-\[110px\] sm:w-\[140px\] pb-1 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none".*?</button>'
bottom_match = re.search(bottom_center_pattern, content, flags=re.DOTALL)
bottom_center = bottom_match.group(0)

# Now we adjust their classes before swapping
# For Top Center (now Logo):
new_top_center = bottom_center.replace(
    'className="flex flex-col items-center justify-end w-[110px] sm:w-[140px] pb-1 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"',
    'className="flex flex-col items-center justify-start border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"'
)
# Also slightly reduce icon size to fit if needed, but original had "w-20 h-20 sm:w-24 sm:h-24 mb-3".
# Let's change `mb-3` to `mb-2` and `w-20` to `w-16` maybe, but wait, the prompt doesn't ask to change the logo size. It says "Move the PixelBasketballHoopLogo... to top row". 
# But wait, original top row logo sizing in `old_block` was `w-16 h-16 sm:w-20 sm:h-20`. Let's just adjust it to fit `justify-start`.
new_top_center = new_top_center.replace('w-20 h-20 sm:w-24 sm:h-24 mb-3', 'w-16 h-16 sm:w-20 sm:h-20 mb-2')

# For Bottom Center (now GM Score):
new_bottom_center = top_center.replace(
    'className="flex flex-col items-center justify-start border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full"',
    'className="flex flex-col items-center justify-end border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full pb-1"'
)

# Do the replacements
content = content.replace(top_center, '%%NEW_TOP_CENTER%%')
content = content.replace(bottom_center, '%%NEW_BOTTOM_CENTER%%')
content = content.replace('%%NEW_TOP_CENTER%%', new_top_center)
content = content.replace('%%NEW_BOTTOM_CENTER%%', new_bottom_center)

# 2. Fix the texts for TeamBuilder and CreateDraft
content = content.replace(
    'TeamBuilder',
    'Team<br/>Builder'
)
content = content.replace(
    'CreateDraft',
    'Create<br/>Draft'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Script complete.")
