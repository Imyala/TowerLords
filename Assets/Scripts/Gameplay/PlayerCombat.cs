using TowerLords.Settings;
using TowerLords.UI;
using UnityEngine;

namespace TowerLords.Gameplay
{
    public class PlayerCombat : MonoBehaviour
    {
        public GameObject hitbox;
        public float attackDuration = 0.15f;

        [Header("Mastery Slots")]
        [Tooltip("Cooldown of the ability in Mastery Slot I, in seconds.")]
        public float slotOneCooldown = 6f;
        [Tooltip("Cooldown of the ability in Mastery Slot II, in seconds.")]
        public float slotTwoCooldown = 10f;

        void Start()
        {
            if (hitbox != null) hitbox.SetActive(false);
        }

        void Update()
        {
            // Clicking a menu must never swing the weapon behind it.
            if (UIManager.InputCaptured) return;

            if (KeybindRegistry.WasPressedThisFrame(KeybindRegistry.BasicAttack))
                Attack();

            if (KeybindRegistry.WasPressedThisFrame(KeybindRegistry.MasterySlot1))
                UseMastery(0, slotOneCooldown);

            if (KeybindRegistry.WasPressedThisFrame(KeybindRegistry.MasterySlot2))
                UseMastery(1, slotTwoCooldown);
        }

        void Attack()
        {
            if (hitbox == null) return;

            CombatState.Touch();
            hitbox.SetActive(true);
            CancelInvoke(nameof(EndAttack));
            Invoke(nameof(EndAttack), attackDuration);
        }

        /// <summary>
        /// Placeholder for the Two-Slot Mastery System. The slot only fires when
        /// its cooldown is clear, which is what makes the two-slot restriction a
        /// real decision rather than a cosmetic one.
        /// </summary>
        void UseMastery(int slotIndex, float cooldown)
        {
            var slot = HudController.Instance?.Slot(slotIndex);
            if (slot == null) return;

            if (slot.IsEmpty)
            {
                FloatingCombatText.Spawn(transform.position + Vector3.up * 2.4f,
                                         "Slot Empty", CombatTextKind.Status);
                return;
            }

            if (!slot.IsReady) return;

            CombatState.Touch();
            slot.StartCooldown(cooldown);

            // Hook the actual ability effect in here once masteries exist.
            Attack();
        }

        void EndAttack()
        {
            if (hitbox != null) hitbox.SetActive(false);
        }
    }
}
