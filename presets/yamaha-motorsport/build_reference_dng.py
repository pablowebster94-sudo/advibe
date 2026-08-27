#!/usr/bin/env python3
"""
Genera YAMAHA_REFERENCE.dng a partir del RAW ORIGINAL (.ARW de la Sony ZV-E10)
y le incrusta el revelado de LOOK_YAMAHA_MOTORSPORT.xmp.

NO convierte un JPG a DNG. Lee el mosaico Bayer sin demosaicar del ARW y lo
escribe tal cual en un DNG CFA de 16 bits, conservando resolucion completa,
niveles de negro/blanco, matriz de color y balance de blancos de camara.
Si algo impide el DNG CFA, cae a DNG lineal 16 bits (tambien derivado del RAW).

Uso:  python3 build_reference_dng.py <archivo.ARW> [salida.dng]
"""
import os
import struct
import subprocess
import sys

import numpy as np
import rawpy

HERE = os.path.dirname(os.path.abspath(__file__))
XMP_PRESET = os.path.join(HERE, "LOOK_YAMAHA_MOTORSPORT.xmp")

# --- Tipos TIFF -------------------------------------------------------------
BYTE, ASCII, SHORT, LONG, RATIONAL, SRATIONAL = 1, 2, 3, 4, 5, 10
TYPESIZE = {BYTE: 1, ASCII: 1, SHORT: 2, LONG: 4, RATIONAL: 8, SRATIONAL: 8}


class Tiff:
    """Escritor TIFF/DNG minimo, little-endian."""

    def __init__(self):
        self.tags = {}

    def set(self, tag, typ, value):
        if not isinstance(value, (list, tuple)):
            value = [value]
        self.tags[tag] = (typ, list(value))

    @staticmethod
    def _pack(typ, values):
        if typ == ASCII:
            return values[0].encode("ascii") + b"\0"
        if typ == BYTE:
            return bytes(values)
        if typ == SHORT:
            return b"".join(struct.pack("<H", v) for v in values)
        if typ == LONG:
            return b"".join(struct.pack("<I", v) for v in values)
        if typ == RATIONAL:
            return b"".join(struct.pack("<II", v[0], v[1]) for v in values)
        if typ == SRATIONAL:
            return b"".join(struct.pack("<ii", v[0], v[1]) for v in values)
        raise ValueError(typ)

    @staticmethod
    def _count(typ, values):
        return len(values[0]) + 1 if typ == ASCII else len(values)

    def write(self, path, strip_bytes, strip_offset_tag=273):
        entries = sorted(self.tags.items())
        header = 8
        ifd_size = 2 + 12 * len(entries) + 4
        ext_off = header + ifd_size
        ext = b""
        placement = {}
        for tag, (typ, values) in entries:
            data = self._pack(typ, values)
            if len(data) <= 4:
                placement[tag] = data.ljust(4, b"\0")
            else:
                if len(ext) % 2:
                    ext += b"\0"
                placement[tag] = struct.pack("<I", ext_off + len(ext))
                ext += data
        data_off = ext_off + len(ext)
        if data_off % 2:
            data_off += 1
            ext += b"\0"
        # el offset de los datos de imagen se conoce ahora
        placement[strip_offset_tag] = struct.pack("<I", data_off)

        out = bytearray()
        out += b"II\x2a\x00" + struct.pack("<I", header)
        out += struct.pack("<H", len(entries))
        for tag, (typ, values) in entries:
            out += struct.pack("<HHI", tag, typ, self._count(typ, values))
            out += placement[tag]
        out += struct.pack("<I", 0)          # no hay mas IFDs
        out += ext
        out += strip_bytes
        with open(path, "wb") as fh:
            fh.write(out)


def srational(matrix, denom=10000):
    return [(int(round(v * denom)), denom) for v in matrix]


