using UnityEngine;

namespace TowerLords.UI
{
    /// <summary>
    /// Single source of truth for the look of every panel in the game.
    /// Change a value here and it propagates everywhere, because nothing
    /// hard-codes a colour or a size of its own.
    /// </summary>
    public static class UITheme
    {
        // ---- Palette -------------------------------------------------------
        // Near-black stone with a warm lantern accent. The tower is cold; the
        // things you carry into it are warm.

        public static readonly Color Backdrop      = new Color(0.02f, 0.02f, 0.03f, 0.88f);
        public static readonly Color PanelBase     = new Color(0.06f, 0.06f, 0.07f, 0.98f);
        public static readonly Color PanelRaised   = new Color(0.09f, 0.09f, 0.11f, 1f);
        public static readonly Color PanelSunken   = new Color(0.04f, 0.04f, 0.05f, 1f);
        public static readonly Color Divider       = new Color(1f, 1f, 1f, 0.07f);

        public static readonly Color Accent        = new Color(0.85f, 0.65f, 0.30f, 1f); // lantern gold
        public static readonly Color AccentDim     = new Color(0.85f, 0.65f, 0.30f, 0.35f);
        public static readonly Color AccentHot     = new Color(1.00f, 0.80f, 0.42f, 1f);

        public static readonly Color TextPrimary   = new Color(0.92f, 0.91f, 0.88f, 1f);
        public static readonly Color TextSecondary = new Color(0.62f, 0.61f, 0.59f, 1f);
        public static readonly Color TextMuted     = new Color(0.40f, 0.40f, 0.39f, 1f);

        public static readonly Color Danger        = new Color(0.78f, 0.24f, 0.22f, 1f);
        public static readonly Color DangerDim     = new Color(0.78f, 0.24f, 0.22f, 0.30f);
        public static readonly Color Health        = new Color(0.72f, 0.18f, 0.16f, 1f);
        public static readonly Color Success       = new Color(0.42f, 0.68f, 0.36f, 1f);

        // Interactive states
        public static readonly Color ControlIdle    = new Color(0.14f, 0.14f, 0.16f, 1f);
        public static readonly Color ControlHover   = new Color(0.20f, 0.19f, 0.18f, 1f);
        public static readonly Color ControlPressed = new Color(0.26f, 0.22f, 0.14f, 1f);
        public static readonly Color ControlOff     = new Color(0.11f, 0.11f, 0.12f, 1f);

        // ---- Metrics -------------------------------------------------------

        public const float PanelPadding   = 22f;
        public const float RowHeight      = 34f;
        public const float RowSpacing     = 5f;
        public const float SectionSpacing = 18f;
        public const float TabHeight      = 42f;
        public const float NavWidth       = 190f;
        public const float ControlWidth   = 230f;

        // ---- Type ----------------------------------------------------------

        public const float FontSizeTitle   = 26f;
        public const float FontSizeSection = 15f;
        public const float FontSizeBody    = 15f;
        public const float FontSizeSmall   = 12.5f;

        // ---- Motion --------------------------------------------------------

        public const float FadeDuration    = 0.12f;
        public const float HudFadeDuration = 0.30f;

        /// <summary>Applied to disabled/locked content so it reads as unavailable rather than absent.</summary>
        public static Color Dimmed(Color c, float amount = 0.4f) => new Color(c.r, c.g, c.b, c.a * amount);
    }
}
