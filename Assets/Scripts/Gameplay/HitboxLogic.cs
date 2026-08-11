using UnityEngine;

namespace TowerLords.Gameplay
{
    public class HitboxLogic : MonoBehaviour
    {
        public int damage = 1;

        void OnTriggerEnter(Collider other)
        {
            if (other.TryGetComponent<EnemyHealth>(out var health))
                health.TakeDamage(damage);
        }
    }
}
