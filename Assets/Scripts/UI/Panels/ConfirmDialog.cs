using System;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// The prompt used for anything unrecoverable. In a permadeath game these
    /// carry real weight, so the dangerous variant is tinted and never becomes
    /// the default-focused button.
    /// </summary>
    public class ConfirmDialog : UIPanel
    {
        public const string Id = "confirm";

        public override string PanelId => Id;
        public override bool PausesGame => true;

        TextMeshProUGUI _title;
        TextMeshProUGUI _message;
        TextMeshProUGUI _confirmLabel;
        Image _confirmBackground;
        Button _confirmButton;

        Action _onConfirm;
        Action _onCancel;

        /// <summary>
        /// Shows the shared dialog. Returns false when no UI is running, so callers
        /// can fall back to acting immediately rather than silently doing nothing.
        /// </summary>
        public static bool Show(string title, string message, string confirmText,
                                Action onConfirm, bool danger = false, Action onCancel = null)
        {
            var dialog = UIManager.Instance?.GetPanel<ConfirmDialog>();
            if (dialog == null) return false;

            dialog.Configure(title, message, confirmText, onConfirm, danger, onCancel);
            dialog.Open();
            return true;
        }

        void Configure(string title, string message, string confirmText,
                       Action onConfirm, bool danger, Action onCancel)
        {
            _onConfirm = onConfirm;
            _onCancel = onCancel;

            // Build() runs on first Open, so cache the text until the widgets exist.
            _pendingTitle = title;
            _pendingMessage = message;
            _pendingConfirmText = confirmText;
            _pendingDanger = danger;

            ApplyPending();
        }

        string _pendingTitle, _pendingMessage, _pendingConfirmText;
        bool _pendingDanger;

        void ApplyPending()
        {
            if (_title == null) return;

            _title.text = (_pendingTitle ?? "Confirm").ToUpperInvariant();
            _message.text = _pendingMessage ?? "";
            _confirmLabel.text = string.IsNullOrEmpty(_pendingConfirmText) ? "Confirm" : _pendingConfirmText;
            _confirmLabel.color = _pendingDanger ? Color.white : UITheme.AccentHot;
            _confirmBackground.color = _pendingDanger ? UITheme.Danger : UITheme.AccentDim;
        }

        protected override void Build()
        {
            var window = UIFactory.Panel("Window", transform, UITheme.PanelBase);
            var wrt = window.rectTransform;
            wrt.anchorMin = new Vector2(0.5f, 0.5f);
            wrt.anchorMax = new Vector2(0.5f, 0.5f);
            wrt.sizeDelta = new Vector2(520f, 240f);
            wrt.anchoredPosition = Vector2.zero;

            var accent = UIFactory.Panel("AccentRule", window.transform, UITheme.Accent);
            var art = accent.rectTransform;
            art.anchorMin = new Vector2(0f, 1f);
            art.anchorMax = new Vector2(1f, 1f);
            art.pivot = new Vector2(0.5f, 1f);
            art.sizeDelta = new Vector2(0f, 2f);
            art.anchoredPosition = Vector2.zero;

            _title = UIFactory.Text("Title", window.transform, "", 20f, UITheme.TextPrimary);
            _title.characterSpacing = 5f;
            var trt = _title.rectTransform;
            trt.anchorMin = new Vector2(0f, 1f);
            trt.anchorMax = new Vector2(1f, 1f);
            trt.pivot = new Vector2(0.5f, 1f);
            trt.sizeDelta = new Vector2(-48f, 40f);
            trt.anchoredPosition = new Vector2(0f, -22f);

            _message = UIFactory.Text("Message", window.transform, "", UITheme.FontSizeBody,
                                      UITheme.TextSecondary);
            _message.alignment = TextAlignmentOptions.TopLeft;
            var mrt = _message.rectTransform;
            mrt.anchorMin = new Vector2(0f, 0f);
            mrt.anchorMax = new Vector2(1f, 1f);
            mrt.offsetMin = new Vector2(24f, 70f);
            mrt.offsetMax = new Vector2(-24f, -68f);

            var buttons = UIFactory.Rect("Buttons", window.transform);
            buttons.anchorMin = new Vector2(1f, 0f);
            buttons.anchorMax = new Vector2(1f, 0f);
            buttons.pivot = new Vector2(1f, 0f);
            buttons.sizeDelta = new Vector2(340f, 40f);
            buttons.anchoredPosition = new Vector2(-24f, 22f);
            UIFactory.HorizontalLayout(buttons, 10f).childAlignment = TextAnchor.MiddleRight;

            var cancel = UIFactory.Button("Cancel", buttons, "Cancel");
            UIFactory.SetWidth(cancel.gameObject, 130f);
            cancel.onClick.AddListener(() =>
            {
                var callback = _onCancel;
                Close();
                callback?.Invoke();
            });

            _confirmButton = UIFactory.Button("Confirm", buttons, "Confirm", out _confirmLabel,
                                              idle: UITheme.AccentDim);
            _confirmBackground = _confirmButton.image;
            UIFactory.SetWidth(_confirmButton.gameObject, 170f);
            _confirmButton.onClick.AddListener(() =>
            {
                var callback = _onConfirm;
                Close();
                callback?.Invoke();
            });

            ApplyPending();
        }

        protected override void OnClosed()
        {
            _onConfirm = null;
            _onCancel = null;
        }
    }
}
