using TowerLords.UI;
using UnityEngine;

namespace TowerLords.Gameplay
{
    public class EnemyHealth : MonoBehaviour
    {
        public int maxHealth = 1;

        [Tooltip("Camera shake applied on death. Scaled by the player's shake setting.")]
        public float deathShake = 0.12f;

        int _currentHealth;

        void Awake() => _currentHealth = Mathf.Max(1, maxHealth);

        public void TakeDamage() => TakeDamage(1);

        public void TakeDamage(int amount)
        {
            if (amount <= 0) return;

            _currentHealth -= amount;
            CombatState.Touch();

            FloatingCombatText.Spawn(transform.position + Vector3.up * 1.6f,
                                     amount.ToString(), CombatTextKind.Damage);

            if (_currentHealth <= 0) Die();
        }

        void Die()
        {
            if (Camera.main != null)
                Camera.main.GetComponent<CameraFollow>()?.Shake(deathShake);

            Destroy(gameObject);
        }
    }
}
