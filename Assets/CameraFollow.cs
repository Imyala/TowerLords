using UnityEngine;
using UnityEngine.InputSystem; // We need this to read the scroll wheel!

public class CameraFollow : MonoBehaviour
{
    public Transform target;
    
    // The base distance and angle
    public Vector3 baseOffset = new Vector3(0f, 10f, -10f);
    public float smoothSpeed = 10f;

    // --- NEW ZOOM VARIABLES ---
    [Header("Zoom Settings")]
    public float zoomSpeed = 0.005f; // How fast the wheel zooms
    public float minZoom = 0.4f;     // How close we can get (0.4x of base distance)
    public float maxZoom = 2.0f;     // How far out we can go (2.0x of base distance)
    
    private float currentZoom = 1f;

    void LateUpdate()
    {
        if (target == null) return;

        // --- NEW ZOOM LOGIC ---
        // Safety check to ensure a mouse is connected
        if (Mouse.current != null)
        {
            // Read the scroll wheel
            float scroll = Mouse.current.scroll.ReadValue().y;

            // If the wheel is moving, adjust our zoom
            if (scroll != 0)
            {
                // We subtract because scrolling UP (positive) should zoom IN (smaller distance)
                currentZoom -= scroll * zoomSpeed;
                
                // Clamp the zoom so we don't go through the floor or into outer space
                currentZoom = Mathf.Clamp(currentZoom, minZoom, maxZoom);
            }
        }

        // Apply our zoom multiplier to the base offset
        Vector3 zoomedOffset = baseOffset * currentZoom;

        // --- EXISTING MOVEMENT LOGIC ---
        Vector3 desiredPosition = target.position + zoomedOffset;
        Vector3 smoothedPosition = Vector3.Lerp(transform.position, desiredPosition, smoothSpeed * Time.deltaTime);
        
        transform.position = smoothedPosition;
    }
}