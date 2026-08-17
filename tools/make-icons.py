# -*- coding: utf-8 -*-
"""生成 PWA 应用图标（绿色背景 + 白色翻面单词卡）"""
import zlib
import struct
import os


def write_png(path, w, h, get_pixel):
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filter byte
        for x in range(w):
            r, g, b, a = get_pixel(x, y)
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        c += struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
        return c

    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', ihdr)
           + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
           + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)


def rounded_rect(x, y, rw, rh, r):
    cx1, cy1 = x + r, y + r
    cx2, cy2 = x + rw - r, y + rh - r

    def inside(px, py):
        if px < x or px >= x + rw or py < y or py >= y + rh:
            return False
        if px < cx1 and py < cy1:
            return (px - cx1) ** 2 + (py - cy1) ** 2 <= r * r
        if px >= cx2 and py < cy1:
            return (px - cx2) ** 2 + (py - cy1) ** 2 <= r * r
        if px < cx1 and py >= cy2:
            return (px - cx1) ** 2 + (py - cy2) ** 2 <= r * r
        if px >= cx2 and py >= cy2:
            return (px - cx2) ** 2 + (py - cy2) ** 2 <= r * r
        return True
    return inside


def make_icon(size, path):
    BG = (76, 175, 80, 255)        # #4CAF50
    CARD1 = (255, 255, 255, 255)   # 白色前卡
    CARD2 = (182, 223, 189, 255)   # 浅绿后卡
    LINE = (158, 158, 158, 255)    # 灰色文字线
    LW = max(1, size // 64)        # 线条粗细

    cw = int(size * 0.58)
    ch = int(size * 0.66)
    r = int(size * 0.06)
    x2, y2 = int(size * 0.55), int(size * 0.36)  # 后卡
    x1, y1 = int(size * 0.34), int(size * 0.28)  # 前卡

    in2 = rounded_rect(x2, y2, cw, ch, r)
    in1 = rounded_rect(x1, y1, cw, ch, r)

    def on_lines(y, ys):
        for ly in ys:
            if abs(y - ly) <= LW:
                return True
        return False

    def get_pixel(x, y):
        if in2(x, y):
            ys = [y2 + int(ch * 0.30), y2 + int(ch * 0.45)]
            if on_lines(y, ys):
                return LINE
            return CARD2
        if in1(x, y):
            ys = [y1 + int(ch * 0.28), y1 + int(ch * 0.42), y1 + int(ch * 0.56)]
            if on_lines(y, ys):
                return LINE
            return CARD1
        return BG

    write_png(path, size, size, get_pixel)


if __name__ == '__main__':
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    make_icon(192, os.path.join(base, 'icon-192.png'))
    make_icon(512, os.path.join(base, 'icon-512.png'))
    print('OK: icon-192.png, icon-512.png')
