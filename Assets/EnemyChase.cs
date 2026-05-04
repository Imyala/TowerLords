using UnityEngine;
using UnityEngine.AI;

public class EnemyChase : MonoBehaviour
{
    private NavMeshAgent agent;
    
    // We create a public slot to tell the enemy who the player is
    public Transform playerTarget; 

    void Start()
    {
        // Grab the NavMesh Agent on the cube
        agent = GetComponent<NavMeshAgent>();
    }

    void Update()
    {
        // As long as we have told the enemy who the player is, keep walking toward them!
        if (playerTarget != null)
        {
            agent.SetDestination(playerTarget.position);
        }
    }
}