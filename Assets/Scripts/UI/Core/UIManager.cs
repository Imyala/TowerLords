using System.Collections.Generic;
using TowerLords.Settings;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// Owns the UI canvas, the panel registry, Escape handling and pause state.
    ///
    /// Gameplay code should check <see cref="InputCaptured"/> before reading world
    /// input, so a panel being open never leaks clicks into the game.
    /// </summary>
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        /// <summary>True while a panel wants exclusive input. Gameplay must not act.</summary>
        public static bool InputCaptured =>
            Instance != null && (Instance._openPanels.Count > 0 || Instance.IsCapturingRebind);

        /// <summary>Set by the keybind row while it waits for a key, so panel hotkeys
        /// don't fire as the player presses the key they're trying to bind.</summary>
        public bool IsCapturingRebind { get; set; }

        public Canvas Canvas { get; private set; }
        public CanvasScaler Scaler { get; private set; }
        public RectTransform PanelLayer { get; private set; }
        public RectTransform HudLayer { get; private set; }

        readonly Dictionary<string, UIPanel> _panels = new();
        readonly List<UIPanel> _openPanels = new();

        float _timeScaleBeforePause = 1f;
        bool _paused;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);

            BuildCanvas();
            UIFactory.EnsureEventSystem();

            SettingsService.Changed += OnSettingsChanged;
            OnSettingsChanged(SettingsService.Current);
        }

        void OnDestroy()
        {
            SettingsService.Changed -= OnSettingsChanged;
            if (Instance == this) Instance = null;
        }

        void BuildCanvas()
        {
            var canvasGo = new GameObject("UICanvas", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasGo.transform.SetParent(transform, false);

            Canvas = canvasGo.GetComponent<Canvas>();
            Canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            Canvas.sortingOrder = 100;

            Scaler = canvasGo.GetComponent<CanvasScaler>();
            Scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            Scaler.referenceResolution = new Vector2(1920f, 1080f);
            Scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            Scaler.matchWidthOrHeight = 0.5f;

            // The HUD sits under panels so an open menu always reads as on top.
            HudLayer = UIFactory.Stretch("HudLayer", canvasGo.transform);
            PanelLayer = UIFactory.Stretch("PanelLayer", canvasGo.transform);
        }

        void OnSettingsChanged(GameSettings settings)
        {
            if (Scaler == null) return;
            Scaler.scaleFactor = 1f;
            Scaler.referenceResolution = new Vector2(1920f / settings.uiScale, 1080f / settings.uiScale);
        }

        // ---- Registry --------------------------------------------------------

        public T RegisterPanel<T>() where T : UIPanel
        {
            var go = new GameObject(typeof(T).Name, typeof(RectTransform), typeof(CanvasGroup));
            go.transform.SetParent(PanelLayer, false);
            var panel = go.AddComponent<T>();
            _panels[panel.PanelId] = panel;
            return panel;
        }

        public UIPanel GetPanel(string panelId) => _panels.TryGetValue(panelId, out var p) ? p : null;

        public T GetPanel<T>() where T : UIPanel
        {
            foreach (var panel in _panels.Values)
                if (panel is T typed) return typed;
            return null;
        }

        public void TogglePanel(string panelId) => GetPanel(panelId)?.Toggle();

        public void OpenPanel(string panelId) => GetPanel(panelId)?.Open();

        public void CloseAll()
        {
            for (var i = _openPanels.Count - 1; i >= 0; i--)
                _openPanels[i].Close();
        }

        // ---- Panel stack -----------------------------------------------------

        public void NotifyPanelOpened(UIPanel panel)
        {
            if (_openPanels.Contains(panel)) return;
            _openPanels.Add(panel);

            // Newly opened panels draw above whatever is already up.
            panel.transform.SetAsLastSibling();
            RefreshPauseState();
        }

        public void NotifyPanelClosed(UIPanel panel)
        {
            _openPanels.Remove(panel);
            RefreshPauseState();
        }

        void RefreshPauseState()
        {
            var shouldPause = false;
            foreach (var panel in _openPanels)
            {
                if (!panel.PausesGame) continue;
                shouldPause = true;
                break;
            }

            if (shouldPause == _paused) return;

            if (shouldPause)
            {
                _timeScaleBeforePause = Time.timeScale > 0f ? Time.timeScale : 1f;
                Time.timeScale = 0f;
            }
            else
            {
                Time.timeScale = _timeScaleBeforePause;
            }

            _paused = shouldPause;
        }

        // ---- Input -----------------------------------------------------------

        void Update()
        {
            if (IsCapturingRebind) return;

            if (Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame)
            {
                HandleEscape();
                return;
            }

            foreach (var panel in _panels.Values)
            {
                var action = panel.HotkeyAction;
                if (string.IsNullOrEmpty(action)) continue;
                if (KeybindRegistry.WasPressedThisFrame(action))
                {
                    panel.Toggle();
                    return;
                }
            }
        }

        void HandleEscape()
        {
            // Escape acts on the topmost panel only. If that panel refuses Escape
            // (a confirmation waiting on an answer), the key does nothing.
            if (_openPanels.Count > 0)
            {
                var top = _openPanels[_openPanels.Count - 1];
                if (top.ClosesOnEscape) top.Close();
                return;
            }

            GetPanel(PausePanel.Id)?.Open();
        }
    }
}
