using UnityEngine;
using UnityEngine.SceneManagement; // Needed for restarting

public class PlayerHealth : MonoBehaviour
{
    public int maxHealth = 100;
    public int currentHealth;
    
    // Drag your "DeathScreen" Panel here in the Inspector
    public GameObject deathScreenUI; 

    void Start()
    {
        currentHealth = maxHealth;
        if (deathScreenUI != null) deathScreenUI.SetActive(false);
    }

    public void TakeDamage(int damage)
    {
        currentHealth -= damage;
        if (currentHealth <= 0) Die();
    }

    void Die()
    {
        // 1. Show the Lament screen
        if (deathScreenUI != null) deathScreenUI.SetActive(true);

        // 2. Stop the game time so enemies stop moving
        Time.timeScale = 0f; 

        // 3. Optional: Restart after 3 seconds
        Invoke("RestartGame", 3f);
    }

    void RestartGame()
    {
        Time.timeScale = 1f; // Reset time before reloading!
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }
}