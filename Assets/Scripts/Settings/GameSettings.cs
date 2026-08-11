using System;
using System.Collections.Generic;
using UnityEngine;

namespace TowerLords.Settings
{
    /// <summary>How an individual HUD element behaves. Borrowed from GW2's Dynamic HUD:
    /// every element is independently controllable rather than one global "hide UI".</summary>
    public enum HudVisibility
    {
        AlwaysShow = 0,
        FadeOutOfCombat = 1,
        Hidden = 2
    }

    public enum QualityPreset { Low = 0, Medium = 1, High = 2, Ultra = 3, Custom = 4 }
    public enum ShadowLevel { Off = 0, Low = 1, Medium = 2, High = 3 }
    public enum AntiAliasingMode { Off = 0, FXAA = 1, SMAA = 2 }
    public enum TextureQuality { Low = 0, Medium = 1, High = 2 }
    public enum DisplayMode { Fullscreen = 0, Borderless = 1, Windowed = 2 }

    [Serializable]
    public class KeybindEntry
    {
        public string action;
        public string primary;
        public string secondary;

        public KeybindEntry() { }

        public KeybindEntry(string action, string primary, string secondary)
        {
            this.action = action;
            this.primary = primary;
            this.secondary = secondary;
        }
    }

    /// <summary>
    /// Every player-facing preference in one serialisable blob. Field names are the
    /// save format, so rename with care — <see cref="SettingsService"/> writes this
    /// straight to JSON.
    /// </summary>
    [Serializable]
    public class GameSettings
    {
        public int version = 1;

        // ---- Gameplay: camera ---------------------------------------------
        public float cameraFov = 70f;                 // 50–100
        public float cameraDistance = 12f;            // 6–22
        public float cameraRotationSpeed = 0.5f;      // 0–1
        public float cameraShakeIntensity = 1f;       // 0–1, a slider not a toggle
        public float cameraCollisionSensitivity = 0.5f;
        public bool invertCameraY = false;

        // ---- Gameplay: combat feedback ------------------------------------
        public bool showDamageNumbers = true;
        public bool showHealNumbers = true;
        public bool showStatusText = true;
        public bool emphasizeCriticalHits = true;
        public bool showEnemyHealthPercent = false;

        /// <summary>Enemy attack telegraphs can be dimmed for readability without
        /// disabling them, so the information stays but the clutter drops.</summary>
        public float enemyTelegraphOpacity = 1f;      // 0.25–1

        // ---- Gameplay: convenience ----------------------------------------
        public bool autoPickup = true;
        public bool autoTargetNearest = true;
        public bool doubleTapToDodge = false;
        public bool stopAttackOnTargetChange = false;

        // ---- Gameplay: confirmations --------------------------------------
        // Permadeath means several actions are unrecoverable. Each gets its own
        // opt-out so a player can silence the routine ones and keep the fatal one.
        public bool confirmStashDeposit = false;
        public bool confirmStashWithdraw = false;
        public bool confirmAbandonRun = true;
        public bool confirmEnterTower = false;
        /// <summary>Second consecutive death wipes the stash permanently. This warning
        /// defaults on and should stay loud.</summary>
        public bool confirmStashAtRisk = true;

        // ---- Interface -----------------------------------------------------
        public float uiScale = 1f;                    // 0.75–1.5
        public bool dpiScaling = true;

        public HudVisibility hudAbilityBar = HudVisibility.AlwaysShow;
        public HudVisibility hudHealth = HudVisibility.AlwaysShow;
        public HudVisibility hudFloorIndicator = HudVisibility.AlwaysShow;
        public HudVisibility hudObjectives = HudVisibility.AlwaysShow;
        public HudVisibility hudMinimap = HudVisibility.AlwaysShow;
        public HudVisibility hudStatusEffects = HudVisibility.AlwaysShow;
        public bool temporarilyShowHudOnNotification = true;

        public bool showEnemyNameplates = false;
        public bool showEnemyHealthBars = true;
        public bool nameplateScaleWithDistance = true;

        public float minimapSize = 1f;                // 0.7–1.4
        public float minimapZoom = 1f;
        public bool minimapRotatesWithPlayer = false;

        // ---- Graphics ------------------------------------------------------
        public int resolutionWidth = 0;               // 0 = use current display
        public int resolutionHeight = 0;
        public DisplayMode displayMode = DisplayMode.Borderless;
        public int frameLimit = 0;                    // 0 = unlimited
        public bool vsync = false;
        public float gamma = 1f;                      // 0.5–1.5

        public QualityPreset qualityPreset = QualityPreset.High;
        public ShadowLevel shadowQuality = ShadowLevel.High;
        public AntiAliasingMode antiAliasing = AntiAliasingMode.SMAA;
        public TextureQuality textureQuality = TextureQuality.High;

        public bool bloom = true;
        public float motionBlurIntensity = 0f;        // slider, not a toggle
        public bool depthOfField = true;
        public bool chromaticAberration = false;
        public bool vignette = true;
        public bool filmGrain = false;

        // ---- Audio ---------------------------------------------------------
        public float volumeMaster = 1f;
        public float volumeMusic = 0.7f;
        public float volumeSfx = 1f;
        public float volumeUi = 0.8f;
        public float volumeAmbient = 0.8f;
        public bool muteWhenUnfocused = true;

        // ---- Controls ------------------------------------------------------
        public List<KeybindEntry> keybinds = new List<KeybindEntry>();

        public GameSettings Clone()
        {
            var copy = (GameSettings)MemberwiseClone();
            copy.keybinds = new List<KeybindEntry>(keybinds.Count);
            foreach (var k in keybinds)
                copy.keybinds.Add(new KeybindEntry(k.action, k.primary, k.secondary));
            return copy;
        }
    }
}
