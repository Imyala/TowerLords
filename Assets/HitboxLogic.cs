using UnityEngine;

public class HitboxLogic : MonoBehaviour
{
    private void OnTriggerEnter(Collider other)
    {
        // If the thing we touched has an EnemyHealth script...
        if (other.GetComponent<EnemyHealth>())
        {
            // ...make it take damage!
            other.GetComponent<EnemyHealth>().TakeDamage();
        }
    }
}