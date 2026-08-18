import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Swap Top Center and Bottom Center.
top_center_pattern = r'<div className="flex flex-col items-center justify-start border-l border-r border-slate-700/50 px-2 sm:px-4 w-\[110px\] sm:w-\[140px\] shrink-0 h-full">.*?</div>'
top_match = re.search(top_center_pattern, content, flags=re.DOTALL)
top_center = top_match.group(0)

bottom_center_pattern = r'<button\s+onClick=\{\(\) => \{.*?className="flex flex-col items-center justify-end w-\[110px\] sm:w-\[140px\] pb-1 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"\s*>.*?</button>'
bottom_match = re.search(bottom_center_pattern, content, flags=re.DOTALL)
if bottom_match:
    bottom_center = bottom_match.group(0)
else:
    print("Failed to find bottom center.")
    exit(1)

new_top_center = bottom_center.replace(
    'className="flex flex-col items-center justify-end w-[110px] sm:w-[140px] pb-1 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"',
    'className="flex flex-col items-center justify-start border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"'
)
new_top_center = new_top_center.replace('w-20 h-20 sm:w-24 sm:h-24 mb-3', 'w-16 h-16 sm:w-20 sm:h-20 mb-2')

new_bottom_center = top_center.replace(
    'className="flex flex-col items-center justify-start border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full"',
    'className="flex flex-col items-center justify-end border-l border-r border-slate-700/50 px-2 sm:px-4 w-[110px] sm:w-[140px] shrink-0 h-full pb-1"'
)

content = content.replace(top_center, '%%NEW_TOP_CENTER%%')
content = content.replace(bottom_center, '%%NEW_BOTTOM_CENTER%%')

content = content.replace('%%NEW_TOP_CENTER%%', new_top_center)
content = content.replace('%%NEW_BOTTOM_CENTER%%', new_bottom_center)

# 2. Fix the texts for TeamBuilder and CreateDraft
content = content.replace(
    '>\n                        TeamBuilder\n                      </span>',
    '>\n                        Team<br/>Builder\n                      </span>'
)
# Wait, CreateDraft text is currently split? Let's check what it is exactly:
content = content.replace(
    'Create\nDraft',
    'Create<br/>Draft'
)
content = content.replace(
    'Create\n                      Draft',
    'Create<br/>Draft'
)
content = content.replace(
    '>\n                        CreateDraft\n                      </span>',
    '>\n                        Create<br/>Draft\n                      </span>'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

print("Script complete.")
