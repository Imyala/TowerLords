using System;
using System.Collections.Generic;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.Controls;

namespace TowerLords.Settings
{
    public enum BindCategory { Movement, Combat, Panels, Interface, Misc }

    /// <summary>A rebindable action. Ids are stable save keys; labels are player-facing.</summary>
    public class BindAction
    {
        public readonly string Id;
        public readonly string Label;
        public readonly BindCategory Category;
        public readonly string DefaultPrimary;
        public readonly string DefaultSecondary;

        public BindAction(string id, string label, BindCategory category,
                          string defaultPrimary, string defaultSecondary = "")
        {
            Id = id;
            Label = label;
            Category = category;
            DefaultPrimary = defaultPrimary;
            DefaultSecondary = defaultSecondary;
        }
    }

    /// <summary>
    /// Every rebindable action in the game, and the runtime lookup for "is this
    /// action down right now". Panels each own a hotkey from the start so the
    /// binding screen never has to be retrofitted.
    ///
    /// Bind strings are either an <see cref="Key"/> enum name ("Space", "Digit1")
    /// or one of the mouse tokens below.
    /// </summary>
    public static class KeybindRegistry
    {
        public const string MouseLeft   = "MouseLeft";
        public const string MouseRight  = "MouseRight";
        public const string MouseMiddle = "MouseMiddle";
        public const string Unbound     = "";

        // Action ids used elsewhere in code.
        public const string MoveTo        = "move_to";
        public const string Dodge         = "dodge";
        public const string MasterySlot1  = "mastery_1";
        public const string MasterySlot2  = "mastery_2";
        public const string Interact      = "interact";
        public const string BasicAttack   = "basic_attack";

        public const string PanelInventory = "panel_inventory";
        public const string PanelLoadout   = "panel_loadout";
        public const string PanelFeats     = "panel_feats";
        public const string PanelMap       = "panel_map";
        public const string PanelJournal   = "panel_journal";
        public const string PanelSettings  = "panel_settings";

        public const string ToggleHud     = "toggle_hud";
        public const string Screenshot    = "screenshot";
        public const string ShowNameplates = "show_nameplates";

        public static readonly BindAction[] Actions =
        {
            new BindAction(MoveTo,       "Move To",            BindCategory.Movement, MouseRight),
            new BindAction(Dodge,        "Dodge / Dash",       BindCategory.Movement, "Space"),

            new BindAction(BasicAttack,  "Basic Attack",       BindCategory.Combat, MouseLeft),
            new BindAction(MasterySlot1, "Mastery Slot I",     BindCategory.Combat, "Q"),
            new BindAction(MasterySlot2, "Mastery Slot II",    BindCategory.Combat, "E"),
            new BindAction(Interact,     "Interact",           BindCategory.Combat, "F"),

            new BindAction(PanelInventory, "Inventory",        BindCategory.Panels, "I"),
            new BindAction(PanelLoadout,   "Loadout / Mastery", BindCategory.Panels, "C"),
            new BindAction(PanelFeats,     "Feats Journal",    BindCategory.Panels, "J"),
            new BindAction(PanelMap,       "Tower Map",        BindCategory.Panels, "M"),
            new BindAction(PanelJournal,   "Run Log",          BindCategory.Panels, "L"),
            new BindAction(PanelSettings,  "Settings",         BindCategory.Panels, "F11"),

            new BindAction(ToggleHud,      "Show / Hide HUD",  BindCategory.Interface, "F10"),
            new BindAction(ShowNameplates, "Show Nameplates",  BindCategory.Interface, "LeftAlt"),
            new BindAction(Screenshot,     "Screenshot",       BindCategory.Misc, "F6"),
        };

        static readonly Dictionary<string, BindAction> ById = BuildIndex();

        static Dictionary<string, BindAction> BuildIndex()
        {
            var map = new Dictionary<string, BindAction>(Actions.Length);
            foreach (var a in Actions) map[a.Id] = a;
            return map;
        }

        public static BindAction Get(string id) => ById.TryGetValue(id, out var a) ? a : null;

        /// <summary>Fills in any action the save file predates, so adding an action
        /// never leaves a player with an unbound key.</summary>
        public static void EnsureDefaults(GameSettings settings)
        {
            foreach (var action in Actions)
            {
                if (settings.keybinds.Exists(k => k.action == action.Id)) continue;
                settings.keybinds.Add(new KeybindEntry(action.Id, action.DefaultPrimary, action.DefaultSecondary));
            }
        }

