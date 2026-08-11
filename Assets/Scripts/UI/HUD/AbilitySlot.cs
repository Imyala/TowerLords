using TMPro;
using TowerLords.Settings;
using UnityEngine;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// One of the two Mastery slots. Deliberately large: with only two of them,
    /// each slot can carry weight instead of being one icon among twenty-four.
    /// An empty slot reads as a deliberate choice, not as missing UI.
    /// </summary>
    public class AbilitySlot : MonoBehaviour
    {
        Image _frame;
        Image _icon;
        Image _cooldownSweep;
        TextMeshProUGUI _glyph;
        TextMeshProUGUI _bindLabel;
        TextMeshProUGUI _cooldownText;

        string _bindAction;
        float _cooldownRemaining;
        float _cooldownTotal;

        public bool IsEmpty { get; private set; } = true;

        public static AbilitySlot Create(Transform parent, string bindAction, string romanNumeral,
                                         float size = 74f)
        {
            var frame = UIFactory.Panel("AbilitySlot", parent, UITheme.PanelRaised);
            frame.sprite = UISprites.RoundedRect(10);
            frame.type = Image.Type.Sliced;
            frame.rectTransform.sizeDelta = new Vector2(size, size);

            var slot = frame.gameObject.AddComponent<AbilitySlot>();
            slot._frame = frame;
            slot._bindAction = bindAction;

            var border = UIFactory.Panel("Border", frame.transform, UITheme.AccentDim);
            border.sprite = UISprites.RoundedRect(10, border: 2);
            border.type = Image.Type.Sliced;
            Stretch(border.rectTransform, 0f);
            border.raycastTarget = false;

            var icon = UIFactory.Panel("Icon", frame.transform, new Color(1f, 1f, 1f, 0f));
            icon.sprite = UISprites.RoundedRect(8);
            icon.type = Image.Type.Sliced;
            Stretch(icon.rectTransform, 5f);
            icon.raycastTarget = false;
            slot._icon = icon;

            // Stand-in for the ability art: the slot's roman numeral.
            slot._glyph = UIFactory.Text("Glyph", frame.transform, romanNumeral, 26f,
                                         UITheme.TextMuted, TextAlignmentOptions.Center);
            Stretch(slot._glyph.rectTransform, 0f);

            var sweep = UIFactory.Panel("Cooldown", frame.transform, new Color(0f, 0f, 0f, 0.72f));
            sweep.sprite = UISprites.Circle();
            sweep.type = Image.Type.Filled;
            sweep.fillMethod = Image.FillMethod.Radial360;
            sweep.fillOrigin = (int)Image.Origin360.Top;
            sweep.fillClockwise = false;
            sweep.fillAmount = 0f;
            Stretch(sweep.rectTransform, -6f);   // overshoot so the sweep covers the corners
            sweep.raycastTarget = false;
            slot._cooldownSweep = sweep;

            slot._cooldownText = UIFactory.Text("CooldownText", frame.transform, "", 20f,
                                                UITheme.TextPrimary, TextAlignmentOptions.Center);
            Stretch(slot._cooldownText.rectTransform, 0f);
            slot._cooldownText.fontStyle = FontStyles.Bold;

            slot._bindLabel = UIFactory.Text("Bind", frame.transform, "", UITheme.FontSizeSmall,
                                             UITheme.TextSecondary, TextAlignmentOptions.BottomRight);
            var brt = slot._bindLabel.rectTransform;
            brt.anchorMin = Vector2.zero;
            brt.anchorMax = Vector2.one;
            brt.offsetMin = new Vector2(0f, 2f);
            brt.offsetMax = new Vector2(-5f, 0f);

            slot.RefreshBindLabel();
            slot.SetAbility(null);

            SettingsService.Changed += slot.OnSettingsChanged;
            return slot;
        }

        void OnDestroy() => SettingsService.Changed -= OnSettingsChanged;

        void OnSettingsChanged(GameSettings settings) => RefreshBindLabel();

        void RefreshBindLabel()
        {
            if (_bindLabel == null || string.IsNullOrEmpty(_bindAction)) return;
            var entry = KeybindRegistry.Entry(SettingsService.Current, _bindAction);
            _bindLabel.text = KeybindRegistry.DisplayName(entry.primary);
        }

        static void Stretch(RectTransform rt, float inset)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = new Vector2(inset, inset);
            rt.offsetMax = new Vector2(-inset, -inset);
        }

        /// <summary>Pass null to show the slot as empty.</summary>
        public void SetAbility(string displayGlyph, Color? tint = null)
        {
            IsEmpty = string.IsNullOrEmpty(displayGlyph);

            _glyph.text = IsEmpty ? "—" : displayGlyph;
            _glyph.color = IsEmpty ? UITheme.TextMuted : UITheme.TextPrimary;
            _icon.color = IsEmpty ? new Color(1f, 1f, 1f, 0f) : (tint ?? UITheme.AccentDim);
            _frame.color = IsEmpty ? UITheme.PanelSunken : UITheme.PanelRaised;
        }

        public void StartCooldown(float seconds)
        {
            _cooldownTotal = Mathf.Max(0.01f, seconds);
            _cooldownRemaining = _cooldownTotal;
        }

        public bool IsReady => _cooldownRemaining <= 0f;

        void Update()
        {
            if (_cooldownRemaining <= 0f)
            {
                if (_cooldownSweep.fillAmount != 0f)
                {
                    _cooldownSweep.fillAmount = 0f;
                    _cooldownText.text = "";
                }
                return;
            }

            _cooldownRemaining -= Time.deltaTime;
            var normalized = Mathf.Clamp01(_cooldownRemaining / _cooldownTotal);

            _cooldownSweep.fillAmount = normalized;
            _cooldownText.text = _cooldownRemaining > 1f
                ? Mathf.CeilToInt(_cooldownRemaining).ToString()
                : _cooldownRemaining.ToString("0.0");
        }
    }
}
