from pathlib import Path

html = Path('app/src/main/assets/index.html').read_text(encoding='utf-8')
java = Path('app/src/main/java/com/desarrollamo/generalamo/MainActivity.java').read_text(encoding='utf-8')
manifest = Path('app/src/main/AndroidManifest.xml').read_text(encoding='utf-8')

required_html = [
    'GeneralAMO',
    'Anotar partida',
    'Jugar con dados',
    'localStorage',
    'Tirar dados',
    'Deshacer',
    'removePlayer',
    'recordScore',
    'startShare',
    'Enlace para ver',
    'Enlace para editar',
    'window.applyRemoteScore',
]
missing = [item for item in required_html if item not in html]
assert not missing, f'Missing MVP markers: {missing}'
assert 'eval(' not in html

required_java = [
    'addJavascriptInterface',
    'ServerSocket',
    'startSharing',
    'updateSharedState',
    '/api/state',
    '/api/score',
]
missing_java = [item for item in required_java if item not in java]
assert not missing_java, f'Missing native sharing markers: {missing_java}'
assert 'android.permission.INTERNET' in manifest

print('GENERALAMO_MVP_OK')
