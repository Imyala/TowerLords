using System.Collections;
using TowerLords.Settings;
using TowerLords.UI;
using UnityEngine;
using UnityEngine.AI;
using UnityEngine.InputSystem;

namespace TowerLords.Gameplay
{
    public class PlayerMovement : MonoBehaviour
    {
        private NavMeshAgent agent;

        [Header("Dodge Settings")]
        public float dashSpeed = 30f;
        public float dashDuration = 0.25f;
        public float dashDistance = 8f;

        [Header("Charge System")]
        public int maxCharges = 2;
        public float timeToRegenCharge = 2f;

        private int currentCharges;
        private float regenTimer = 0f;
        private bool isDashing = false;

        // Double-tap-to-dodge state, enabled per the gameplay settings.
        private float lastDirectionTapTime = -1f;
        private const float DoubleTapWindow = 0.28f;

        void Start()
        {
            agent = GetComponent<NavMeshAgent>();
            currentCharges = maxCharges;
        }

        void Update()
        {
            if (isDashing) return;

            // A panel is up: the world must not react to clicks aimed at the UI.
            if (UIManager.InputCaptured) return;

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
            if (currentCharges <= 0) return;

            var dodgePressed = KeybindRegistry.WasPressedThisFrame(KeybindRegistry.Dodge);

            if (!dodgePressed && SettingsService.Current.doubleTapToDodge)
                dodgePressed = DetectDoubleTap();

            if (!dodgePressed) return;

            currentCharges--;
            regenTimer = 0f;
            StartCoroutine(PerformDash());
        }

        bool DetectDoubleTap()
        {
            if (!KeybindRegistry.WasPressedThisFrame(KeybindRegistry.MoveTo)) return false;

            var now = Time.time;
            var isDoubleTap = now - lastDirectionTapTime <= DoubleTapWindow;
            lastDirectionTapTime = isDoubleTap ? -1f : now;
            return isDoubleTap;
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
                float t = elapsed / dashDuration;

                // Ease-Out Quadratic: starts fast and slows at the end.
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

        void HandleRotation()
        {
            if (Camera.main == null || Mouse.current == null) return;

            Ray ray = Camera.main.ScreenPointToRay(Mouse.current.position.ReadValue());
            if (Physics.Raycast(ray, out RaycastHit hit))
            {
                Vector3 targetLookAt = new Vector3(hit.point.x, transform.position.y, hit.point.z);
                transform.LookAt(targetLookAt);
            }
        }

        void HandleMovement()
        {
            if (Camera.main == null || Mouse.current == null) return;
            if (!KeybindRegistry.IsPressed(KeybindRegistry.MoveTo)) return;

            Ray ray = Camera.main.ScreenPointToRay(Mouse.current.position.ReadValue());
            if (Physics.Raycast(ray, out RaycastHit hit))
            {
                agent.SetDestination(hit.point);
            }
        }
    }
}
