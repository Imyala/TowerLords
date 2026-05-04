using UnityEngine;

public class EnemySpawner : MonoBehaviour
{
    public GameObject enemyPrefab; // Drag your blue "Enemy" prefab here
    public float spawnRate = 5f;   // One enemy every 5 seconds
    private float nextSpawnTime;

    void Update()
    {
        if (Time.time >= nextSpawnTime)
        {
            SpawnEnemy();
            nextSpawnTime = Time.time + spawnRate;
        }
    }

    void SpawnEnemy()
    {
        // Create a new enemy at this spawner's position
        Instantiate(enemyPrefab, transform.position, Quaternion.identity);
    }
}