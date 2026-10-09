import sys
from PIL import Image
src, prefix = sys.argv[1], sys.argv[2]
step = int(sys.argv[3]) if len(sys.argv) > 3 else 1800
im = Image.open(src); w, h = im.size
n = 0
for y in range(0, h, step):
    im.crop((0, y, w, min(h, y + step))).save(f'{prefix}{n}.png'); n += 1
print(n, im.size)
