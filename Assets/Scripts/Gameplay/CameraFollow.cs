using TowerLords.Settings;
using TowerLords.UI;
using UnityEngine;
using UnityEngine.InputSystem;

namespace TowerLords.Gameplay
{
    /// <summary>
    /// Follow camera driven by the gameplay settings: distance, field of view and
    /// shake intensity are all player-tunable, since camera feel is the first
    /// thing people reach for in an action game.
    /// </summary>
    public class CameraFollow : MonoBehaviour
    {
        public Transform target;

        [Tooltip("Direction and base length of the camera arm. Scaled by the " +
                 "Camera Distance setting and the scroll wheel.")]
        public Vector3 baseOffset = new Vector3(0f, 10f, -10f);
        public float smoothSpeed = 10f;

        [Header("Zoom Settings")]
        public float zoomSpeed = 0.005f;
        public float minZoom = 0.4f;
        public float maxZoom = 2.0f;

        private float currentZoom = 1f;
        private Camera _camera;

        // Active screen shake, scaled by the player's intensity setting.
        private float _shakeAmplitude;
        private float _shakeDecay;

        void Awake()
        {
            _camera = GetComponent<Camera>();
        }

        void OnEnable()
        {
            SettingsService.Changed += ApplySettings;
            ApplySettings(SettingsService.Current);
        }

        void OnDisable()
        {
            SettingsService.Changed -= ApplySettings;
        }

        void ApplySettings(GameSettings settings)
        {
            if (_camera != null) _camera.fieldOfView = settings.cameraFov;
        }

        /// <summary>Requests a shake. Honours the player's intensity slider, including zero.</summary>
        public void Shake(float amplitude, float duration = 0.25f)
        {
            var scaled = amplitude * SettingsService.Current.cameraShakeIntensity;
            if (scaled <= 0.001f) return;

            _shakeAmplitude = Mathf.Max(_shakeAmplitude, scaled);
            _shakeDecay = _shakeAmplitude / Mathf.Max(0.01f, duration);
        }

        void LateUpdate()
        {
            if (target == null) return;

            var settings = SettingsService.Current;

            // Scroll zoom, suppressed while a panel has input.
            if (Mouse.current != null && !UIManager.InputCaptured)
            {
                float scroll = Mouse.current.scroll.ReadValue().y;
                if (scroll != 0)
                {
                    currentZoom -= scroll * zoomSpeed;
                    currentZoom = Mathf.Clamp(currentZoom, minZoom, maxZoom);
                }
            }

            // The Camera Distance setting sets the resting arm length; the scroll
            // wheel then trims around it.
            var settingScale = settings.cameraDistance / 12f;
            Vector3 zoomedOffset = baseOffset * currentZoom * settingScale;

            Vector3 desiredPosition = target.position + zoomedOffset;
            Vector3 smoothedPosition = Vector3.Lerp(transform.position, desiredPosition,
                                                    smoothSpeed * Time.deltaTime);

            transform.position = smoothedPosition + ConsumeShakeOffset();
        }

        Vector3 ConsumeShakeOffset()
        {
            if (_shakeAmplitude <= 0f) return Vector3.zero;

            _shakeAmplitude = Mathf.Max(0f, _shakeAmplitude - _shakeDecay * Time.deltaTime);

            return new Vector3(
                Random.Range(-_shakeAmplitude, _shakeAmplitude),
                Random.Range(-_shakeAmplitude, _shakeAmplitude),
                0f);
        }
    }
}
