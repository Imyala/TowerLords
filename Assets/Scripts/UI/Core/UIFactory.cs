using TMPro;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// Builds uGUI primitives in code. Every screen in the game is assembled
    /// from these, so layout lives in C# and version-controls as readable diffs
    /// instead of scene YAML.
    /// </summary>
    public static class UIFactory
    {
        // ---- Structure -----------------------------------------------------

        public static RectTransform Rect(string name, Transform parent)
        {
            var go = new GameObject(name, typeof(RectTransform));
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            rt.localScale = Vector3.one;
            return rt;
        }

        /// <summary>A rect that fills its parent, optionally inset by padding.</summary>
        public static RectTransform Stretch(string name, Transform parent, float padding = 0f)
        {
            var rt = Rect(name, parent);
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = new Vector2(padding, padding);
            rt.offsetMax = new Vector2(-padding, -padding);
            return rt;
        }

        public static Image Panel(string name, Transform parent, Color color)
        {
            var rt = Rect(name, parent);
            var img = rt.gameObject.AddComponent<Image>();
            img.color = color;
            img.raycastTarget = true;
            return img;
        }

        public static Image StretchPanel(string name, Transform parent, Color color, float padding = 0f)
        {
            var img = Panel(name, parent, color);
            var rt = img.rectTransform;
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.offsetMin = new Vector2(padding, padding);
            rt.offsetMax = new Vector2(-padding, -padding);
            return img;
        }

        /// <summary>A 1px horizontal rule used to separate setting groups.</summary>
        public static Image Divider(Transform parent)
        {
            var img = Panel("Divider", parent, UITheme.Divider);
            var le = img.gameObject.AddComponent<LayoutElement>();
            le.minHeight = 1f;
            le.preferredHeight = 1f;
            le.flexibleWidth = 1f;
            return img;
        }

        public static LayoutElement Spacer(Transform parent, float height)
        {
            var rt = Rect("Spacer", parent);
            var le = rt.gameObject.AddComponent<LayoutElement>();
            le.minHeight = height;
            le.preferredHeight = height;
            le.flexibleWidth = 1f;
            return le;
        }

        // ---- Text ----------------------------------------------------------

        public static TextMeshProUGUI Text(string name, Transform parent, string content,
                                           float size, Color color,
                                           TextAlignmentOptions align = TextAlignmentOptions.Left)
        {
            var rt = Rect(name, parent);
            var tmp = rt.gameObject.AddComponent<TextMeshProUGUI>();
            tmp.text = content;
            tmp.fontSize = size;
            tmp.color = color;
            tmp.alignment = align;
            tmp.raycastTarget = false;
            tmp.richText = true;
            return tmp;
        }

        /// <summary>Uppercase amber group header, e.g. "CAMERA" above a block of rows.</summary>
        public static TextMeshProUGUI SectionHeader(Transform parent, string label)
        {
            var tmp = Text("Section_" + label, parent, label.ToUpperInvariant(),
                           UITheme.FontSizeSection, UITheme.Accent);
            tmp.fontStyle = FontStyles.Bold;
            tmp.characterSpacing = 8f;
            var le = tmp.gameObject.AddComponent<LayoutElement>();
            le.minHeight = 26f;
            le.preferredHeight = 26f;
            le.flexibleWidth = 1f;
            return tmp;
        }

        // ---- Controls ------------------------------------------------------

        /// <summary>
        /// A button with themed hover/press states. The label is returned via
        /// <paramref name="label"/> so callers can retint or rewrite it later.
        /// </summary>
        public static Button Button(string name, Transform parent, string text,
                                    out TextMeshProUGUI label,
                                    Color? idle = null, Color? textColor = null)
        {
            var img = Panel(name, parent, idle ?? UITheme.ControlIdle);
            var btn = img.gameObject.AddComponent<Button>();
            btn.targetGraphic = img;
            btn.transition = Selectable.Transition.ColorTint;

            var colors = btn.colors;
            colors.normalColor      = Color.white;
            colors.highlightedColor = Multiply(UITheme.ControlHover, idle ?? UITheme.ControlIdle);
            colors.pressedColor     = Multiply(UITheme.ControlPressed, idle ?? UITheme.ControlIdle);
            colors.selectedColor    = Color.white;
            colors.disabledColor    = new Color(1f, 1f, 1f, 0.35f);
            colors.fadeDuration     = UITheme.FadeDuration;
            btn.colors = colors;

            label = Text("Label", img.transform, text, UITheme.FontSizeBody,
                         textColor ?? UITheme.TextPrimary, TextAlignmentOptions.Center);
            var lrt = label.rectTransform;
            lrt.anchorMin = Vector2.zero;
            lrt.anchorMax = Vector2.one;
            lrt.offsetMin = new Vector2(10f, 0f);
            lrt.offsetMax = new Vector2(-10f, 0f);

            return btn;
        }

        public static Button Button(string name, Transform parent, string text)
            => Button(name, parent, text, out _);

        public static Slider Slider(string name, Transform parent, float min, float max, float value)
        {
            var root = Rect(name, parent);
            var slider = root.gameObject.AddComponent<Slider>();

            var track = Panel("Track", root, UITheme.PanelSunken);
            var trt = track.rectTransform;
            trt.anchorMin = new Vector2(0f, 0.5f);
            trt.anchorMax = new Vector2(1f, 0.5f);
            trt.sizeDelta = new Vector2(0f, 5f);
            trt.anchoredPosition = Vector2.zero;

            var fillArea = Rect("FillArea", root);
            fillArea.anchorMin = new Vector2(0f, 0.5f);
            fillArea.anchorMax = new Vector2(1f, 0.5f);
            fillArea.sizeDelta = new Vector2(-14f, 5f);
            fillArea.anchoredPosition = Vector2.zero;

            var fill = Panel("Fill", fillArea, UITheme.Accent);
            fill.rectTransform.sizeDelta = new Vector2(14f, 0f);

            var handleArea = Rect("HandleArea", root);
            handleArea.anchorMin = Vector2.zero;
            handleArea.anchorMax = Vector2.one;
            handleArea.sizeDelta = new Vector2(-14f, 0f);

            var handle = Panel("Handle", handleArea, UITheme.AccentHot);
            handle.rectTransform.sizeDelta = new Vector2(14f, 18f);

            slider.fillRect = fill.rectTransform;
            slider.handleRect = handle.rectTransform;
            slider.targetGraphic = handle;
            slider.direction = UnityEngine.UI.Slider.Direction.LeftToRight;
            slider.minValue = min;
            slider.maxValue = max;
            slider.SetValueWithoutNotify(Mathf.Clamp(value, min, max));

            return slider;
        }

        public static TMP_Dropdown Dropdown(string name, Transform parent)
        {
            var img = Panel(name, parent, UITheme.ControlIdle);
            var dd = img.gameObject.AddComponent<TMP_Dropdown>();
            dd.targetGraphic = img;

            var caption = Text("Caption", img.transform, "", UITheme.FontSizeBody, UITheme.TextPrimary);
            var crt = caption.rectTransform;
            crt.anchorMin = Vector2.zero;
            crt.anchorMax = Vector2.one;
            crt.offsetMin = new Vector2(11f, 0f);
            crt.offsetMax = new Vector2(-26f, 0f);
            caption.alignment = TextAlignmentOptions.Left;
            dd.captionText = caption;

            var arrow = Text("Arrow", img.transform, "▾", UITheme.FontSizeBody, UITheme.Accent,
                             TextAlignmentOptions.Center);
            var art = arrow.rectTransform;
            art.anchorMin = new Vector2(1f, 0f);
            art.anchorMax = new Vector2(1f, 1f);
            art.pivot = new Vector2(1f, 0.5f);
            art.sizeDelta = new Vector2(24f, 0f);
            art.anchoredPosition = Vector2.zero;

            // --- dropdown list template (must be inactive; TMP clones it) ---
            var template = Rect("Template", img.transform);
            template.anchorMin = new Vector2(0f, 0f);
            template.anchorMax = new Vector2(1f, 0f);
            template.pivot = new Vector2(0.5f, 1f);
            template.anchoredPosition = new Vector2(0f, 2f);
            template.sizeDelta = new Vector2(0f, 190f);
            var templateBg = template.gameObject.AddComponent<Image>();
            templateBg.color = UITheme.PanelRaised;

            var scroll = template.gameObject.AddComponent<ScrollRect>();
            var viewport = Rect("Viewport", template);
            viewport.anchorMin = Vector2.zero;
            viewport.anchorMax = Vector2.one;
            viewport.sizeDelta = Vector2.zero;
            viewport.pivot = new Vector2(0f, 1f);
            var vpMask = viewport.gameObject.AddComponent<Image>();
            vpMask.color = Color.white;
            var mask = viewport.gameObject.AddComponent<Mask>();
            mask.showMaskGraphic = false;

            var content = Rect("Content", viewport);
            content.anchorMin = new Vector2(0f, 1f);
            content.anchorMax = new Vector2(1f, 1f);
            content.pivot = new Vector2(0.5f, 1f);
            content.sizeDelta = new Vector2(0f, 30f);

            var item = Rect("Item", content);
            item.anchorMin = new Vector2(0f, 0.5f);
            item.anchorMax = new Vector2(1f, 0.5f);
            item.sizeDelta = new Vector2(0f, 30f);

            var itemBg = item.gameObject.AddComponent<Image>();
            itemBg.color = new Color(0f, 0f, 0f, 0f);
            var itemToggle = item.gameObject.AddComponent<Toggle>();
            itemToggle.targetGraphic = itemBg;

            var itemChecked = Panel("ItemBackground", item, UITheme.AccentDim);
            var icrt = itemChecked.rectTransform;
            icrt.anchorMin = Vector2.zero;
            icrt.anchorMax = Vector2.one;
            icrt.sizeDelta = Vector2.zero;
            itemChecked.transform.SetAsFirstSibling();
            itemToggle.graphic = itemChecked;

            var itemLabel = Text("ItemLabel", item, "Option", UITheme.FontSizeBody, UITheme.TextPrimary);
            var ilrt = itemLabel.rectTransform;
            ilrt.anchorMin = Vector2.zero;
            ilrt.anchorMax = Vector2.one;
            ilrt.offsetMin = new Vector2(11f, 0f);
            ilrt.offsetMax = new Vector2(-11f, 0f);

            scroll.content = content;
            scroll.viewport = viewport;
            scroll.horizontal = false;
            scroll.movementType = ScrollRect.MovementType.Clamped;
            scroll.scrollSensitivity = 22f;

            dd.template = template;
            dd.itemText = itemLabel;
            template.gameObject.SetActive(false);

            return dd;
        }

        /// <summary>
        /// An on/off pill. uGUI's stock Toggle look doesn't match the rest of the
        /// theme, so the "checkmark" here is a filled bar that slides colour.
        /// </summary>
        public static Toggle Toggle(string name, Transform parent, bool isOn)
        {
            var img = Panel(name, parent, UITheme.ControlOff);
            var toggle = img.gameObject.AddComponent<Toggle>();
            toggle.targetGraphic = img;
            toggle.transition = Selectable.Transition.ColorTint;

            var colors = toggle.colors;
            colors.highlightedColor = new Color(1.25f, 1.25f, 1.25f, 1f);
            colors.pressedColor     = new Color(0.85f, 0.85f, 0.85f, 1f);
            colors.fadeDuration     = UITheme.FadeDuration;
            toggle.colors = colors;

            var knob = Panel("Knob", img.transform, UITheme.Accent);
            var krt = knob.rectTransform;
            krt.anchorMin = new Vector2(0f, 0f);
            krt.anchorMax = new Vector2(0f, 1f);
            krt.pivot = new Vector2(0f, 0.5f);
            krt.sizeDelta = new Vector2(22f, -6f);
            krt.anchoredPosition = new Vector2(3f, 0f);
            knob.raycastTarget = false;

            toggle.graphic = knob;
            toggle.SetIsOnWithoutNotify(isOn);

            // Keep the knob's position and the pill's tint in sync with state.
            var visual = img.gameObject.AddComponent<TogglePillVisual>();
            visual.Bind(toggle, img, knob);

            return toggle;
        }

        // ---- Scrolling -----------------------------------------------------

        /// <summary>
        /// A vertical scroll view. Returns the content rect, which already has a
        /// VerticalLayoutGroup + ContentSizeFitter, so callers just add children.
        /// </summary>
        public static RectTransform ScrollView(string name, Transform parent, out ScrollRect scrollRect,
                                               float spacing = UITheme.RowSpacing,
                                               RectOffset padding = null)
        {
            var root = Rect(name, parent);
            scrollRect = root.gameObject.AddComponent<ScrollRect>();

            var viewport = Rect("Viewport", root);
            viewport.anchorMin = Vector2.zero;
            viewport.anchorMax = Vector2.one;
            viewport.sizeDelta = Vector2.zero;
            viewport.pivot = new Vector2(0f, 1f);
            var maskImage = viewport.gameObject.AddComponent<Image>();
            maskImage.color = new Color(1f, 1f, 1f, 0.004f); // must render to mask, but stay invisible
            var mask = viewport.gameObject.AddComponent<Mask>();
            mask.showMaskGraphic = false;

            var content = Rect("Content", viewport);
            content.anchorMin = new Vector2(0f, 1f);
            content.anchorMax = new Vector2(1f, 1f);
            content.pivot = new Vector2(0.5f, 1f);
            content.sizeDelta = new Vector2(0f, 0f);

            var layout = content.gameObject.AddComponent<VerticalLayoutGroup>();
            layout.spacing = spacing;
            layout.padding = padding ?? new RectOffset(0, 10, 0, 0);
            layout.childControlWidth = true;
            layout.childControlHeight = true;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;

            var fitter = content.gameObject.AddComponent<ContentSizeFitter>();
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;

            scrollRect.content = content;
            scrollRect.viewport = viewport;
            scrollRect.horizontal = false;
            scrollRect.vertical = true;
            scrollRect.movementType = ScrollRect.MovementType.Clamped;
            scrollRect.scrollSensitivity = 34f;

            return content;
        }

        // ---- Helpers -------------------------------------------------------

        public static VerticalLayoutGroup VerticalLayout(RectTransform rt, float spacing,
                                                         RectOffset padding = null)
        {
            var layout = rt.gameObject.AddComponent<VerticalLayoutGroup>();
            layout.spacing = spacing;
            layout.padding = padding ?? new RectOffset(0, 0, 0, 0);
            layout.childControlWidth = true;
            layout.childControlHeight = true;
            layout.childForceExpandWidth = true;
            layout.childForceExpandHeight = false;
            return layout;
        }

        public static HorizontalLayoutGroup HorizontalLayout(RectTransform rt, float spacing,
                                                             RectOffset padding = null)
        {
            var layout = rt.gameObject.AddComponent<HorizontalLayoutGroup>();
            layout.spacing = spacing;
            layout.padding = padding ?? new RectOffset(0, 0, 0, 0);
            layout.childControlWidth = true;
            layout.childControlHeight = true;
            layout.childForceExpandWidth = false;
            layout.childForceExpandHeight = true;
            return layout;
        }

        public static LayoutElement SetHeight(GameObject go, float height, float flexibleWidth = 1f)
        {
            var le = go.GetComponent<LayoutElement>() ?? go.AddComponent<LayoutElement>();
            le.minHeight = height;
            le.preferredHeight = height;
            le.flexibleWidth = flexibleWidth;
            return le;
        }

        public static LayoutElement SetWidth(GameObject go, float width)
        {
            var le = go.GetComponent<LayoutElement>() ?? go.AddComponent<LayoutElement>();
            le.minWidth = width;
            le.preferredWidth = width;
            le.flexibleWidth = 0f;
            return le;
        }

        static Color Multiply(Color tint, Color baseColor)
        {
            // ColorTint multiplies against the graphic colour; convert an absolute
            // target colour into the multiplier that produces it.
            return new Color(
                baseColor.r > 0.001f ? tint.r / baseColor.r : 1f,
                baseColor.g > 0.001f ? tint.g / baseColor.g : 1f,
                baseColor.b > 0.001f ? tint.b / baseColor.b : 1f,
                1f);
        }

        public static void EnsureEventSystem()
        {
            if (EventSystem.current != null) return;
            var go = new GameObject("EventSystem", typeof(EventSystem),
                                    typeof(UnityEngine.InputSystem.UI.InputSystemUIInputModule));
            Object.DontDestroyOnLoad(go);
        }
    }

    /// <summary>Drives the pill toggle's knob position and tint from its Toggle state.</summary>
    [RequireComponent(typeof(Toggle))]
    public class TogglePillVisual : MonoBehaviour
    {
        Toggle _toggle;
        Image _pill;
        Image _knob;

        public void Bind(Toggle toggle, Image pill, Image knob)
        {
            _toggle = toggle;
            _pill = pill;
            _knob = knob;
            _toggle.onValueChanged.AddListener(Apply);
            Apply(_toggle.isOn);
        }

        void OnDestroy()
        {
            if (_toggle != null) _toggle.onValueChanged.RemoveListener(Apply);
        }

        /// <summary>Public so callers that set the toggle silently can refresh the visual.</summary>
        public void Apply(bool isOn)
        {
            if (_pill == null || _knob == null) return;

            _pill.color = isOn ? UITheme.AccentDim : UITheme.ControlOff;
            _knob.color = isOn ? UITheme.AccentHot : UITheme.TextMuted;

            var krt = _knob.rectTransform;
            krt.anchorMin = new Vector2(isOn ? 1f : 0f, 0f);
            krt.anchorMax = new Vector2(isOn ? 1f : 0f, 1f);
            krt.pivot = new Vector2(isOn ? 1f : 0f, 0.5f);
            krt.anchoredPosition = new Vector2(isOn ? -3f : 3f, 0f);
        }
    }
}
