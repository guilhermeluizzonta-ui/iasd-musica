# Gera os PDFs de teste em www/perf/: vetor12.pdf (12 páginas, como exportado do MuseScore) e scan6.pdf (6 páginas escaneadas, 300 dpi)
# Uso (na raiz do projeto, depois de npm run build:web): python3 testes/perf/gerar-pdfs.py
import os, random
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from PIL import Image
os.makedirs('www/perf', exist_ok=True); W, H = A4
c = canvas.Canvas('www/perf/vetor12.pdf', pagesize=A4)
for p in range(12):
    c.setFont('Times-Bold', 18); c.drawCentredString(W / 2, H - 50, f'Hino de teste - pág {p+1}')
    for s in range(10):
        y = H - 110 - s * 70
        for l in range(5): c.line(40, y - l * 6, W - 40, y - l * 6)
        for n in range(24):
            x = 60 + n * 21; yy = y - random.randint(0, 8) * 3
            c.ellipse(x - 3.5, yy - 2.6, x + 3.5, yy + 2.6, fill=1); c.line(x + 3.3, yy, x + 3.3, yy + 20)
    c.showPage()
c.save()
c = canvas.Canvas('www/perf/scan6.pdf', pagesize=A4); random.seed(1)
for p in range(6):
    im = Image.new('L', (2480, 3508), 245); px = im.load()
    for k in range(60000): px[random.randrange(2480), random.randrange(3508)] = random.randrange(0, 120)
    f = f'www/perf/p{p}.jpg'; im.save(f, quality=80); c.drawImage(f, 0, 0, W, H); c.showPage(); os.remove(f)
c.save()
