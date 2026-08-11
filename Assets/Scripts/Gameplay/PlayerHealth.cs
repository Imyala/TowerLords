using System;
using TowerLords.UI;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace TowerLords.Gameplay
{
    public class PlayerHealth : MonoBehaviour
    {
        public int maxHealth = 100;

        [Tooltip("Optional legacy death panel wired up in the scene. Superseded by the " +
                 "run-recap screen once that exists.")]
        public GameObject deathScreenUI;

        [Tooltip("Seconds the death screen holds before the run resets.")]
        public float deathHoldDuration = 3f;

        public int CurrentHealth { get; private set; }

        /// <summary>Raised as (current, max). The HUD orb listens to this.</summary>
        public event Action<int, int> HealthChanged;

        public event Action Died;

        bool _isDead;

        void Start()
        {
            CurrentHealth = maxHealth;
            if (deathScreenUI != null) deathScreenUI.SetActive(false);
            HealthChanged?.Invoke(CurrentHealth, maxHealth);
        }

        public void TakeDamage(int damage)
        {
            if (_isDead || damage <= 0) return;

            CurrentHealth = Mathf.Max(0, CurrentHealth - damage);
            CombatState.Touch();

            FloatingCombatText.Spawn(transform.position + Vector3.up * 2f,
                                     damage.ToString(), CombatTextKind.Damage);

            HealthChanged?.Invoke(CurrentHealth, maxHealth);
            HudController.Instance?.Flash("health");

            if (CurrentHealth <= 0) Die();
        }

        public void Heal(int amount)
        {
            if (_isDead || amount <= 0) return;

            CurrentHealth = Mathf.Min(maxHealth, CurrentHealth + amount);

            FloatingCombatText.Spawn(transform.position + Vector3.up * 2f,
                                     "+" + amount, CombatTextKind.Heal);

            HealthChanged?.Invoke(CurrentHealth, maxHealth);
        }

        void Die()
        {
            if (_isDead) return;
            _isDead = true;

            Died?.Invoke();
            if (deathScreenUI != null) deathScreenUI.SetActive(true);

            // Placeholder until the run-recap screen exists: hold, then regenerate
            // the tower. Permadeath means this is a full reset, not a respawn.
            Invoke(nameof(RestartRun), deathHoldDuration);
        }

        void RestartRun()
        {
            Time.timeScale = 1f;
            UIManager.Instance?.CloseAll();
            SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
        }
    }
}
