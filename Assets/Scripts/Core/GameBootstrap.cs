using TowerLords.Settings;
using TowerLords.UI;
using UnityEngine;

namespace TowerLords.Core
{
    /// <summary>
    /// Spins up settings, the UI manager, every panel and the HUD before the first
    /// scene loads. Nothing here needs wiring in the inspector — dropping a new
    /// scene into the project gets the whole interface for free, and there is no
    /// prefab to fall out of sync with the code.
    /// </summary>
    public static class GameBootstrap
    {
        static bool _initialised;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        static void Initialise()
        {
            if (_initialised) return;
            _initialised = true;

            SettingsService.Load();

            var root = new GameObject("~TowerLords");
            Object.DontDestroyOnLoad(root);

            var manager = root.AddComponent<UIManager>();

            manager.RegisterPanel<SettingsPanel>();
            manager.RegisterPanel<PausePanel>();
            manager.RegisterPanel<ConfirmDialog>();

            root.AddComponent<HudController>();
            root.AddComponent<ApplicationFocusWatcher>();
        }
    }

    /// <summary>Honours the "mute when the window is not focused" setting.</summary>
    public class ApplicationFocusWatcher : MonoBehaviour
    {
        void OnApplicationFocus(bool hasFocus)
        {
            var settings = SettingsService.Current;
            if (!settings.muteWhenUnfocused)
            {
                AudioListener.volume = settings.volumeMaster;
                return;
            }

            AudioListener.volume = hasFocus ? settings.volumeMaster : 0f;
        }
    }
}