        public static void ResetToDefaults(GameSettings settings)
        {
            settings.keybinds.Clear();
            EnsureDefaults(settings);
        }

        public static KeybindEntry Entry(GameSettings settings, string actionId)
        {
            var entry = settings.keybinds.Find(k => k.action == actionId);
            if (entry != null) return entry;

            var action = Get(actionId);
            entry = new KeybindEntry(actionId, action?.DefaultPrimary ?? Unbound,
                                     action?.DefaultSecondary ?? Unbound);
            settings.keybinds.Add(entry);
            return entry;
        }

        // ---- Runtime queries ------------------------------------------------

        public static bool WasPressedThisFrame(string actionId)
        {
            var entry = Entry(SettingsService.Current, actionId);
            return BindPressedThisFrame(entry.primary) || BindPressedThisFrame(entry.secondary);
        }

        public static bool IsPressed(string actionId)
        {
            var entry = Entry(SettingsService.Current, actionId);
            return BindIsPressed(entry.primary) || BindIsPressed(entry.secondary);
        }

        static bool BindPressedThisFrame(string bind)
        {
            if (string.IsNullOrEmpty(bind)) return false;

            switch (bind)
            {
                case MouseLeft:   return Mouse.current != null && Mouse.current.leftButton.wasPressedThisFrame;
                case MouseRight:  return Mouse.current != null && Mouse.current.rightButton.wasPressedThisFrame;
                case MouseMiddle: return Mouse.current != null && Mouse.current.middleButton.wasPressedThisFrame;
            }

            var control = ResolveKey(bind);
            return control != null && control.wasPressedThisFrame;
        }

        static bool BindIsPressed(string bind)
        {
            if (string.IsNullOrEmpty(bind)) return false;

            switch (bind)
            {
                case MouseLeft:   return Mouse.current != null && Mouse.current.leftButton.isPressed;
                case MouseRight:  return Mouse.current != null && Mouse.current.rightButton.isPressed;
                case MouseMiddle: return Mouse.current != null && Mouse.current.middleButton.isPressed;
            }

            var control = ResolveKey(bind);
            return control != null && control.isPressed;
        }

        static ButtonControl ResolveKey(string bind)
        {
            if (Keyboard.current == null) return null;
            if (!Enum.TryParse(bind, ignoreCase: true, out Key key)) return null;
            if (key == Key.None) return null;
            return Keyboard.current[key];
        }

        /// <summary>Turns a stored bind into something worth showing a player.</summary>
        public static string DisplayName(string bind)
        {
            if (string.IsNullOrEmpty(bind)) return "—";

            switch (bind)
            {
                case MouseLeft:   return "Left Mouse";
                case MouseRight:  return "Right Mouse";
                case MouseMiddle: return "Middle Mouse";
            }

            // "Digit1" -> "1", "LeftAlt" -> "Left Alt", "F11" stays "F11".
            if (bind.StartsWith("Digit", StringComparison.Ordinal) && bind.Length > 5)
                return bind.Substring(5);
            if (bind.StartsWith("Numpad", StringComparison.Ordinal))
                return "Num " + bind.Substring(6);

            var spaced = System.Text.RegularExpressions.Regex.Replace(bind, "(?<!^)([A-Z])", " $1");
            return spaced;
        }

        /// <summary>Reads whichever key/mouse button the player just pressed, for the
        /// rebinding flow. Returns null when nothing was pressed this frame.</summary>
        public static string CaptureInput()
        {
            if (Mouse.current != null)
            {
                if (Mouse.current.leftButton.wasPressedThisFrame)   return MouseLeft;
                if (Mouse.current.rightButton.wasPressedThisFrame)  return MouseRight;
                if (Mouse.current.middleButton.wasPressedThisFrame) return MouseMiddle;
            }

            if (Keyboard.current == null) return null;

            foreach (var control in Keyboard.current.allKeys)
            {
                if (!control.wasPressedThisFrame) continue;
                if (control.keyCode == Key.None) continue;
                return control.keyCode.ToString();
            }

            return null;
        }
    }
}
