using TMPro;
using TowerLords.Settings;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// One bind slot. Click it, press a key, done. Escape cancels and Delete/
    /// Backspace clears the bind, which is the convention every game in the
    /// reference set uses.
    /// </summary>
    public class KeybindCapture : MonoBehaviour
    {
        KeybindEntry _entry;
        bool _isPrimary;
        Button _button;
        TextMeshProUGUI _label;
        Image _image;

        bool _listening;
        // Ignore the same frame the click landed on, or the mouse press that
        // started the capture would immediately be captured as the new bind.
        bool _armed;

        public void Bind(KeybindEntry entry, bool isPrimary, Button button, TextMeshProUGUI label)
        {
            _entry = entry;
            _isPrimary = isPrimary;
            _button = button;
            _label = label;
            _image = button.image;

            _button.onClick.AddListener(BeginCapture);
            Refresh();
        }

        void OnDestroy()
        {
            if (_button != null) _button.onClick.RemoveListener(BeginCapture);
            if (_listening && UIManager.Instance != null) UIManager.Instance.IsCapturingRebind = false;
        }

        public void Refresh()
        {
            if (_label == null || _entry == null) return;

            var bind = _isPrimary ? _entry.primary : _entry.secondary;
            _label.text = KeybindRegistry.DisplayName(bind);
            _label.color = string.IsNullOrEmpty(bind) ? UITheme.TextMuted : UITheme.TextPrimary;
            if (_image != null) _image.color = UITheme.ControlIdle;
        }

        void BeginCapture()
        {
            if (_listening) return;

            _listening = true;
            _armed = false;
            if (UIManager.Instance != null) UIManager.Instance.IsCapturingRebind = true;

            _label.text = "Press a key…";
            _label.color = UITheme.AccentHot;
            if (_image != null) _image.color = UITheme.ControlPressed;
        }

        void EndCapture()
        {
            _listening = false;
            if (UIManager.Instance != null) UIManager.Instance.IsCapturingRebind = false;
            Refresh();
        }

        void Update()
        {
            if (!_listening) return;

            // Wait one frame so the click that opened capture isn't consumed as the bind.
            if (!_armed)
            {
                _armed = true;
                return;
            }

            var keyboard = Keyboard.current;
            if (keyboard != null)
            {
                if (keyboard.escapeKey.wasPressedThisFrame)
                {
                    EndCapture();
                    return;
                }

                if (keyboard.deleteKey.wasPressedThisFrame || keyboard.backspaceKey.wasPressedThisFrame)
                {
                    SetBind(KeybindRegistry.Unbound);
                    return;
                }
            }

            var captured = KeybindRegistry.CaptureInput();
            if (!string.IsNullOrEmpty(captured)) SetBind(captured);
        }

        void SetBind(string bind)
        {
            if (_isPrimary) _entry.primary = bind;
            else _entry.secondary = bind;
            EndCapture();
        }
    }
}
