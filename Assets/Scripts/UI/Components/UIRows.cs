using System;
using TMPro;
using TowerLords.Settings;
using UnityEngine;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// The row vocabulary every options screen is written in: a label on the left,
    /// a control on the right. Built once here so all settings look and behave the
    /// same no matter which tab they live on.
    /// </summary>
    public static class UIRows
    {
        /// <summary>Row shell: label (+ optional hint) on the left, empty control slot on the right.</summary>
        public static RectTransform Row(Transform parent, string label, string hint, out RectTransform controlSlot)
        {
            var hasHint = !string.IsNullOrEmpty(hint);
            var height = hasHint ? UITheme.RowHeight + 16f : UITheme.RowHeight;

            var row = UIFactory.Rect("Row_" + label, parent);
            UIFactory.SetHeight(row.gameObject, height);
            UIFactory.HorizontalLayout(row, 14f);

            var labelColumn = UIFactory.Rect("LabelColumn", row);
            var columnLayout = UIFactory.VerticalLayout(labelColumn, 0f);
            columnLayout.childForceExpandHeight = false;
            columnLayout.childAlignment = TextAnchor.MiddleLeft;
            var columnElement = labelColumn.gameObject.AddComponent<LayoutElement>();
            columnElement.flexibleWidth = 1f;

            var labelText = UIFactory.Text("Label", labelColumn, label, UITheme.FontSizeBody, UITheme.TextPrimary);
            labelText.alignment = TextAlignmentOptions.Left;
            UIFactory.SetHeight(labelText.gameObject, hasHint ? 21f : height);

            if (hasHint)
            {
                var hintText = UIFactory.Text("Hint", labelColumn, hint, UITheme.FontSizeSmall, UITheme.TextMuted);
                hintText.alignment = TextAlignmentOptions.TopLeft;
                UIFactory.SetHeight(hintText.gameObject, 17f);
            }

            controlSlot = UIFactory.Rect("Control", row);
            UIFactory.SetWidth(controlSlot.gameObject, UITheme.ControlWidth);

            return row;
        }

        // ---- Toggle ---------------------------------------------------------

        public static Toggle Toggle(Transform parent, string label, string hint,
                                    bool value, Action<bool> onChanged)
        {
            Row(parent, label, hint, out var slot);
            UIFactory.HorizontalLayout(slot, 0f).childAlignment = TextAnchor.MiddleRight;

            var toggle = UIFactory.Toggle("Toggle", slot, value);
            var element = toggle.gameObject.AddComponent<LayoutElement>();
            element.preferredWidth = 54f;
            element.preferredHeight = 26f;
            element.flexibleWidth = 0f;
            element.flexibleHeight = 0f;

            toggle.onValueChanged.AddListener(v => onChanged?.Invoke(v));
            return toggle;
        }

        // ---- Slider ---------------------------------------------------------

        /// <param name="format">Turns the raw value into its readout, e.g. "70°" or "85%".</param>
        public static Slider Slider(Transform parent, string label, string hint,
                                    float min, float max, float value,
                                    Func<float, string> format, Action<float> onChanged,
                                    bool wholeNumbers = false)
        {
            Row(parent, label, hint, out var slot);
            UIFactory.HorizontalLayout(slot, 10f).childAlignment = TextAnchor.MiddleRight;

            var slider = UIFactory.Slider("Slider", slot, min, max, value);
            slider.wholeNumbers = wholeNumbers;
            var sliderElement = slider.gameObject.AddComponent<LayoutElement>();
            sliderElement.flexibleWidth = 1f;
            sliderElement.preferredHeight = 22f;

            var readout = UIFactory.Text("Value", slot, format?.Invoke(value) ?? value.ToString("0.00"),
                                         UITheme.FontSizeSmall, UITheme.Accent, TextAlignmentOptions.Right);
            UIFactory.SetWidth(readout.gameObject, 52f);

            slider.onValueChanged.AddListener(v =>
            {
                readout.text = format?.Invoke(v) ?? v.ToString("0.00");
                onChanged?.Invoke(v);
            });

            return slider;
        }

        // ---- Dropdown -------------------------------------------------------

        public static TMP_Dropdown Dropdown(Transform parent, string label, string hint,
                                            string[] options, int index, Action<int> onChanged)
        {
            Row(parent, label, hint, out var slot);
            UIFactory.HorizontalLayout(slot, 0f).childAlignment = TextAnchor.MiddleRight;

            var dropdown = UIFactory.Dropdown("Dropdown", slot);
            var element = dropdown.gameObject.AddComponent<LayoutElement>();
            element.flexibleWidth = 1f;
            element.preferredHeight = 30f;

            dropdown.ClearOptions();
            var list = new System.Collections.Generic.List<string>(options);
            dropdown.AddOptions(list);
            dropdown.SetValueWithoutNotify(Mathf.Clamp(index, 0, options.Length - 1));
            dropdown.RefreshShownValue();

            dropdown.onValueChanged.AddListener(v => onChanged?.Invoke(v));
            return dropdown;
        }

        /// <summary>Dropdown bound to an enum's values, labelled by name.</summary>
        public static TMP_Dropdown EnumDropdown<TEnum>(Transform parent, string label, string hint,
                                                       TEnum value, Action<TEnum> onChanged,
                                                       string[] displayNames = null)
            where TEnum : struct, Enum
        {
            var values = (TEnum[])Enum.GetValues(typeof(TEnum));
            var names = displayNames ?? BuildEnumNames(values);
            var index = Array.IndexOf(values, value);

            return Dropdown(parent, label, hint, names, Mathf.Max(0, index),
                            i => onChanged?.Invoke(values[i]));
        }

        static string[] BuildEnumNames<TEnum>(TEnum[] values) where TEnum : struct, Enum
        {
            var names = new string[values.Length];
            for (var i = 0; i < values.Length; i++)
            {
                // "FadeOutOfCombat" -> "Fade Out Of Combat"
                names[i] = System.Text.RegularExpressions.Regex
                    .Replace(values[i].ToString(), "(?<!^)([A-Z])", " $1");
            }
            return names;
        }

        // ---- Keybind --------------------------------------------------------

        /// <summary>
        /// A rebindable action with primary and secondary slots, matching the
        /// two-column layout every MMO settled on. Click a slot, press a key.
        /// </summary>
        public static void Keybind(Transform parent, BindAction action, GameSettings settings)
        {
            Row(parent, action.Label, null, out var slot);
            UIFactory.HorizontalLayout(slot, 6f).childAlignment = TextAnchor.MiddleRight;

            var entry = KeybindRegistry.Entry(settings, action.Id);

            MakeBindButton(slot, entry, primary: true);
            MakeBindButton(slot, entry, primary: false);

            var reset = UIFactory.Button("Reset", slot, "↺", out var resetLabel,
                                         idle: new Color(0f, 0f, 0f, 0f));
            resetLabel.color = UITheme.TextMuted;
            UIFactory.SetWidth(reset.gameObject, 26f);
            reset.onClick.AddListener(() =>
            {
                entry.primary = action.DefaultPrimary;
                entry.secondary = action.DefaultSecondary;
                foreach (var capture in slot.GetComponentsInChildren<KeybindCapture>())
                    capture.Refresh();
            });
        }

        static void MakeBindButton(Transform slot, KeybindEntry entry, bool primary)
        {
            var text = KeybindRegistry.DisplayName(primary ? entry.primary : entry.secondary);
            var button = UIFactory.Button(primary ? "Primary" : "Secondary", slot, text, out var label);
            label.fontSize = UITheme.FontSizeSmall;
            var element = button.gameObject.AddComponent<LayoutElement>();
            element.flexibleWidth = 1f;
            element.preferredHeight = 28f;

            var capture = button.gameObject.AddComponent<KeybindCapture>();
            capture.Bind(entry, primary, button, label);
        }

        // ---- Static text ----------------------------------------------------

        public static TextMeshProUGUI Note(Transform parent, string text)
        {
            var note = UIFactory.Text("Note", parent, text, UITheme.FontSizeSmall, UITheme.TextMuted);
            note.alignment = TextAlignmentOptions.TopLeft;
            var element = note.gameObject.AddComponent<LayoutElement>();
            element.minHeight = 34f;
            element.flexibleWidth = 1f;
            return note;
        }

        public static void Section(Transform parent, string title)
        {
            UIFactory.Spacer(parent, UITheme.SectionSpacing);
            UIFactory.SectionHeader(parent, title);
            UIFactory.Divider(parent);
            UIFactory.Spacer(parent, 4f);
        }
    }
}
