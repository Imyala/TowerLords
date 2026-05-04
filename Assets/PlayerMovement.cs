using UnityEngine;
using UnityEngine.AI;
using UnityEngine.InputSystem; // We added this line to use the New Input System!

public class PlayerMovement : MonoBehaviour
{
    private NavMeshAgent agent;

    void Start()
    {
        // When the game starts, find the NavMesh Agent component on our player
        agent = GetComponent<NavMeshAgent>();
    }

    void Update()
    {
        // Safety check: make sure a mouse is actually plugged in/detected
        if (Mouse.current == null) return;

        // Check if the right mouse button was clicked this exact frame
        if (Mouse.current.rightButton.wasPressedThisFrame)
        {
            // Get the 2D screen position of the mouse from the new system
            Vector2 mousePos = Mouse.current.position.ReadValue();
            
            // Shoot the invisible laser into the 3D world
            Ray ray = Camera.main.ScreenPointToRay(mousePos);
            RaycastHit hit;

            // If it hits the NavMesh floor, walk there!
            if (Physics.Raycast(ray, out hit))
            {
                agent.SetDestination(hit.point);
            }
        }
    }
}