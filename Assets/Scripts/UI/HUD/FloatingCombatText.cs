using TMPro;
using TowerLords.Settings;
using UnityEngine;

namespace TowerLords.UI
{
    public enum CombatTextKind { Damage, Heal, Status, Critical }

    /// <summary>
    /// Floating combat text. Each kind is toggled separately in settings, matching
    /// how the reference games split flytext by category rather than offering one
    /// all-or-nothing switch.
    /// </summary>
    public class FloatingCombatText : MonoBehaviour
    {
        const float Lifetime = 1.1f;
        const float RiseDistance = 62f;

        RectTransform _rect;
        TextMeshProUGUI _text;
        Vector3 _worldPosition;
        Vector2 _drift;
        float _elapsed;

        public static void Spawn(Vector3 worldPosition, string content, CombatTextKind kind)
        {
            var settings = SettingsService.Current;

            var allowed = kind switch
            {
                CombatTextKind.Damage   => settings.showDamageNumbers,
                CombatTextKind.Critical => settings.showDamageNumbers,
                CombatTextKind.Heal     => settings.showHealNumbers,
                CombatTextKind.Status   => settings.showStatusText,
                _                       => true
            };

            if (!allowed) return;

            var layer = UIManager.Instance?.HudLayer;
            if (layer == null) return;

            var isCritical = kind == CombatTextKind.Critical && settings.emphasizeCriticalHits;

            var color = kind switch
            {
                CombatTextKind.Heal     => UITheme.Success,
                CombatTextKind.Status   => UITheme.TextSecondary,
                CombatTextKind.Critical => UITheme.AccentHot,
                _                       => UITheme.TextPrimary
            };

            var text = UIFactory.Text("CombatText", layer, content,
                                      isCritical ? 32f : 22f, color, TextAlignmentOptions.Center);
            if (isCritical) text.fontStyle = FontStyles.Bold;

            var floater = text.gameObject.AddComponent<FloatingCombatText>();
            floater._rect = text.rectTransform;
            floater._text = text;
            floater._worldPosition = worldPosition;
            floater._drift = new Vector2(Random.Range(-26f, 26f), 0f);
            floater._rect.sizeDelta = new Vector2(220f, 44f);
        }

        void Update()
        {
            _elapsed += Time.deltaTime;
            if (_elapsed >= Lifetime)
            {
                Destroy(gameObject);
                return;
            }

            var camera = Camera.main;
            var manager = UIManager.Instance;
            if (camera == null || manager == null)
            {
                Destroy(gameObject);
                return;
            }

            var normalized = _elapsed / Lifetime;
            var screenPoint = camera.WorldToScreenPoint(_worldPosition);

            // Behind the camera: nothing meaningful to show.
            if (screenPoint.z < 0f)
            {
                Destroy(gameObject);
                return;
            }

            var canvas = manager.Canvas;
            var parentRect = (RectTransform)_rect.parent;
            RectTransformUtility.ScreenPointToLocalPointInRectangle(
                parentRect, screenPoint,
                canvas.renderMode == RenderMode.ScreenSpaceOverlay ? null : canvas.worldCamera,
                out var localPoint);

            // Ease-out rise so the number decelerates as it fades.
            var rise = RiseDistance * (1f - Mathf.Pow(1f - normalized, 2f));
            _rect.anchoredPosition = localPoint + _drift * normalized + new Vector2(0f, rise);

            var alpha = normalized < 0.7f ? 1f : Mathf.InverseLerp(1f, 0.7f, normalized);
            _text.alpha = alpha;
        }
    }
}
