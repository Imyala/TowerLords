using TowerLords.Gameplay;
using TowerLords.Settings;
using UnityEngine;

namespace TowerLords.UI
{
    /// <summary>
    /// Wraps one HUD group in its own visibility rule. This is the Dynamic HUD:
    /// the player decides per element whether it is always up, only up in combat,
    /// or gone entirely — rather than one blunt "hide the UI" switch.
    /// </summary>
    [RequireComponent(typeof(CanvasGroup))]
    public class HudElement : MonoBehaviour
    {
        public HudVisibility Visibility = HudVisibility.AlwaysShow;

        CanvasGroup _group;
        float _flashUntil;

        /// <summary>Set false by the global HUD toggle without disturbing per-element rules.</summary>
        public bool GloballyHidden { get; set; }

        void Awake()
        {
            _group = GetComponent<CanvasGroup>();
            _group.interactable = false;
            _group.blocksRaycasts = false;
            _group.alpha = Visibility == HudVisibility.AlwaysShow ? 1f : 0f;
        }

        /// <summary>
        /// Briefly reveals a faded element — used when something happens the player
        /// needs to see even though they've chosen to keep this element hidden
        /// while exploring.
        /// </summary>
        public void Flash(float duration = 2.5f)
        {
            if (!SettingsService.Current.temporarilyShowHudOnNotification) return;
            _flashUntil = Time.unscaledTime + duration;
        }

        void Update()
        {
            var target = TargetAlpha();
            var speed = Time.unscaledDeltaTime / Mathf.Max(0.0001f, UITheme.HudFadeDuration);
            _group.alpha = Mathf.MoveTowards(_group.alpha, target, speed);
        }

        float TargetAlpha()
        {
            if (GloballyHidden) return 0f;
            if (Time.unscaledTime < _flashUntil) return 1f;

            return Visibility switch
            {
                HudVisibility.Hidden => 0f,
                HudVisibility.FadeOutOfCombat => CombatState.InCombat ? 1f : 0f,
                _ => 1f
            };
        }
    }
}
