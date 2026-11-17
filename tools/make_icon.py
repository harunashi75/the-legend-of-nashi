#!/usr/bin/env python3
"""Icône du jeu (build/icon.png, 512 × 512) : une épée dorée sur un écu vert, en pixel art.

Dessinée sur une grille de 32 × 32 pixels d'art, dans la facture du kit de pixel art du jeu (client/art/pixel-kit.js) :
aplats de quelques tons par matière, lumière venue d'en haut à gauche, contour d'un pixel d'encre #2a1810, puis
agrandie 16 fois sans flou. electron-builder en tire les icônes de Windows (.ico) et de Linux.

    python3 tools/make_icon.py            # écrit build/icon.png
Pour une autre icône, remplacer simplement build/icon.png (PNG carré de 512 × 512 au moins).
"""
from pathlib import Path

from PIL import Image

N, SCALE = 32, 16
INK = (0x2A, 0x18, 0x10, 255)
grid = [[None] * N for _ in range(N)]


def hexc(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def px(x, y, col):
    if 0 <= x < N and 0 <= y < N:
        grid[y][x] = hexc(col)


# Écu : vert, bord doré, éclairé en haut à gauche.
GREEN = ['#9ad868', '#6eb048', '#4a8a34', '#2e6224']
GOLD = ['#fff4b0', '#f0d060', '#c8a038', '#8a6a1e']
for y in range(4, 29):
    # Largeur : droite en haut, puis se resserre en pointe.
    half = 11 if y < 16 else max(0, round(11 * (1 - ((y - 16) / 13) ** 1.6)))
    for x in range(16 - half, 16 + half):
        rim = x in (16 - half, 16 + half - 1) or y == 4 or (y > 16 and (x - (16 - half) < 1 or (16 + half - 1) - x < 1))
        lit = -(x - 16) / 11 - (y - 12) / 16
        t = 0 if lit > 0.6 else 1 if lit > 0 else 2 if lit > -0.6 else 3
        px(x, y, GOLD[min(3, t + 1)] if rim else GREEN[t])
# Croix dorée sur l'écu.
for y in range(8, 24):
    px(15, y, GOLD[1]), px(16, y, GOLD[2])
for x in range(9, 23):
    px(x, 13, GOLD[1]), px(x, 14, GOLD[2])

# Épée en diagonale (de bas à gauche vers haut à droite) : lame d'acier, garde et pommeau dorés.
STEEL = ['#ffffff', '#dfe8f0', '#aab6c4', '#6e7c8c']
for i in range(0, 19):
    x, y = 9 + i, 22 - i
    px(x, y, STEEL[1]), px(x + 1, y, STEEL[2]), px(x, y - 1, STEEL[0] if i > 2 else STEEL[1])
px(28, 2, STEEL[1]), px(29, 2, STEEL[2]), px(29, 1, STEEL[1])
for d in range(-3, 4):  # garde
    px(8 + d, 22 + d, GOLD[1]), px(9 + d, 22 + d, GOLD[2])
for i in range(1, 5):  # poignée
    px(8 - i, 23 + i, '#8e5a30'), px(9 - i, 23 + i, '#663c1e')
px(3, 28, GOLD[0]), px(4, 28, GOLD[1]), px(3, 29, GOLD[2]), px(4, 29, GOLD[3])  # pommeau

# Contour d'un pixel d'encre autour de toutes les formes (comme outline du kit).
edge = [(x, y) for y in range(N) for x in range(N)
        if grid[y][x] is None and any(0 <= x + dx < N and 0 <= y + dy < N and grid[y + dy][x + dx] is not None
                                      for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
for x, y in edge:
    grid[y][x] = INK

img = Image.new('RGBA', (N, N), (0, 0, 0, 0))
for y in range(N):
    for x in range(N):
        if grid[y][x]:
            img.putpixel((x, y), grid[y][x])
out = Path(__file__).resolve().parent.parent / 'build' / 'icon.png'
out.parent.mkdir(exist_ok=True)
img.resize((N * SCALE, N * SCALE), Image.NEAREST).save(out)
print('Icône écrite :', out.relative_to(out.parent.parent))
