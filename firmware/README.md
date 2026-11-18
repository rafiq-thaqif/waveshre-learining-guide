# Firmware package pending

The website is ready for a browser flasher integration, but no firmware binary is included yet.

Please add the official Waveshare `ESP32-S3-POE-ETH-8DI-8DO-Demo.zip` source package so the companion firmware can be built and tested with the exact board drivers.

Planned firmware profiles:

1. `local-io-web-bridge` – reads DI1–DI8, controls DO1–DO8 and emits the JSON serial protocol documented in the project README.
2. `wifi-ap` – creates the board access point and serves the local control page.
3. `wifi-sta-mqtt` – joins a 2.4 GHz network and exchanges I/O state/commands with an MQTT broker.
4. Lesson builds – examples for DO1/DO2 indicator lamps, DI1 reed switch, Wi-Fi, onboard buzzer and eight-button input piano.

Firmware images should only be flashed after checking chip target, flash size, PSRAM mode, partition layout, merged binary offsets and the exact Waveshare board package.
