using TowerLords.Settings;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace TowerLords.UI
{
    /// <summary>
    /// Deliberately small: a short list of icon rows, the way GW2's escape menu
    /// is. It is not a hub — every real screen has its own hotkey and opens
    /// directly, so this only holds the things that have nowhere else to live.
    /// </summary>
    public class PausePanel : UIPanel
    {
        public const string Id = "pause";

        public override string PanelId => Id;
        public override bool PausesGame => true;

        protected override void Build()
        {
            var window = UIFactory.Panel("Window", transform, UITheme.PanelBase);
            var wrt = window.rectTransform;
            wrt.anchorMin = new Vector2(0.5f, 0.5f);
            wrt.anchorMax = new Vector2(0.5f, 0.5f);
            wrt.sizeDelta = new Vector2(320f, 336f);
            wrt.anchoredPosition = Vector2.zero;

            var accent = UIFactory.Panel("AccentRule", window.transform, UITheme.Accent);
            var art = accent.rectTransform;
            art.anchorMin = new Vector2(0f, 1f);
            art.anchorMax = new Vector2(1f, 1f);
            art.pivot = new Vector2(0.5f, 1f);
            art.sizeDelta = new Vector2(0f, 2f);
            art.anchoredPosition = Vector2.zero;

            var list = UIFactory.Rect("List", window.transform);
            list.anchorMin = Vector2.zero;
            list.anchorMax = Vector2.one;
            list.offsetMin = new Vector2(14f, 14f);
            list.offsetMax = new Vector2(-14f, -16f);
            UIFactory.VerticalLayout(list, 4f);

            AddRow(list, "▸", "Return to Game", Close);
            AddRow(list, "⚙", "Settings", () =>
            {
                Close();
                UIManager.Instance?.OpenPanel(SettingsPanel.Id);
            });
            AddRow(list, "❊", "Feats Journal", () => Debug.Log("[Pause] Feats journal not built yet."));
            AddRow(list, "☖", "Run Log", () => Debug.Log("[Pause] Run log not built yet."));

            UIFactory.Spacer(list, 8f);
            UIFactory.Divider(list);
            UIFactory.Spacer(list, 8f);

            AddRow(list, "☠", "Abandon Run", AbandonRun, danger: true);
            AddRow(list, "⏻", "Exit to Desktop", QuitToDesktop, danger: true);
        }

        void AddRow(Transform parent, string glyph, string label, System.Action onClick,
                    bool danger = false)
        {
            var button = UIFactory.Button("Row_" + label, parent, "", out var buttonLabel,
                                          idle: new Color(0f, 0f, 0f, 0f));
            buttonLabel.gameObject.SetActive(false);
            UIFactory.SetHeight(button.gameObject, 40f);

            var color = danger ? UITheme.Danger : UITheme.TextPrimary;

            var icon = UIFactory.Text("Glyph", button.transform, glyph, 17f,
                                      danger ? UITheme.Danger : UITheme.Accent,
                                      TMPro.TextAlignmentOptions.Center);
            var irt = icon.rectTransform;
            irt.anchorMin = new Vector2(0f, 0f);
            irt.anchorMax = new Vector2(0f, 1f);
            irt.pivot = new Vector2(0f, 0.5f);
            irt.sizeDelta = new Vector2(44f, 0f);
            irt.anchoredPosition = Vector2.zero;

            var text = UIFactory.Text("Text", button.transform, label, UITheme.FontSizeBody, color);
            var lrt = text.rectTransform;
            lrt.anchorMin = Vector2.zero;
            lrt.anchorMax = Vector2.one;
            lrt.offsetMin = new Vector2(48f, 0f);
            lrt.offsetMax = new Vector2(-12f, 0f);

            button.onClick.AddListener(() => onClick?.Invoke());
        }

        void AbandonRun()
        {
            void Abandon()
            {
                Close();
                Time.timeScale = 1f;
                SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
            }

            if (!SettingsService.Current.confirmAbandonRun)
            {
                Abandon();
                return;
            }

            var shown = ConfirmDialog.Show(
                "Abandon Run",
                "This run ends here. Anything not deposited in the Stash Array is lost, " +
                "and the tower regenerates completely.\n\nThere is no way back to this floor.",
                "Abandon Run", Abandon, danger: true);

            if (!shown) Abandon();
        }

        void QuitToDesktop()
        {
            void Quit()
            {
                SettingsService.Save();
#if UNITY_EDITOR
                UnityEditor.EditorApplication.isPlaying = false;
#else
                Application.Quit();
#endif
            }

            var shown = ConfirmDialog.Show(
                "Exit to Desktop",
                "Progress inside the tower is not saved between sessions.",
                "Exit", Quit, danger: true);

            if (!shown) Quit();
        }
    }
}
