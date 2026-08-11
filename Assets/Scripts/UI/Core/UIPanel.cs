using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// Base class for every full-screen panel. Panels are independent and each
    /// owns a hotkey, rather than living inside one monolithic menu — that keeps
    /// controller mapping and Escape handling simple as screens are added.
    ///
    /// Content is built lazily on first open so startup stays cheap.
    /// </summary>
    [RequireComponent(typeof(CanvasGroup))]
    public abstract class UIPanel : MonoBehaviour
    {
        public bool IsOpen { get; private set; }

        /// <summary>Stable identifier, also used for the debug hierarchy name.</summary>
        public abstract string PanelId { get; }

        /// <summary>Keybind action that toggles this panel, or null for none.</summary>
        public virtual string HotkeyAction => null;

        /// <summary>Whether opening this panel should stop the world.</summary>
        public virtual bool PausesGame => true;

        /// <summary>Whether Escape closes this panel. Confirmation dialogs set this false.</summary>
        public virtual bool ClosesOnEscape => true;

        /// <summary>Panels that dim the world behind them draw a full-screen scrim.</summary>
        protected virtual bool UseBackdrop => true;

        protected RectTransform Root { get; private set; }
        protected CanvasGroup Group { get; private set; }

        bool _built;
        Coroutine _fade;

        protected virtual void Awake()
        {
            Group = GetComponent<CanvasGroup>();
            Root = (RectTransform)transform;
            Root.anchorMin = Vector2.zero;
            Root.anchorMax = Vector2.one;
            Root.offsetMin = Vector2.zero;
            Root.offsetMax = Vector2.zero;

            Group.alpha = 0f;
            Group.interactable = false;
            Group.blocksRaycasts = false;
            gameObject.SetActive(false);
        }

        /// <summary>Assemble the panel's contents. Called once, before the first open.</summary>
        protected abstract void Build();

        /// <summary>Refresh displayed values from game state. Called on every open.</summary>
        protected virtual void OnOpened() { }

        protected virtual void OnClosed() { }

        public void Open()
        {
            if (IsOpen) return;

            gameObject.SetActive(true);

            if (!_built)
            {
                if (UseBackdrop)
                {
                    var backdrop = UIFactory.StretchPanel("Backdrop", transform, UITheme.Backdrop);
                    backdrop.transform.SetAsFirstSibling();
                }
                Build();
                _built = true;
            }

            IsOpen = true;
            Group.interactable = true;
            Group.blocksRaycasts = true;

            OnOpened();
            UIManager.Instance?.NotifyPanelOpened(this);
            StartFade(1f, deactivateWhenDone: false);
        }

        public void Close()
        {
            if (!IsOpen) return;

            IsOpen = false;
            Group.interactable = false;
            Group.blocksRaycasts = false;

            OnClosed();
            UIManager.Instance?.NotifyPanelClosed(this);
            StartFade(0f, deactivateWhenDone: true);
        }

        public void Toggle()
        {
            if (IsOpen) Close();
            else Open();
        }

        void StartFade(float target, bool deactivateWhenDone)
        {
            if (_fade != null) StopCoroutine(_fade);
            if (!gameObject.activeInHierarchy)
            {
                Group.alpha = target;
                return;
            }
            _fade = StartCoroutine(FadeTo(target, deactivateWhenDone));
        }

        IEnumerator FadeTo(float target, bool deactivateWhenDone)
        {
            var start = Group.alpha;
            var elapsed = 0f;

            while (elapsed < UITheme.FadeDuration)
            {
                // Unscaled: panels must animate while the game is paused.
                elapsed += Time.unscaledDeltaTime;
                Group.alpha = Mathf.Lerp(start, target, elapsed / UITheme.FadeDuration);
                yield return null;
            }

            Group.alpha = target;
            _fade = null;

            if (deactivateWhenDone && Mathf.Approximately(target, 0f))
                gameObject.SetActive(false);
        }

        /// <summary>
        /// Standard panel chrome: a centred window with a title bar and a close
        /// button. Returns the empty body rect for the caller to fill.
        /// </summary>
        protected RectTransform BuildWindow(string title, Vector2 size)
        {
            var window = UIFactory.Panel("Window", transform, UITheme.PanelBase);
            var wrt = window.rectTransform;
            wrt.anchorMin = new Vector2(0.5f, 0.5f);
            wrt.anchorMax = new Vector2(0.5f, 0.5f);
            wrt.pivot = new Vector2(0.5f, 0.5f);
            wrt.sizeDelta = size;
            wrt.anchoredPosition = Vector2.zero;

            var header = UIFactory.Panel("Header", window.transform, UITheme.PanelRaised);
            var hrt = header.rectTransform;
            hrt.anchorMin = new Vector2(0f, 1f);
            hrt.anchorMax = new Vector2(1f, 1f);
            hrt.pivot = new Vector2(0.5f, 1f);
            hrt.sizeDelta = new Vector2(0f, 54f);
            hrt.anchoredPosition = Vector2.zero;

            var titleText = UIFactory.Text("Title", header.transform, title.ToUpperInvariant(),
                                           UITheme.FontSizeTitle, UITheme.TextPrimary);
            titleText.characterSpacing = 6f;
            var trt = titleText.rectTransform;
            trt.anchorMin = Vector2.zero;
            trt.anchorMax = Vector2.one;
            trt.offsetMin = new Vector2(UITheme.PanelPadding, 0f);
            trt.offsetMax = new Vector2(-60f, 0f);
            titleText.alignment = TMPro.TextAlignmentOptions.Left;

            var accentRule = UIFactory.Panel("AccentRule", header.transform, UITheme.Accent);
            var art = accentRule.rectTransform;
            art.anchorMin = new Vector2(0f, 0f);
            art.anchorMax = new Vector2(1f, 0f);
            art.pivot = new Vector2(0.5f, 0f);
            art.sizeDelta = new Vector2(0f, 2f);
            art.anchoredPosition = Vector2.zero;

            var close = UIFactory.Button("Close", header.transform, "✕", out var closeLabel,
                                         idle: new Color(0f, 0f, 0f, 0f));
            closeLabel.color = UITheme.TextSecondary;
            var crt = close.image.rectTransform;
            crt.anchorMin = new Vector2(1f, 0.5f);
            crt.anchorMax = new Vector2(1f, 0.5f);
            crt.pivot = new Vector2(1f, 0.5f);
            crt.sizeDelta = new Vector2(46f, 46f);
            crt.anchoredPosition = new Vector2(-6f, 0f);
            close.onClick.AddListener(Close);

            var body = UIFactory.Rect("Body", window.transform);
            body.anchorMin = Vector2.zero;
            body.anchorMax = Vector2.one;
            body.offsetMin = new Vector2(UITheme.PanelPadding, UITheme.PanelPadding);
            body.offsetMax = new Vector2(-UITheme.PanelPadding, -(54f + UITheme.PanelPadding));

            return body;
        }
    }
}
