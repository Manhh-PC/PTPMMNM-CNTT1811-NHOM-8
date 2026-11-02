"""Build a source-only release; never include config, DB runtime, uploads or logs."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import sys
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root.parent/'PixelNote-PHP-MySQL.zip'
directories=['public','views','src','scripts','database','tests','docs','.github']
root_files=['.gitignore','.htaccess','config.example.php','README.md','LICENSE','CONTRIBUTING.md','ATTRIBUTIONS.md','TESTING.md','HUONG-DAN.html']
files=[root/f for f in root_files]
for directory in directories:
    files.extend(p for p in (root/directory).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
files.extend(root/'storage'/d/'.gitkeep' for d in ['uploads','logs','sessions','tmp'])
with ZipFile(out,'w',ZIP_DEFLATED) as z:
    for p in files:z.write(p,'pixelnote/'+p.relative_to(root).as_posix())
with ZipFile(out) as z:
    assert not any('config.local.php' in n or '/.runtime/' in n or 'sess_' in n for n in z.namelist())
    assert z.testzip() is None
print(f'Packaged {len(files)} files: {out} ({out.stat().st_size} bytes)')
