using System.Collections.Generic;
using UnityEngine;

namespace TowerLords.UI
{
    /// <summary>
    /// Generates the handful of shapes the UI needs at runtime, so the project
    /// carries no sprite assets and the theme stays entirely in code.
    /// Results are cached — each shape is rasterised once per session.
    /// </summary>
    public static class UISprites
    {
        static readonly Dictionary<string, Sprite> Cache = new();

        /// <summary>Solid antialiased disc.</summary>
        public static Sprite Circle(int size = 256)
        {
            var key = $"circle_{size}";
            if (Cache.TryGetValue(key, out var cached)) return cached;

            var texture = NewTexture(size, size);
            var radius = size * 0.5f;
            var center = new Vector2(radius, radius);

            for (var y = 0; y < size; y++)
            for (var x = 0; x < size; x++)
            {
                var distance = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), center);
                var alpha = Mathf.Clamp01(radius - distance);   // 1px feathered edge
                texture.SetPixel(x, y, new Color(1f, 1f, 1f, alpha));
            }

            texture.Apply();
            return Cache[key] = ToSprite(texture);
        }

        /// <summary>Hollow ring, used as the orb's rim.</summary>
        public static Sprite Ring(int size = 256, float thickness = 10f)
        {
            var key = $"ring_{size}_{thickness}";
            if (Cache.TryGetValue(key, out var cached)) return cached;

            var texture = NewTexture(size, size);
            var outer = size * 0.5f;
            var inner = outer - thickness;
            var center = new Vector2(outer, outer);

            for (var y = 0; y < size; y++)
            for (var x = 0; x < size; x++)
            {
                var distance = Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), center);
                var alpha = Mathf.Clamp01(outer - distance) * Mathf.Clamp01(distance - inner);
                texture.SetPixel(x, y, new Color(1f, 1f, 1f, alpha));
            }

            texture.Apply();
            return Cache[key] = ToSprite(texture);
        }

        /// <summary>
        /// Rounded rectangle set up for 9-slicing, so one sprite scales to any
        /// panel size without distorting its corners.
        /// </summary>
        public static Sprite RoundedRect(int radius = 12, int border = 0)
        {
            var key = $"rounded_{radius}_{border}";
            if (Cache.TryGetValue(key, out var cached)) return cached;

            var size = radius * 2 + 4;
            var texture = NewTexture(size, size);

            for (var y = 0; y < size; y++)
            for (var x = 0; x < size; x++)
            {
                var alpha = RoundedAlpha(x, y, size, radius);

                if (border > 0)
                {
                    // Punch out the middle so only an outline remains.
                    var innerAlpha = RoundedAlpha(x, y, size, radius, inset: border);
                    alpha = Mathf.Clamp01(alpha - innerAlpha);
                }

                texture.SetPixel(x, y, new Color(1f, 1f, 1f, alpha));
            }

            texture.Apply();
            var slice = radius + 1;
            var sprite = Sprite.Create(texture, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f),
                                       100f, 0, SpriteMeshType.FullRect,
                                       new Vector4(slice, slice, slice, slice));
            sprite.name = key;
            return Cache[key] = sprite;
        }

        static float RoundedAlpha(int x, int y, int size, int radius, int inset = 0)
        {
            var effectiveRadius = radius - inset;
            var min = inset;
            var max = size - 1 - inset;

            if (x < min || y < min || x > max || y > max) return 0f;
            if (effectiveRadius <= 0) return 1f;

            // Distance to the nearest corner circle's centre, or fully inside.
            var cx = Mathf.Clamp(x, min + effectiveRadius, max - effectiveRadius);
            var cy = Mathf.Clamp(y, min + effectiveRadius, max - effectiveRadius);
            var distance = Vector2.Distance(new Vector2(x, y), new Vector2(cx, cy));

            return Mathf.Clamp01(effectiveRadius - distance + 0.5f);
        }

        static Texture2D NewTexture(int width, int height)
        {
            return new Texture2D(width, height, TextureFormat.RGBA32, mipChain: false)
            {
                filterMode = FilterMode.Bilinear,
                wrapMode = TextureWrapMode.Clamp,
                hideFlags = HideFlags.HideAndDontSave
            };
        }

        static Sprite ToSprite(Texture2D texture)
        {
            var sprite = Sprite.Create(texture, new Rect(0, 0, texture.width, texture.height),
                                       new Vector2(0.5f, 0.5f), 100f);
            sprite.name = texture.name;
            return sprite;
        }
    }
}
