using UnityEngine;

public class EnemyHealth : MonoBehaviour
{
    public void TakeDamage()
    {
        // For now, 1 hit = death! 
        Debug.Log("Enemy Hit!");
        Destroy(gameObject); 
    }
}