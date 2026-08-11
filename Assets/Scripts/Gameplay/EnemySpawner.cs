using System.Collections;
using UnityEngine;

namespace TowerLords.Gameplay
{
    public class EnemySpawner : MonoBehaviour
    {
        public GameObject enemyPrefab;
        public float spawnRate = 5f;

        [Tooltip("Stops the spawner running away while a floor is being tested. " +
                 "Zero means no limit.")]
        public int maxAlive = 0;

        readonly System.Collections.Generic.List<GameObject> _spawned = new();

        void Start()
        {
            StartCoroutine(SpawnRoutine());
        }

        IEnumerator SpawnRoutine()
        {
            while (true)
            {
                yield return new WaitForSeconds(spawnRate);

                if (enemyPrefab == null) continue;

                _spawned.RemoveAll(e => e == null);
                if (maxAlive > 0 && _spawned.Count >= maxAlive) continue;

                _spawned.Add(Instantiate(enemyPrefab, transform.position, Quaternion.identity));
            }
        }
    }
}
