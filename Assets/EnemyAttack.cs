using UnityEngine;

public class EnemyAttack : MonoBehaviour
{
    public int damageAmount = 10;
    public float attackRate = 1.0f; // How often they can hit you (1 second)
    private float nextAttackTime;

    // This runs as long as the player is standing inside the enemy's trigger zone
    private void OnTriggerStay(Collider other)
    {
        // Check if the thing touching us is the Player
        if (other.CompareTag("Player"))
        {
            Debug.Log("I am hitting the player!");
            if (Time.time >= nextAttackTime)
            {
                PlayerHealth health = other.GetComponent<PlayerHealth>();
                if (health != null)
                {
                    health.TakeDamage(damageAmount);
                    nextAttackTime = Time.time + attackRate;
                }
            }
        }
    }
}