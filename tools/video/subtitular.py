"""Subtítulos estilo reel: palabra por palabra, la palabra que se dice resaltada.
Uso: python subtitular.py entrada.mp4 salida.mp4 [--color FFD400] [--palabras 3] [--pos 0.72]"""
import sys, os, argparse, subprocess, json
from faster_whisper import WhisperModel
p=argparse.ArgumentParser(); p.add_argument('src'); p.add_argument('dst')
p.add_argument('--color',default='7ED957'); p.add_argument('--palabras',type=int,default=3)
p.add_argument('--pos',type=float,default=0.70); p.add_argument('--font',default='Inter')
p.add_argument('--ffmpeg',default='ffmpeg'); p.add_argument('--modelo',default='small')
p.add_argument('--corregir',default='',help='errores=correcto separados por coma, ej. "Albi de=AdVibe,renda=venda"')
a=p.parse_args()
probe=subprocess.run([a.ffmpeg,'-i',a.src],capture_output=True,text=True).stderr
import re
m=re.search(r'Video:.*?(\d{3,5})x(\d{3,5})',probe); W,H=(int(m.group(1)),int(m.group(2))) if m else (1080,1920)
model=WhisperModel(a.modelo,device='cpu',compute_type='int8')
segs,_=model.transcribe(a.src,language='es',word_timestamps=True,vad_filter=True)
words=[w for s in segs for w in s.words]
fix=dict(x.split('=',1) for x in a.corregir.split(',') if '=' in x)
for w in words:
    k=w.word.strip().strip('.,!?¿¡').lower()
    for mal,bien in fix.items():
        if k==mal.lower(): w.word=w.word.replace(w.word.strip().strip('.,!?¿¡'),bien)
def t(x):
    h=int(x//3600); m_=int(x%3600//60); s=x%60; return f"{h}:{m_:02d}:{s:05.2f}"
bgr=a.color[4:6]+a.color[2:4]+a.color[0:2]
fs=int(W*0.075)
head=f"""[Script Info]
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: R,{a.font},{fs},&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,-1,0,0,0,100,100,0,0,1,{max(4,fs//12)},3,2,60,60,{int(H*(1-a.pos))},1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev=[]
for i in range(0,len(words),a.palabras):
    g=words[i:i+a.palabras]
    for j,w in enumerate(g):
        st=w.start; en=g[j+1].start if j+1<len(g) else w.end
        txt=' '.join((r'{\c&H'+bgr+r'&\fscx110\fscy110}'+x.word.strip().upper()+r'{\r}') if k==j else x.word.strip().upper() for k,x in enumerate(g))
        ev.append(f"Dialogue: 0,{t(st)},{t(en)},R,,0,0,0,,{{\\fad(40,0)}}{txt}")
ass=os.path.splitext(a.dst)[0]+'.ass'; open(ass,'w',encoding='utf-8').write(head+'\n'.join(ev)+'\n')
srt=os.path.splitext(a.dst)[0]+'.srt'
with open(srt,'w',encoding='utf-8') as f:
    for n,i in enumerate(range(0,len(words),6),1):
        g=words[i:i+6]; ts=lambda x:t(x).replace('.',',').rjust(11,'0')+'0'
        f.write(f"{n}\n0{ts(g[0].start)[0:]} --> 0{ts(g[-1].end)}\n{' '.join(x.word.strip() for x in g)}\n\n")
subprocess.run([a.ffmpeg,'-y','-i',a.src,'-vf',f"ass={ass}",'-c:v','libx264','-crf','18','-preset','medium','-c:a','aac','-b:a','192k','-movflags','+faststart',a.dst],check=True,capture_output=True)
print(json.dumps({'palabras':len(words),'texto':' '.join(w.word.strip() for w in words)[:300],'salida':a.dst,'ass':ass,'srt':srt},ensure_ascii=False))
