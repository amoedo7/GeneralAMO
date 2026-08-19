from pathlib import Path
import re

html = Path('app/src/main/assets/index.html').read_text(encoding='utf-8')
java = Path('app/src/main/java/com/desarrollamo/generalamo/MainActivity.java').read_text(encoding='utf-8')
chrome = Path('app/src/main/java/com/desarrollamo/generalamo/MainActivityV2.java').read_text(encoding='utf-8')
manifest = Path('app/src/main/AndroidManifest.xml').read_text(encoding='utf-8')
version = Path('version.properties').read_text(encoding='utf-8')
icon = Path('app/src/main/res/drawable/ic_generalamo.xml').read_text(encoding='utf-8')

required_html = [
    'GeneralAMO', 'Anotar partida', 'Jugar con dados', 'localStorage', 'Tirar dados',
    'Deshacer', 'removePlayer', 'recordScore', 'startShare', 'Enlace para ver',
    'Enlace para editar', 'window.applyRemoteScore', 'scoreRecency', 'recencyClass',
    'mark-last', 'mark-prev', 'mark-old', 'Ya anotado', 'generalamo.state.v2',
    'function newGame()',
]
missing = [item for item in required_html if item not in html]
assert not missing, f'Missing MVP markers: {missing}'
assert 'eval(' not in html

required_java = ['addJavascriptInterface', 'ServerSocket', 'startSharing', 'updateSharedState', '/api/state', '/api/score']
missing_java = [item for item in required_java if item not in java]
assert not missing_java, f'Missing native sharing markers: {missing_java}'

required_chrome = ['WebChromeClient', 'onJsConfirm', 'result.confirm()', 'result.cancel()', 'AlertDialog']
missing_chrome = [item for item in required_chrome if item not in chrome]
assert not missing_chrome, f'Missing Android dialog regression markers: {missing_chrome}'

assert 'android.permission.INTERNET' in manifest
assert '@drawable/ic_generalamo' in manifest
assert '.MainActivityV2' in manifest
assert '<vector' in icon and '#FFFFFF' in icon

m_name = re.search(r'^VERSION_NAME=(.+)$', version, re.M)
m_code = re.search(r'^VERSION_CODE=(\d+)$', version, re.M)
assert m_name and m_code, 'Version properties missing'
assert m_name.group(1) == '0.1.11'
assert int(m_code.group(1)) == 1011

print('GENERALAMO_MVP_OK', m_name.group(1), m_code.group(1))