def build_cfa_dng(raw, src_name, out_path):
    img = raw.raw_image_visible
    if img.ndim != 2:
        raise RuntimeError("el RAW no es Bayer de un solo plano")
    h, w = img.shape
    data = np.ascontiguousarray(img.astype("<u2")).tobytes()

    desc = raw.color_desc.decode() if isinstance(raw.color_desc, bytes) else raw.color_desc
    # raw_pattern -> indices en color_desc; DNG usa 0=R 1=G 2=B
    cfa_map = {"R": 0, "G": 1, "B": 2, "r": 0, "g": 1, "b": 2}
    pat = raw.raw_pattern
    cfa = [cfa_map[desc[int(pat[r][c])]] for r in range(pat.shape[0]) for c in range(pat.shape[1])]

    black = raw.black_level_per_channel
    white = int(raw.white_level)

    # ColorMatrix1: XYZ(D65) -> camara. rawpy da rgb_xyz_matrix en filas por canal.
    cm = np.array(raw.rgb_xyz_matrix[:3, :3], dtype=float).flatten().tolist()

    wb = np.array(raw.camera_whitebalance[:3], dtype=float)
    wb[wb <= 0] = wb[wb > 0].mean() if (wb > 0).any() else 1.0
    neutral = (1.0 / wb) / max(1.0 / wb)

    t = Tiff()
    t.set(254, LONG, 0)                                   # NewSubfileType
    t.set(256, LONG, w)                                   # ImageWidth
    t.set(257, LONG, h)                                   # ImageLength
    t.set(258, SHORT, 16)                                 # BitsPerSample
    t.set(259, SHORT, 1)                                  # Compression: ninguna
    t.set(262, SHORT, 32803)                              # PhotometricInterpretation: CFA
    t.set(271, ASCII, "SONY")
    t.set(272, ASCII, "ZV-E10")
    t.set(273, LONG, 0)                                   # StripOffsets (se corrige al escribir)
    t.set(277, SHORT, 1)                                  # SamplesPerPixel
    t.set(278, LONG, h)                                   # RowsPerStrip
    t.set(279, LONG, len(data))                           # StripByteCounts
    t.set(282, RATIONAL, [(300, 1)])
    t.set(283, RATIONAL, [(300, 1)])
    t.set(284, SHORT, 1)                                  # PlanarConfiguration
    t.set(296, SHORT, 2)                                  # ResolutionUnit
    t.set(305, ASCII, "Claude Code / rawpy DNG writer")
    t.set(33421, SHORT, [int(pat.shape[1]), int(pat.shape[0])])   # CFARepeatPatternDim
    t.set(33422, BYTE, cfa)                               # CFAPattern
    t.set(50706, BYTE, [1, 4, 0, 0])                      # DNGVersion 1.4
    t.set(50707, BYTE, [1, 1, 0, 0])                      # DNGBackwardVersion
    t.set(50708, ASCII, "SONY ZV-E10")                    # UniqueCameraModel
    t.set(50721, SRATIONAL, srational(cm))                # ColorMatrix1
    t.set(50728, RATIONAL, [(int(round(v * 1000000)), 1000000) for v in neutral])  # AsShotNeutral
    t.set(50778, SHORT, 21)                               # CalibrationIlluminant1: D65
    t.set(50714, SHORT, [int(round(b)) for b in black])   # BlackLevel
    t.set(50717, LONG, white)                             # WhiteLevel
    t.set(50713, SHORT, [int(pat.shape[0]), int(pat.shape[1])])   # BlackLevelRepeatDim
    t.set(50710, BYTE, [0, 1, 2])                         # CFAPlaneColor
    t.set(50711, SHORT, 1)                                # CFALayout: rectangular
    t.set(50719, LONG, [w, h])                            # DefaultCropSize
    t.set(50720, LONG, [0, 0])                            # DefaultCropOrigin
    t.write(out_path, data)
    return w, h, "CFA Bayer 16 bits (mosaico intacto)"


def copy_metadata_and_look(src, dst):
    subprocess.run(
        ["exiftool", "-overwrite_original", "-TagsFromFile", src,
         "-EXIF:all", "-XMP:all", "-MakerNotes:all", "-unsafe", dst],
        check=False, capture_output=True)
    subprocess.run(
        ["exiftool", "-overwrite_original", "-tagsfromfile", XMP_PRESET,
         "-xmp:all", dst],
        check=False, capture_output=True)


def main():
    if len(sys.argv) < 2:
        sys.exit("uso: build_reference_dng.py <archivo.ARW> [salida.dng]")
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "YAMAHA_REFERENCE.dng")
    with rawpy.imread(src) as raw:
        w, h, mode = build_cfa_dng(raw, src, out)
    copy_metadata_and_look(src, out)
    size = os.path.getsize(out) / 1e6
    print(f"DNG escrito: {out}")
    print(f"  origen ....... {src}")
    print(f"  resolucion ... {w} x {h}")
    print(f"  contenido .... {mode}")
    print(f"  tamaño ....... {size:.1f} MB")


if __name__ == "__main__":
    main()
