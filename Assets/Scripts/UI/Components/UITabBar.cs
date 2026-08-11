using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// A horizontal tab strip with an accent underline on the active tab.
    /// Used by Settings today; reusable by any panel that needs categories.
    /// </summary>
    public class UITabBar : MonoBehaviour
    {
        readonly List<Button> _buttons = new();
        readonly List<TextMeshProUGUI> _labels = new();
        readonly List<Image> _underlines = new();

        public int SelectedIndex { get; private set; } = -1;

        public event Action<int> SelectionChanged;

        public static UITabBar Create(Transform parent, string[] tabs, int initialIndex = 0)
        {
            var root = UIFactory.Rect("TabBar", parent);
            UIFactory.SetHeight(root.gameObject, UITheme.TabHeight);
            UIFactory.HorizontalLayout(root, 2f);

            var bar = root.gameObject.AddComponent<UITabBar>();
            bar.Populate(root, tabs);
            bar.Select(initialIndex, notify: false);
            return bar;
        }

        void Populate(RectTransform root, string[] tabs)
        {
            for (var i = 0; i < tabs.Length; i++)
            {
                var index = i;

                var button = UIFactory.Button("Tab_" + tabs[i], root, tabs[i].ToUpperInvariant(),
                                              out var label, idle: UITheme.PanelSunken);
                label.fontSize = UITheme.FontSizeSection;
                label.characterSpacing = 4f;

                var element = button.gameObject.AddComponent<LayoutElement>();
                element.flexibleWidth = 1f;

                var underline = UIFactory.Panel("Underline", button.transform, UITheme.Accent);
                var urt = underline.rectTransform;
                urt.anchorMin = new Vector2(0f, 0f);
                urt.anchorMax = new Vector2(1f, 0f);
                urt.pivot = new Vector2(0.5f, 0f);
                urt.sizeDelta = new Vector2(0f, 2.5f);
                urt.anchoredPosition = Vector2.zero;
                underline.raycastTarget = false;

                button.onClick.AddListener(() => Select(index));

                _buttons.Add(button);
                _labels.Add(label);
                _underlines.Add(underline);
            }
        }

        public void Select(int index, bool notify = true)
        {
            if (index < 0 || index >= _buttons.Count || index == SelectedIndex) return;

            SelectedIndex = index;

            for (var i = 0; i < _buttons.Count; i++)
            {
                var active = i == index;
                _buttons[i].image.color = active ? UITheme.PanelRaised : UITheme.PanelSunken;
                _labels[i].color = active ? UITheme.TextPrimary : UITheme.TextSecondary;
                _underlines[i].gameObject.SetActive(active);
            }

            if (notify) SelectionChanged?.Invoke(index);
        }
    }
}
