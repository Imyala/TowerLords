using UnityEngine;
using UnityEngine.AI;

namespace TowerLords.Gameplay
{
    public class EnemyChase : MonoBehaviour
    {
        private NavMeshAgent agent;

        [Tooltip("Left empty, the enemy finds the player by tag — needed for enemies " +
                 "spawned into a procedurally generated floor.")]
        public Transform playerTarget;

        void Start()
        {
            agent = GetComponent<NavMeshAgent>();
            if (playerTarget == null) AcquireTarget();
        }

        void AcquireTarget()
        {
            var player = GameObject.FindGameObjectWithTag("Player");
            if (player != null) playerTarget = player.transform;
        }

        void Update()
        {
            if (playerTarget == null)
            {
                AcquireTarget();
                return;
            }

            if (agent != null && agent.isOnNavMesh)
                agent.SetDestination(playerTarget.position);
        }
    }
}
