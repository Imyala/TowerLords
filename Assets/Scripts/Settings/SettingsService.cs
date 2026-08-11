using System;
using System.IO;
using UnityEngine;

namespace TowerLords.Settings
{
    /// <summary>
    /// Owns the live <see cref="GameSettings"/>, persists it as JSON, and pushes
    /// changes out to anything that cares. Systems should read
    /// <see cref="Current"/> and subscribe to <see cref="Changed"/> rather than
    /// caching values, so a settings edit takes effect immediately.
    /// </summary>
    public static class SettingsService
    {
        const string FileName = "settings.json";

        static GameSettings _current;
        static string _path;

        /// <summary>Raised whenever settings are applied, reset, or loaded.</summary>
        public static event Action<GameSettings> Changed;

        public static GameSettings Current
        {
            get
            {
                if (_current == null) Load();
                return _current;
            }
        }

        public static string FilePath =>
            _path ??= Path.Combine(Application.persistentDataPath, FileName);

        public static void Load()
        {
            _current = null;

            try
            {
                if (File.Exists(FilePath))
                {
                    var json = File.ReadAllText(FilePath);
                    _current = JsonUtility.FromJson<GameSettings>(json);
                }
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[Settings] Could not read {FilePath}, falling back to defaults. {e.Message}");
            }

            _current ??= new GameSettings();
            KeybindRegistry.EnsureDefaults(_current);
            Apply();
        }

        public static void Save()
        {
            try
            {
                var json = JsonUtility.ToJson(Current, prettyPrint: true);
                File.WriteAllText(FilePath, json);
            }
            catch (Exception e)
            {
                Debug.LogError($"[Settings] Failed to write {FilePath}: {e.Message}");
            }
        }

        /// <summary>Push the current values into the engine and notify listeners.</summary>
        public static void Apply()
        {
            var s = Current;
            ApplyGraphics(s);
            ApplyAudio(s);
            Changed?.Invoke(s);
        }

        /// <summary>Apply + persist. Called when the player confirms a settings screen.</summary>
        public static void ApplyAndSave()
        {
            Apply();
            Save();
        }

        /// <summary>Replaces the live settings wholesale — used when a settings panel
        /// cancels out of an edited copy, or restores defaults.</summary>
        public static void Replace(GameSettings settings, bool save = true)
        {
            _current = settings ?? new GameSettings();
            KeybindRegistry.EnsureDefaults(_current);
            if (save) ApplyAndSave();
            else Apply();
        }

        public static void ResetToDefaults()
        {
            var fresh = new GameSettings();
            KeybindRegistry.EnsureDefaults(fresh);
            Replace(fresh);
        }

        // ---- Engine application ---------------------------------------------

        static void ApplyGraphics(GameSettings s)
        {
            // Frame pacing. vSync wins over an explicit cap when both are set.
            QualitySettings.vSyncCount = s.vsync ? 1 : 0;
            Application.targetFrameRate = s.vsync || s.frameLimit <= 0 ? -1 : s.frameLimit;

            var mode = s.displayMode switch
            {
                DisplayMode.Fullscreen => FullScreenMode.ExclusiveFullScreen,
                DisplayMode.Windowed   => FullScreenMode.Windowed,
                _                      => FullScreenMode.FullScreenWindow
            };

            var width  = s.resolutionWidth  > 0 ? s.resolutionWidth  : Screen.width;
            var height = s.resolutionHeight > 0 ? s.resolutionHeight : Screen.height;

            if (width != Screen.width || height != Screen.height || mode != Screen.fullScreenMode)
                Screen.SetResolution(width, height, mode);

            QualitySettings.shadows = s.shadowQuality switch
            {
                ShadowLevel.Off => UnityEngine.ShadowQuality.Disable,
                ShadowLevel.Low => UnityEngine.ShadowQuality.HardOnly,
                _                 => UnityEngine.ShadowQuality.All
            };

            QualitySettings.shadowResolution = s.shadowQuality switch
            {
                ShadowLevel.Low    => UnityEngine.ShadowResolution.Low,
                ShadowLevel.Medium => UnityEngine.ShadowResolution.Medium,
                _                    => UnityEngine.ShadowResolution.High
            };

            QualitySettings.shadowDistance = s.shadowQuality switch
            {
                ShadowLevel.Off    => 0f,
                ShadowLevel.Low    => 30f,
                ShadowLevel.Medium => 60f,
                _                    => 110f
            };

            // 0 = full res, each step halves. Low-end machines gain the most here.
            QualitySettings.globalTextureMipmapLimit = s.textureQuality switch
            {
                TextureQuality.Low    => 2,
                TextureQuality.Medium => 1,
                _                     => 0
            };
        }

        static void ApplyAudio(GameSettings s)
        {
            // Master is applied globally; per-category volumes are consumed by
            // AudioService, which routes individual sources.
            AudioListener.volume = Mathf.Clamp01(s.volumeMaster);
        }

        /// <summary>Category volume including the master multiplier, for AudioService.</summary>
        public static float EffectiveVolume(AudioCategory category)
        {
            var s = Current;
            return category switch
            {
                AudioCategory.Music   => s.volumeMusic,
                AudioCategory.Sfx     => s.volumeSfx,
                AudioCategory.Ui      => s.volumeUi,
                AudioCategory.Ambient => s.volumeAmbient,
                _                     => 1f
            };
        }
    }

    public enum AudioCategory { Master, Music, Sfx, Ui, Ambient }
}
