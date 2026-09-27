# CareCompass Geofence Alert Plugin for OpenWA

Autonomous WhatsApp emergency dispatch plugin for dementia wandering and geofence safety perimeter breaches, eliminating any need for manual `wa.me` links or button taps.

Designed for the [OpenWA Gateway](https://github.com/rmyndharis/OpenWA-plugins).

## Features
- **0-Click Automation**: Receives geofence breach webhooks from the SmritiSaathi CareCompass engine and transmits WhatsApp messages automatically to the designated caregiver.
- **Direct Dispatch**: Uses OpenWA's native `ctx.messages.sendText` API or the REST gateway (`/api/sessions/{sessionId}/messages/send-text`).
- **No wa.me Dependency**: Caregiver receives the live alert with Google Maps coordinates and battery status instantly on WhatsApp without requiring the patient or caregiver to click and send through WhatsApp Web or mobile URL schemes.

## Installation in OpenWA
1. Copy this folder into your OpenWA `plugins` directory:
   ```bash
   cp -r openwa-plugin-geofence-alert /path/to/openwa/plugins/
   ```
2. In the OpenWA Dashboard or via the Admin REST API, enable the `smritisaathi-geofence-alert` plugin.
3. Grant the required permissions declared in `manifest.json`:
   - `messages:send`
   - `webhook:ingress`
   - `net:fetch`
4. Set the gateway URL in your SmritiSaathi `.env` or CareCompass settings:
   ```env
   OPENWA_API_URL=http://localhost:2785
   OPENWA_API_KEY=your_optional_api_key
   OPENWA_SESSION_ID=default
   ```
