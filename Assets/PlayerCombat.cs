using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerCombat : MonoBehaviour
{
    public GameObject hitbox;
    public float attackDuration = 0.15f;

    void Start()
    {
        if (hitbox != null) hitbox.SetActive(false);
    }

    void Update()
    {
        // Left click to attack
        if (Mouse.current.leftButton.wasPressedThisFrame)
        {
            Attack();
        }
    }

    void Attack()
    {
        if (hitbox == null) return;
        hitbox.SetActive(true);
        CancelInvoke("EndAttack");
        Invoke("EndAttack", attackDuration);
    }

    void EndAttack()
    {
        hitbox.SetActive(false);
    }
}