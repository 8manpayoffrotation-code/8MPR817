with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'TeamBuilder\n                      </span>',
    'Team<br/>Builder\n                      </span>'
)

# And fix comments
content = content.replace(
    '{/* Top Row: Playbook, Score, Front Office */}',
    '{/* Top Row: Playbook, Logo, Front Office */}'
)
content = content.replace(
    '{/* Bottom Row: Team Builder, Hoop/Trivia, Create Draft */}',
    '{/* Bottom Row: Team Builder, Score, Create Draft */}'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("done")
