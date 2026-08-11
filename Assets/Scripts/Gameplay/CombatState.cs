using UnityEngine;

namespace TowerLords.Gameplay
{
    /// <summary>
    /// Tracks whether the player is currently fighting. The Dynamic HUD reads this
    /// to decide what to fade, so anything that deals or takes damage should call
    /// <see cref="Touch"/>.
    /// </summary>
    public static class CombatState
    {
        /// <summary>Seconds of quiet before combat is considered over.</summary>
        public const float ExitCombatDelay = 4f;

        static float _lastCombatTime = -999f;

        public static bool InCombat => Time.time - _lastCombatTime < ExitCombatDelay;

        /// <summary>Marks combat as ongoing. Safe to call every frame.</summary>
        public static void Touch() => _lastCombatTime = Time.time;

        public static void ForceExit() => _lastCombatTime = -999f;
    }
}
