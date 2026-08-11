using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// Health as a filling orb rather than a corner bar. With only two ability
    /// slots there is no need for a wide status cluster, so the orb sits between
    /// them and the whole HUD collapses to one readable shape at screen centre.
    /// </summary>
    public class HealthOrb : MonoBehaviour
    {
        Image _fill;
        Image _rim;
        TextMeshProUGUI _value;

        float _displayed = 1f;
        float _target = 1f;

        public static HealthOrb Create(Transform parent, float diameter = 104f)
        {
            var root = UIFactory.Rect("HealthOrb", parent);
            root.sizeDelta = new Vector2(diameter, diameter);
            var orb = root.gameObject.AddComponent<HealthOrb>();

            var socket = UIFactory.Panel("Socket", root, new Color(0.03f, 0.03f, 0.04f, 1f));
            socket.sprite = UISprites.Circle();
            socket.type = Image.Type.Simple;
            StretchTo(socket.rectTransform, 0f);
            socket.raycastTarget = false;

            var fill = UIFactory.Panel("Fill", root, UITheme.Health);
            fill.sprite = UISprites.Circle();
            fill.type = Image.Type.Filled;
            fill.fillMethod = Image.FillMethod.Vertical;
            fill.fillOrigin = (int)Image.OriginVertical.Bottom;
            fill.fillAmount = 1f;
            StretchTo(fill.rectTransform, 5f);
            fill.raycastTarget = false;
            orb._fill = fill;

            var rim = UIFactory.Panel("Rim", root, UITheme.Accent);
            rim.sprite = UISprites.Ring(256, 9f);
            rim.type = Image.Type.Simple;
            StretchTo(rim.rectTransform, 0f);
            rim.raycastTarget = false;
            orb._rim = rim;

            orb._value = UIFactory.Text("Value", root, "100", 21f, UITheme.TextPrimary,
                                        TextAlignmentOptions.Center);
            StretchTo(orb._value.rectTransform, 0f);
            orb._value.fontStyle = FontStyles.Bold;

            return orb;
        }

        static void StretchTo(RectTransform rt, float inset)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = new Vector2(inset, inset);
            rt.offsetMax = new Vector2(-inset, -inset);
        }

        public void SetHealth(int current, int max)
        {
            _target = max > 0 ? Mathf.Clamp01((float)current / max) : 0f;
            if (_value != null) _value.text = Mathf.Max(0, current).ToString();
        }

        void Update()
        {
            if (_fill == null) return;

            // Chase the real value so a big hit reads as a drop rather than a jump.
            _displayed = Mathf.MoveTowards(_displayed, _target, Time.unscaledDeltaTime * 1.4f);
            _fill.fillAmount = _displayed;

            // The rim warms toward danger as health falls, readable in peripheral vision.
            var danger = 1f - Mathf.Clamp01(_displayed / 0.35f);
            _rim.color = Color.Lerp(UITheme.Accent, UITheme.Danger, danger);
        }
    }
}
