#!/bin/bash

ICON_SRC="icon.png"
OUT_DIR="build/icons"
PYTHON="/home/tomexsans/dev/bin/python3"

echo "Generating icons from $ICON_SRC..."

# PNG sizes
for size in 16 32 48 64 128 256 512; do
    convert "$ICON_SRC" -resize ${size}x${size} "$OUT_DIR/${size}x${size}.png"
    echo "  $OUT_DIR/${size}x${size}.png"
done

# .ico
python3 -c "
from PIL import Image
img = Image.open('$ICON_SRC').convert('RGBA')
img.save('$OUT_DIR/icon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
print('  $OUT_DIR/icon.ico')
"

# .icns
$PYTHON -c "
import icnsutil, io
from PIL import Image

pack = icnsutil.IcnsFile()
size_map = {16: 'icp4', 32: 'icp5', 128: 'it32', 256: 'ic08', 512: 'ic09', 1024: 'ic10'}

for size, key in size_map.items():
    img = Image.open('$ICON_SRC').convert('RGBA').resize((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    pack.add_media(key, data=buf.getvalue())

pack.write('$OUT_DIR/icon.icns')
print('  $OUT_DIR/icon.icns')
"

echo "Done."
