using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// A fill bar that can carry milestone pips along its length — the shape used
    /// for depth milestones and feat tiers, where the player should be able to see
    /// the next reward without opening anything.
    /// </summary>
    public class UIProgressBar : MonoBehaviour
    {
        Image _fill;
        TextMeshProUGUI _label;
        RectTransform _pipLayer;

        float _value;
        float _max = 1f;

        public static UIProgressBar Create(Transform parent, float height = 18f,
                                           bool showLabel = true, Color? fillColor = null)
        {
            var root = UIFactory.Panel("ProgressBar", parent, UITheme.PanelSunken);
            UIFactory.SetHeight(root.gameObject, height);

            var bar = root.gameObject.AddComponent<UIProgressBar>();

            var fill = UIFactory.Panel("Fill", root.transform, fillColor ?? UITheme.Accent);
            var frt = fill.rectTransform;
            frt.anchorMin = Vector2.zero;
            frt.anchorMax = new Vector2(0f, 1f);
            frt.pivot = new Vector2(0f, 0.5f);
            frt.offsetMin = Vector2.zero;
            frt.offsetMax = Vector2.zero;
            fill.raycastTarget = false;
            bar._fill = fill;

            bar._pipLayer = UIFactory.Stretch("Pips", root.transform);

            if (showLabel)
            {
                bar._label = UIFactory.Text("Label", root.transform, "", UITheme.FontSizeSmall,
                                            UITheme.TextPrimary, TextAlignmentOptions.Center);
                var lrt = bar._label.rectTransform;
                lrt.anchorMin = Vector2.zero;
                lrt.anchorMax = Vector2.one;
                lrt.offsetMin = Vector2.zero;
                lrt.offsetMax = Vector2.zero;
            }

            return bar;
        }

        public void SetValue(float value, float max, string labelOverride = null)
        {
            _max = Mathf.Max(0.0001f, max);
            _value = Mathf.Clamp(value, 0f, _max);

            var normalized = _value / _max;
            _fill.rectTransform.anchorMax = new Vector2(normalized, 1f);

            if (_label != null)
                _label.text = labelOverride ?? $"{Mathf.FloorToInt(_value)} / {Mathf.FloorToInt(_max)}";
        }

        /// <summary>Places tick marks at the given values along the bar.</summary>
        public void SetMilestones(params float[] milestones)
        {
            for (var i = _pipLayer.childCount - 1; i >= 0; i--)
                Destroy(_pipLayer.GetChild(i).gameObject);

            foreach (var milestone in milestones)
            {
                var normalized = Mathf.Clamp01(milestone / _max);
                var pip = UIFactory.Panel("Pip", _pipLayer, UITheme.TextMuted);
                var prt = pip.rectTransform;
                prt.anchorMin = new Vector2(normalized, 0f);
                prt.anchorMax = new Vector2(normalized, 1f);
                prt.pivot = new Vector2(0.5f, 0.5f);
                prt.sizeDelta = new Vector2(2f, 0f);
                prt.anchoredPosition = Vector2.zero;
                pip.raycastTarget = false;
            }
        }
    }
}
