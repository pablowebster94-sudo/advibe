# Subtítulos estilo reel

`subtitular.py` transcribe la voz del video (Whisper, español) y quema subtítulos palabra por palabra,
con la palabra que se dice resaltada. También deja un `.srt` y un `.ass` editables.

```bash
pip install faster-whisper          # una vez
python tools/video/subtitular.py entrada.mp4 salida.mp4 --color 7ED957 --palabras 3 --pos 0.70 \
  --corregir "Albi de=AdVibe,renda=venda"
```

- `--color`: color de la palabra resaltada (hex sin #). Verde AdVibe por defecto.
- `--palabras`: palabras por pantalla (2–4).
- `--pos`: altura del subtítulo (0 = arriba, 1 = abajo).
- `--corregir`: arregla nombres de marca o palabras mal transcritas.
- Requiere ffmpeg con libass. El modelo se descarga de Hugging Face la primera vez.
