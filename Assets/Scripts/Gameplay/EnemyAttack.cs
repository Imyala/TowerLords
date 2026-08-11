using UnityEngine;

namespace TowerLords.Gameplay
{
    public class EnemyAttack : MonoBehaviour
    {
        public int damageAmount = 10;
        public float attackRate = 1.0f;

        private float nextAttackTime;

        void OnTriggerStay(Collider other)
        {
            if (!other.CompareTag("Player")) return;
            if (Time.time < nextAttackTime) return;

            var health = other.GetComponent<PlayerHealth>();
            if (health == null) return;

            health.TakeDamage(damageAmount);
            nextAttackTime = Time.time + attackRate;
        }
    }
}
