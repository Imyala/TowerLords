using UnityEngine;
using UnityEngine.AI;
using UnityEngine.InputSystem;
using System.Collections;

public class PlayerMovement : MonoBehaviour
{
    private NavMeshAgent agent;

    [Header("Dodge Settings")]
    public float dashSpeed = 30f;
    public float dashDuration = 0.25f;
    public float dashDistance = 8f; // Increased for longer feel
    
    [Header("Charge System")]
    public int maxCharges = 2;
    public float timeToRegenCharge = 2f; // Seconds to get one charge back
    
    private int currentCharges;
    private float regenTimer = 0f;
    private bool isDashing = false;

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();
        currentCharges = maxCharges;
    }

    void Update()
    {
        if (isDashing) return;

        HandleRotation();
        HandleMovement();
        HandleDodge();
        HandleCooldown();
    }

    void HandleCooldown()
    {
        if (currentCharges < maxCharges)
        {
            regenTimer += Time.deltaTime;
            if (regenTimer >= timeToRegenCharge)
            {
                currentCharges++;
                regenTimer = 0f;
            }
        }
    }

    void HandleDodge()
    {
        if (Keyboard.current.spaceKey.wasPressedThisFrame && currentCharges > 0)
        {
            currentCharges--;
            regenTimer = 0f; // Reset timer when you use a charge
            StartCoroutine(PerformDash());
        }
    }

    IEnumerator PerformDash()
    {
        isDashing = true;
        agent.enabled = false;

        float elapsed = 0f;
        Vector3 startPos = transform.position;
        Vector3 targetPos = transform.position + (transform.forward * dashDistance);

        // Raycast to stop dashing through walls
        if (NavMesh.Raycast(transform.position, targetPos, out NavMeshHit hit, NavMesh.AllAreas))
        {
            targetPos = hit.position;
        }

        while (elapsed < dashDuration)
        {
            // Normalize time (0 to 1)
            float t = elapsed / dashDuration;
            
            // Ease-Out Quadratic: t * (2 - t)
            // This starts fast and slows down at the end
            float easedT = t * (2 - t);
            
            transform.position = Vector3.Lerp(startPos, targetPos, easedT);
            
            elapsed += Time.deltaTime;
            yield return null;
        }

        transform.position = targetPos;

        agent.enabled = true;
        agent.Warp(transform.position); 
        agent.ResetPath();
        isDashing = false;
    }

    // Keep your existing HandleRotation and HandleMovement methods below...
    void HandleRotation()
    {
        Ray ray = Camera.main.ScreenPointToRay(Mouse.current.position.ReadValue());
        if (Physics.Raycast(ray, out RaycastHit hit))
        {
            Vector3 targetLookAt = new Vector3(hit.point.x, transform.position.y, hit.point.z);
            transform.LookAt(targetLookAt);
        }
    }

    void HandleMovement()
    {
        if (Mouse.current.rightButton.isPressed)
        {
            Ray ray = Camera.main.ScreenPointToRay(Mouse.current.position.ReadValue());
            if (Physics.Raycast(ray, out RaycastHit hit))
            {
                agent.SetDestination(hit.point);
            }
        }
    }
}
