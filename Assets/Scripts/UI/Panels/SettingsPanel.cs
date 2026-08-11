using System.Collections.Generic;
using TMPro;
using TowerLords.Settings;
using UnityEngine;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// Five tabs, edited against a working copy so Cancel genuinely cancels.
    /// A live FPS readout sits in the footer, because changing a graphics setting
    /// and immediately seeing the cost is worth more than any description text.
    /// </summary>
    public class SettingsPanel : UIPanel
    {
        public const string Id = "settings";

        public override string PanelId => Id;
        public override string HotkeyAction => KeybindRegistry.PanelSettings;

        static readonly string[] TabNames = { "Gameplay", "Interface", "Graphics", "Audio", "Controls" };

        GameSettings _working;
        UITabBar _tabs;
        RectTransform _contentArea;
        readonly RectTransform[] _tabContent = new RectTransform[TabNames.Length];
        TextMeshProUGUI _fpsReadout;

        Resolution[] _resolutions;
        float _fpsAccumulator;
        int _fpsFrames;

        protected override void Build()
        {
            // Build() runs before OnOpened(), and the tab builders read the working
            // copy — so it has to exist before the first tab is laid out.
            _working ??= SettingsService.Current.Clone();

            var body = BuildWindow("Settings", new Vector2(1120f, 760f));

            _tabs = UITabBar.Create(body, TabNames);
            var tabRect = (RectTransform)_tabs.transform;
            tabRect.anchorMin = new Vector2(0f, 1f);
            tabRect.anchorMax = new Vector2(1f, 1f);
            tabRect.pivot = new Vector2(0.5f, 1f);
            tabRect.anchoredPosition = Vector2.zero;
            tabRect.sizeDelta = new Vector2(0f, UITheme.TabHeight);
            _tabs.SelectionChanged += ShowTab;

            _contentArea = UIFactory.Rect("ContentArea", body);
            _contentArea.anchorMin = Vector2.zero;
            _contentArea.anchorMax = Vector2.one;
            _contentArea.offsetMin = new Vector2(0f, 56f);
            _contentArea.offsetMax = new Vector2(0f, -(UITheme.TabHeight + 14f));

            BuildFooter(body);
            ShowTab(0);
        }

        protected override void OnOpened()
        {
            // Edit a copy: Cancel must leave the live settings untouched.
            _working = SettingsService.Current.Clone();
            RebuildAllTabs();
        }

        void RebuildAllTabs()
        {
            for (var i = 0; i < _tabContent.Length; i++)
            {
                if (_tabContent[i] == null) continue;
                // Destroy is deferred to end of frame; hide it now so the outgoing
                // tab doesn't render on top of the one replacing it.
                _tabContent[i].gameObject.SetActive(false);
                Destroy(_tabContent[i].gameObject);
                _tabContent[i] = null;
            }
            ShowTab(_tabs != null ? Mathf.Max(0, _tabs.SelectedIndex) : 0);
        }

        void ShowTab(int index)
        {
            for (var i = 0; i < _tabContent.Length; i++)
                if (_tabContent[i] != null) _tabContent[i].gameObject.SetActive(i == index);

            if (_tabContent[index] != null) return;

            var content = UIFactory.ScrollView("Tab_" + TabNames[index], _contentArea, out var scroll);
            var scrollRect = (RectTransform)scroll.transform;
            scrollRect.anchorMin = Vector2.zero;
            scrollRect.anchorMax = Vector2.one;
            scrollRect.offsetMin = Vector2.zero;
            scrollRect.offsetMax = Vector2.zero;

            _tabContent[index] = scrollRect;

            switch (index)
            {
                case 0: BuildGameplayTab(content); break;
                case 1: BuildInterfaceTab(content); break;
                case 2: BuildGraphicsTab(content); break;
                case 3: BuildAudioTab(content); break;
                case 4: BuildControlsTab(content); break;
            }
        }

        // ---- Tab: Gameplay ---------------------------------------------------

        void BuildGameplayTab(Transform c)
        {
            UIFactory.SectionHeader(c, "Camera");
            UIFactory.Divider(c);

            UIRows.Slider(c, "Field of View", null, 50f, 100f, _working.cameraFov,
                          v => $"{v:0}°", v => _working.cameraFov = v, wholeNumbers: true);
            UIRows.Slider(c, "Camera Distance", null, 6f, 22f, _working.cameraDistance,
                          v => $"{v:0.0}", v => _working.cameraDistance = v);
            UIRows.Slider(c, "Rotation Speed", null, 0f, 1f, _working.cameraRotationSpeed,
                          Percent, v => _working.cameraRotationSpeed = v);
            UIRows.Slider(c, "Camera Shake", "Intensity, not on/off — turn it down without losing the cue.",
                          0f, 1f, _working.cameraShakeIntensity, Percent,
                          v => _working.cameraShakeIntensity = v);
            UIRows.Slider(c, "Collision Sensitivity", null, 0f, 1f, _working.cameraCollisionSensitivity,
                          Percent, v => _working.cameraCollisionSensitivity = v);
            UIRows.Toggle(c, "Invert Vertical Axis", null, _working.invertCameraY,
                          v => _working.invertCameraY = v);

            UIRows.Section(c, "Combat Feedback");
            UIRows.Toggle(c, "Damage Numbers", null, _working.showDamageNumbers,
                          v => _working.showDamageNumbers = v);
            UIRows.Toggle(c, "Healing Numbers", null, _working.showHealNumbers,
                          v => _working.showHealNumbers = v);
            UIRows.Toggle(c, "Status Effect Text", null, _working.showStatusText,
                          v => _working.showStatusText = v);
            UIRows.Toggle(c, "Emphasise Critical Hits", null, _working.emphasizeCriticalHits,
                          v => _working.emphasizeCriticalHits = v);
            UIRows.Toggle(c, "Show Enemy Health Percent", null, _working.showEnemyHealthPercent,
                          v => _working.showEnemyHealthPercent = v);
            UIRows.Slider(c, "Enemy Telegraph Opacity",
                          "Dim attack indicators without hiding them.",
                          0.25f, 1f, _working.enemyTelegraphOpacity, Percent,
                          v => _working.enemyTelegraphOpacity = v);

            UIRows.Section(c, "Convenience");
            UIRows.Toggle(c, "Auto-Pickup Loot", null, _working.autoPickup,
                          v => _working.autoPickup = v);
            UIRows.Toggle(c, "Auto-Target Nearest Enemy", null, _working.autoTargetNearest,
                          v => _working.autoTargetNearest = v);
            UIRows.Toggle(c, "Double-Tap to Dodge", null, _working.doubleTapToDodge,
                          v => _working.doubleTapToDodge = v);
            UIRows.Toggle(c, "Stop Attacking on Target Change", null, _working.stopAttackOnTargetChange,
                          v => _working.stopAttackOnTargetChange = v);

            UIRows.Section(c, "Confirmations");
            UIRows.Note(c, "Death is permanent, so anything unrecoverable asks first. " +
                           "Each prompt can be silenced on its own.");
            UIRows.Toggle(c, "Confirm Stash Deposit", null, _working.confirmStashDeposit,
                          v => _working.confirmStashDeposit = v);
            UIRows.Toggle(c, "Confirm Stash Withdrawal", null, _working.confirmStashWithdraw,
                          v => _working.confirmStashWithdraw = v);
            UIRows.Toggle(c, "Confirm Entering the Tower", null, _working.confirmEnterTower,
                          v => _working.confirmEnterTower = v);
            UIRows.Toggle(c, "Confirm Abandoning a Run", null, _working.confirmAbandonRun,
                          v => _working.confirmAbandonRun = v);
            UIRows.Toggle(c, "<color=#C73E38>Warn When Stash Is At Risk</color>",
                          "Shown while a second death would wipe the stash permanently.",
                          _working.confirmStashAtRisk, v => _working.confirmStashAtRisk = v);
        }

        // ---- Tab: Interface --------------------------------------------------

        void BuildInterfaceTab(Transform c)
        {
            UIFactory.SectionHeader(c, "Scale");
            UIFactory.Divider(c);
            UIRows.Slider(c, "Interface Size", null, 0.75f, 1.5f, _working.uiScale,
                          Percent, v => _working.uiScale = v);
            UIRows.Toggle(c, "DPI Scaling", null, _working.dpiScaling, v => _working.dpiScaling = v);

            UIRows.Section(c, "Dynamic HUD");
            UIRows.Note(c, "Each element is controlled on its own. Fade Out Of Combat keeps the " +
                           "screen clear while exploring and brings the HUD back when it matters.");

            UIRows.EnumDropdown(c, "Ability Bar", null, _working.hudAbilityBar,
                                v => _working.hudAbilityBar = v);
            UIRows.EnumDropdown(c, "Health", null, _working.hudHealth,
                                v => _working.hudHealth = v);
            UIRows.EnumDropdown(c, "Floor Indicator", null, _working.hudFloorIndicator,
                                v => _working.hudFloorIndicator = v);
            UIRows.EnumDropdown(c, "Objectives", null, _working.hudObjectives,
                                v => _working.hudObjectives = v);
            UIRows.EnumDropdown(c, "Minimap", null, _working.hudMinimap,
                                v => _working.hudMinimap = v);
            UIRows.EnumDropdown(c, "Status Effects", null, _working.hudStatusEffects,
                                v => _working.hudStatusEffects = v);
            UIRows.Toggle(c, "Temporarily Show HUD on Notifications", null,
                          _working.temporarilyShowHudOnNotification,
                          v => _working.temporarilyShowHudOnNotification = v);

            UIRows.Section(c, "Nameplates");
            UIRows.Toggle(c, "Show Enemy Names", null, _working.showEnemyNameplates,
                          v => _working.showEnemyNameplates = v);
            UIRows.Toggle(c, "Show Enemy Health Bars", null, _working.showEnemyHealthBars,
                          v => _working.showEnemyHealthBars = v);
            UIRows.Toggle(c, "Scale With Distance", null, _working.nameplateScaleWithDistance,
                          v => _working.nameplateScaleWithDistance = v);

            UIRows.Section(c, "Minimap");
            UIRows.Slider(c, "Size", null, 0.7f, 1.4f, _working.minimapSize,
                          Percent, v => _working.minimapSize = v);
            UIRows.Slider(c, "Zoom", null, 0.5f, 2f, _working.minimapZoom,
                          Percent, v => _working.minimapZoom = v);
            UIRows.Toggle(c, "Rotate With Player", null, _working.minimapRotatesWithPlayer,
                          v => _working.minimapRotatesWithPlayer = v);
        }

        // ---- Tab: Graphics ---------------------------------------------------

        void BuildGraphicsTab(Transform c)
        {
            UIFactory.SectionHeader(c, "Display");
            UIFactory.Divider(c);

            _resolutions = FilterResolutions(Screen.resolutions);
            var resolutionNames = new string[_resolutions.Length];
            var currentResolution = 0;
            for (var i = 0; i < _resolutions.Length; i++)
            {
                resolutionNames[i] = $"{_resolutions[i].width} × {_resolutions[i].height}";
                if (_resolutions[i].width == _working.resolutionWidth &&
                    _resolutions[i].height == _working.resolutionHeight)
                    currentResolution = i;
            }

            UIRows.Dropdown(c, "Resolution", null, resolutionNames, currentResolution, i =>
            {
                _working.resolutionWidth = _resolutions[i].width;
                _working.resolutionHeight = _resolutions[i].height;
            });

            UIRows.EnumDropdown(c, "Display Mode", null, _working.displayMode,
                                v => _working.displayMode = v);

            var frameCaps = new[] { "Unlimited", "60", "90", "120", "144", "165", "240" };
            var frameValues = new[] { 0, 60, 90, 120, 144, 165, 240 };
            var frameIndex = System.Array.IndexOf(frameValues, _working.frameLimit);
            UIRows.Dropdown(c, "Frame Limit", null, frameCaps, Mathf.Max(0, frameIndex),
                            i => _working.frameLimit = frameValues[i]);

            UIRows.Toggle(c, "Vertical Sync", null, _working.vsync, v => _working.vsync = v);
            UIRows.Slider(c, "Gamma", null, 0.5f, 1.5f, _working.gamma,
                          v => $"{v:0.00}", v => _working.gamma = v);

            UIRows.Section(c, "Quality");
            UIRows.EnumDropdown(c, "Preset", null, _working.qualityPreset, v =>
            {
                _working.qualityPreset = v;
                ApplyQualityPreset(v);
                RebuildAllTabs();
            });
            UIRows.EnumDropdown(c, "Shadows", null, _working.shadowQuality,
                                v => { _working.shadowQuality = v; _working.qualityPreset = QualityPreset.Custom; });
            UIRows.EnumDropdown(c, "Anti-Aliasing", null, _working.antiAliasing,
                                v => { _working.antiAliasing = v; _working.qualityPreset = QualityPreset.Custom; });
            UIRows.EnumDropdown(c, "Textures", null, _working.textureQuality,
                                v => { _working.textureQuality = v; _working.qualityPreset = QualityPreset.Custom; });

            UIRows.Section(c, "Post-Processing");
            UIRows.Toggle(c, "Bloom", null, _working.bloom, v => _working.bloom = v);
            UIRows.Slider(c, "Motion Blur", "A slider rather than a switch — some is fine, lots isn't.",
                          0f, 1f, _working.motionBlurIntensity, Percent,
                          v => _working.motionBlurIntensity = v);
            UIRows.Toggle(c, "Depth of Field", null, _working.depthOfField, v => _working.depthOfField = v);
            UIRows.Toggle(c, "Vignette", null, _working.vignette, v => _working.vignette = v);
            UIRows.Toggle(c, "Chromatic Aberration", null, _working.chromaticAberration,
                          v => _working.chromaticAberration = v);
            UIRows.Toggle(c, "Film Grain", null, _working.filmGrain, v => _working.filmGrain = v);
        }

        void ApplyQualityPreset(QualityPreset preset)
        {
            switch (preset)
            {
                case QualityPreset.Low:
                    _working.shadowQuality = ShadowLevel.Off;
                    _working.antiAliasing = AntiAliasingMode.Off;
                    _working.textureQuality = TextureQuality.Low;
                    _working.bloom = false;
                    _working.depthOfField = false;
                    break;
                case QualityPreset.Medium:
                    _working.shadowQuality = ShadowLevel.Low;
                    _working.antiAliasing = AntiAliasingMode.FXAA;
                    _working.textureQuality = TextureQuality.Medium;
                    _working.bloom = true;
                    _working.depthOfField = false;
                    break;
                case QualityPreset.High:
                    _working.shadowQuality = ShadowLevel.High;
                    _working.antiAliasing = AntiAliasingMode.SMAA;
                    _working.textureQuality = TextureQuality.High;
                    _working.bloom = true;
                    _working.depthOfField = true;
                    break;
                case QualityPreset.Ultra:
                    _working.shadowQuality = ShadowLevel.High;
                    _working.antiAliasing = AntiAliasingMode.SMAA;
                    _working.textureQuality = TextureQuality.High;
                    _working.bloom = true;
                    _working.depthOfField = true;
                    _working.vignette = true;
                    break;
            }
        }

        static Resolution[] FilterResolutions(Resolution[] source)
        {
            // Collapse refresh-rate duplicates; the player picks a size, not a mode.
            var seen = new HashSet<long>();
            var result = new List<Resolution>();

            for (var i = source.Length - 1; i >= 0; i--)
            {
                var key = ((long)source[i].width << 32) | (uint)source[i].height;
                if (!seen.Add(key)) continue;
                result.Add(source[i]);
            }

            result.Reverse();
            return result.Count > 0 ? result.ToArray() : source;
        }

        // ---- Tab: Audio ------------------------------------------------------

        void BuildAudioTab(Transform c)
        {
            UIFactory.SectionHeader(c, "Volume");
            UIFactory.Divider(c);

            UIRows.Slider(c, "Master", null, 0f, 1f, _working.volumeMaster, Percent,
                          v => _working.volumeMaster = v);
            UIRows.Slider(c, "Music", null, 0f, 1f, _working.volumeMusic, Percent,
                          v => _working.volumeMusic = v);
            UIRows.Slider(c, "Sound Effects", null, 0f, 1f, _working.volumeSfx, Percent,
                          v => _working.volumeSfx = v);
            UIRows.Slider(c, "Interface", null, 0f, 1f, _working.volumeUi, Percent,
                          v => _working.volumeUi = v);
            UIRows.Slider(c, "Ambience", null, 0f, 1f, _working.volumeAmbient, Percent,
                          v => _working.volumeAmbient = v);

            UIRows.Section(c, "Behaviour");
            UIRows.Toggle(c, "Mute When Window Is Not Focused", null, _working.muteWhenUnfocused,
                          v => _working.muteWhenUnfocused = v);
        }

        // ---- Tab: Controls ---------------------------------------------------

        void BuildControlsTab(Transform c)
        {
            UIRows.Note(c, "Click a slot and press a key. Escape cancels, Delete clears the bind.");

            var categories = new[]
            {
                BindCategory.Movement, BindCategory.Combat,
                BindCategory.Panels, BindCategory.Interface, BindCategory.Misc
            };

            foreach (var category in categories)
            {
                UIRows.Section(c, category.ToString());
                foreach (var action in KeybindRegistry.Actions)
                {
                    if (action.Category != category) continue;
                    UIRows.Keybind(c, action, _working);
                }
            }
        }

        // ---- Footer ----------------------------------------------------------

        void BuildFooter(RectTransform body)
        {
            var footer = UIFactory.Rect("Footer", body);
            footer.anchorMin = new Vector2(0f, 0f);
            footer.anchorMax = new Vector2(1f, 0f);
            footer.pivot = new Vector2(0.5f, 0f);
            footer.sizeDelta = new Vector2(0f, 44f);
            footer.anchoredPosition = Vector2.zero;

            // Live perf readout: change a graphics setting, see the cost immediately.
            _fpsReadout = UIFactory.Text("Fps", footer, "", UITheme.FontSizeSmall, UITheme.TextMuted);
            var frt = _fpsReadout.rectTransform;
            frt.anchorMin = new Vector2(0f, 0f);
            frt.anchorMax = new Vector2(0.5f, 1f);
            frt.offsetMin = Vector2.zero;
            frt.offsetMax = Vector2.zero;
            _fpsReadout.alignment = TMPro.TextAlignmentOptions.Left;

            var buttons = UIFactory.Rect("Buttons", footer);
            buttons.anchorMin = new Vector2(1f, 0f);
            buttons.anchorMax = new Vector2(1f, 1f);
            buttons.pivot = new Vector2(1f, 0.5f);
            buttons.sizeDelta = new Vector2(520f, 0f);
            buttons.anchoredPosition = Vector2.zero;
            UIFactory.HorizontalLayout(buttons, 8f).childAlignment = TextAnchor.MiddleRight;

            var defaults = UIFactory.Button("Defaults", buttons, "Restore Defaults");
            UIFactory.SetWidth(defaults.gameObject, 160f);
            defaults.onClick.AddListener(() =>
            {
                _working = new GameSettings();
                KeybindRegistry.EnsureDefaults(_working);
                RebuildAllTabs();
            });

            var cancel = UIFactory.Button("Cancel", buttons, "Cancel");
            UIFactory.SetWidth(cancel.gameObject, 110f);
            cancel.onClick.AddListener(Close);

            var apply = UIFactory.Button("Apply", buttons, "Apply");
            UIFactory.SetWidth(apply.gameObject, 110f);
            apply.onClick.AddListener(Commit);

            var accept = UIFactory.Button("Accept", buttons, "OK", out var acceptLabel,
                                          idle: UITheme.AccentDim);
            acceptLabel.color = UITheme.AccentHot;
            UIFactory.SetWidth(accept.gameObject, 110f);
            accept.onClick.AddListener(() => { Commit(); Close(); });
        }

        void Commit()
        {
            SettingsService.Replace(_working.Clone());
        }

        void Update()
        {
            if (!IsOpen || _fpsReadout == null) return;

            _fpsAccumulator += Time.unscaledDeltaTime;
            _fpsFrames++;

            if (_fpsAccumulator < 0.25f) return;

            var fps = _fpsFrames / _fpsAccumulator;
            _fpsReadout.text = $"{fps:0} FPS   ·   {Screen.width}×{Screen.height}";
            _fpsAccumulator = 0f;
            _fpsFrames = 0;
        }

        static string Percent(float v) => $"{v * 100f:0}%";
    }
}
