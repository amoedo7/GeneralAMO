from pathlib import Path

html = Path('app/src/main/assets/index.html').read_text(encoding='utf-8')
required = [
    'GeneralAMO',
    'Anotar partida',
    'Jugar con dados',
    'localStorage',
    'Tirar dados',
    'Deshacer',
]
missing = [item for item in required if item not in html]
assert not missing, f'Missing MVP markers: {missing}'
assert 'http://' not in html and 'https://' not in html, 'MVP must stay offline/local-first'
assert 'eval(' not in html
print('GENERALAMO_MVP_OK')
