using System.Collections.Generic;
using TMPro;
using TowerLords.Gameplay;
using TowerLords.Settings;
using UnityEngine;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// Builds and drives the in-world HUD.
    ///
    /// The layout is deliberately sparse — health and two Mastery slots at the
    /// bottom centre, depth and objectives top-right, nothing else. A restricted
    /// loadout does not need a twenty-four button action bar, and an action game
    /// needs the middle of the screen kept clear to read enemy telegraphs.
    /// </summary>
    public class HudController : MonoBehaviour
    {
        public static HudController Instance { get; private set; }

        HealthOrb _orb;
        AbilitySlot _slotOne;
        AbilitySlot _slotTwo;
        TextMeshProUGUI _floorLabel;
        TextMeshProUGUI _floorCaption;
        RectTransform _objectiveList;
        RectTransform _statusRow;

        readonly Dictionary<string, HudElement> _elements = new();
        bool _hudHidden;

        PlayerHealth _playerHealth;

        void Awake()
        {
            Instance = this;
        }

        void Start()
        {
            Build();
            SettingsService.Changed += ApplySettings;
            ApplySettings(SettingsService.Current);
            BindPlayer();
        }

        void OnDestroy()
        {
            SettingsService.Changed -= ApplySettings;
            if (_playerHealth != null) _playerHealth.HealthChanged -= OnPlayerHealthChanged;
            if (Instance == this) Instance = null;
        }

        // ---- Construction ----------------------------------------------------

        void Build()
        {
            var layer = UIManager.Instance.HudLayer;

            BuildHealth(layer);
            BuildAbilityBar(layer);
            BuildDepth(layer);
            BuildObjectives(layer);
            BuildStatusEffects(layer);
            BuildMinimap(layer);
        }

        HudElement Group(string key, Transform parent, Vector2 anchor, Vector2 pivot,
                         Vector2 offset, Vector2 size)
        {
            var rect = UIFactory.Rect(key, parent);
            rect.anchorMin = anchor;
            rect.anchorMax = anchor;
            rect.pivot = pivot;
            rect.anchoredPosition = offset;
            rect.sizeDelta = size;

            rect.gameObject.AddComponent<CanvasGroup>();
            var element = rect.gameObject.AddComponent<HudElement>();
            _elements[key] = element;
            return element;
        }

        void BuildHealth(Transform layer)
        {
            var group = Group("health", layer, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
                              new Vector2(0f, 28f), new Vector2(120f, 120f));
            _orb = HealthOrb.Create(group.transform);
            var orbRect = (RectTransform)_orb.transform;
            orbRect.anchorMin = new Vector2(0.5f, 0.5f);
            orbRect.anchorMax = new Vector2(0.5f, 0.5f);
            orbRect.anchoredPosition = Vector2.zero;
        }

        void BuildAbilityBar(Transform layer)
        {
            var group = Group("abilities", layer, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
                              new Vector2(0f, 40f), new Vector2(340f, 90f));

            _slotOne = AbilitySlot.Create(group.transform, KeybindRegistry.MasterySlot1, "I");
            _slotTwo = AbilitySlot.Create(group.transform, KeybindRegistry.MasterySlot2, "II");

            PlaceSlot(_slotOne, -104f);
            PlaceSlot(_slotTwo, 104f);
        }

        static void PlaceSlot(AbilitySlot slot, float x)
        {
            var rect = (RectTransform)slot.transform;
            rect.anchorMin = new Vector2(0.5f, 0f);
            rect.anchorMax = new Vector2(0.5f, 0f);
            rect.pivot = new Vector2(0.5f, 0f);
            rect.anchoredPosition = new Vector2(x, 8f);
        }

        void BuildDepth(Transform layer)
        {
            var group = Group("floor", layer, new Vector2(1f, 1f), new Vector2(1f, 1f),
                              new Vector2(-26f, -22f), new Vector2(220f, 62f));

            _floorLabel = UIFactory.Text("Floor", group.transform, "1", 40f, UITheme.TextPrimary,
                                         TextAlignmentOptions.Right);
            _floorLabel.fontStyle = FontStyles.Bold;
            var lrt = _floorLabel.rectTransform;
            lrt.anchorMin = new Vector2(0f, 0f);
            lrt.anchorMax = new Vector2(1f, 1f);
            lrt.offsetMin = Vector2.zero;
            lrt.offsetMax = Vector2.zero;

            _floorCaption = UIFactory.Text("Caption", group.transform, "FLOOR", UITheme.FontSizeSmall,
                                           UITheme.Accent, TextAlignmentOptions.Right);
            _floorCaption.characterSpacing = 8f;
            var crt = _floorCaption.rectTransform;
            crt.anchorMin = new Vector2(0f, 0f);
            crt.anchorMax = new Vector2(1f, 0f);
            crt.pivot = new Vector2(0.5f, 1f);
            crt.sizeDelta = new Vector2(0f, 18f);
            crt.anchoredPosition = new Vector2(0f, 2f);
        }

        void BuildObjectives(Transform layer)
        {
            var group = Group("objectives", layer, new Vector2(1f, 1f), new Vector2(1f, 1f),
                              new Vector2(-26f, -104f), new Vector2(300f, 160f));

            _objectiveList = UIFactory.Stretch("List", group.transform);
            var layout = UIFactory.VerticalLayout(_objectiveList, 3f);
            layout.childAlignment = TextAnchor.UpperRight;
        }

        void BuildStatusEffects(Transform layer)
        {
            var group = Group("status", layer, new Vector2(0f, 1f), new Vector2(0f, 1f),
                              new Vector2(26f, -26f), new Vector2(420f, 40f));

            _statusRow = UIFactory.Stretch("Row", group.transform);
            var layout = UIFactory.HorizontalLayout(_statusRow, 5f);
            layout.childAlignment = TextAnchor.UpperLeft;
        }

        void BuildMinimap(Transform layer)
        {
            var group = Group("minimap", layer, new Vector2(1f, 0f), new Vector2(1f, 0f),
                              new Vector2(-26f, 26f), new Vector2(190f, 190f));

            // Placeholder frame until procedural floors have something worth mapping.
            var frame = UIFactory.Panel("Frame", group.transform, new Color(0.03f, 0.03f, 0.04f, 0.55f));
            frame.sprite = UISprites.RoundedRect(8);
            frame.type = Image.Type.Sliced;
            var frt = frame.rectTransform;
            frt.anchorMin = Vector2.zero;
            frt.anchorMax = Vector2.one;
            frt.offsetMin = Vector2.zero;
            frt.offsetMax = Vector2.zero;
            frame.raycastTarget = false;

            var border = UIFactory.Panel("Border", group.transform, UITheme.AccentDim);
            border.sprite = UISprites.RoundedRect(8, border: 2);
            border.type = Image.Type.Sliced;
            var brt = border.rectTransform;
            brt.anchorMin = Vector2.zero;
            brt.anchorMax = Vector2.one;
            brt.offsetMin = Vector2.zero;
            brt.offsetMax = Vector2.zero;
            border.raycastTarget = false;

            var placeholder = UIFactory.Text("Placeholder", group.transform, "UNCHARTED",
                                             UITheme.FontSizeSmall, UITheme.TextMuted,
                                             TextAlignmentOptions.Center);
            placeholder.characterSpacing = 5f;
            var prt = placeholder.rectTransform;
            prt.anchorMin = Vector2.zero;
            prt.anchorMax = Vector2.one;
            prt.offsetMin = Vector2.zero;
            prt.offsetMax = Vector2.zero;
        }

        // ---- Settings --------------------------------------------------------

        void ApplySettings(GameSettings settings)
        {
            SetVisibility("health", settings.hudHealth);
            SetVisibility("abilities", settings.hudAbilityBar);
            SetVisibility("floor", settings.hudFloorIndicator);
            SetVisibility("objectives", settings.hudObjectives);
            SetVisibility("status", settings.hudStatusEffects);
            SetVisibility("minimap", settings.hudMinimap);

            if (_elements.TryGetValue("minimap", out var minimap))
            {
                var rect = (RectTransform)minimap.transform;
                rect.sizeDelta = new Vector2(190f, 190f) * settings.minimapSize;
            }
        }

        void SetVisibility(string key, HudVisibility visibility)
        {
            if (_elements.TryGetValue(key, out var element)) element.Visibility = visibility;
        }

        // ---- Public API ------------------------------------------------------

        public void SetFloor(int floor)
        {
            if (_floorLabel != null) _floorLabel.text = floor.ToString();
            Flash("floor");
        }

        public void SetObjectives(params string[] objectives)
        {
            if (_objectiveList == null) return;

            for (var i = _objectiveList.childCount - 1; i >= 0; i--)
                Destroy(_objectiveList.GetChild(i).gameObject);

            foreach (var objective in objectives)
            {
                var text = UIFactory.Text("Objective", _objectiveList, objective,
                                          UITheme.FontSizeSmall, UITheme.TextSecondary,
                                          TextAlignmentOptions.Right);
                UIFactory.SetHeight(text.gameObject, 20f);
            }

            Flash("objectives");
        }

        public AbilitySlot Slot(int index) => index <= 0 ? _slotOne : _slotTwo;

        /// <summary>Reveals a faded element briefly when something changes in it.</summary>
        public void Flash(string key)
        {
            if (_elements.TryGetValue(key, out var element)) element.Flash();
        }

        public void ToggleHud()
        {
            _hudHidden = !_hudHidden;
            foreach (var element in _elements.Values) element.GloballyHidden = _hudHidden;
        }

        // ---- Player binding --------------------------------------------------

        void BindPlayer()
        {
            _playerHealth = FindAnyObjectByType<PlayerHealth>();
            if (_playerHealth == null) return;

            _playerHealth.HealthChanged += OnPlayerHealthChanged;
            OnPlayerHealthChanged(_playerHealth.CurrentHealth, _playerHealth.maxHealth);
        }

        void OnPlayerHealthChanged(int current, int max) => _orb?.SetHealth(current, max);

        float _nextPlayerSearch;

        void Update()
        {
            // The player may not exist yet on the first frame of a generated floor.
            // Retry on an interval rather than scanning the scene every frame.
            if (_playerHealth == null && Time.unscaledTime >= _nextPlayerSearch)
            {
                _nextPlayerSearch = Time.unscaledTime + 0.5f;
                BindPlayer();
            }

            if (!UIManager.InputCaptured && KeybindRegistry.WasPressedThisFrame(KeybindRegistry.ToggleHud))
                ToggleHud();
        }
    }
}
