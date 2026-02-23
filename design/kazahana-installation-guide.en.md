# kazahana Installation Guide

kazahana is a desktop client for Bluesky.
Since the app is not currently code-signed, your OS security features may display warnings.
Please follow the steps below to install.

---

## Windows

### 1. Download the Installer

Download the latest installer from the [GitHub Releases](https://github.com/osprey74/kazahana/releases) page.

| File Name | Format | Target |
|---|---|---|
| `kazahana_x.x.x_x64-setup.exe` | NSIS Installer | Windows 10 / 11 (64-bit) |
| `kazahana_x.x.x_x64_en-US.msi` | MSI Installer | Windows 10 / 11 (64-bit) |

### 2. Handling SmartScreen Warning

When you run the installer, Microsoft Defender SmartScreen may display the following warning:

> **Windows protected your PC**
> Microsoft Defender SmartScreen prevented an unrecognized app from starting. Running this app might put your PC at risk.

This is a standard warning displayed for apps that are not code-signed. kazahana is open-source software, and its source code is publicly available on GitHub.

**How to proceed:**

1. Click **"More info"** in the warning dialog
2. The app name and publisher information will be shown
3. Click the **"Run anyway"** button

### 3. Installation

After passing SmartScreen, the standard installation wizard will start.

1. Confirm the installation folder (the default is fine)
2. Click **"Install"**
3. Once installation is complete, click **"Finish"**

### 4. Launch

Launch kazahana from the Start Menu or desktop shortcut.
The SmartScreen warning will not appear after the first launch.

### Note: Browser Download Warnings

Your browser may also display warnings when downloading.

- **Microsoft Edge**: May show "This file isn't commonly downloaded." Click the `…` menu and select **"Keep"**.
- **Google Chrome**: May show "This file may be dangerous." Click the `∧` icon and select **"Keep"**.

---

## macOS

### 1. Download the Installer

Download the latest installer from the [GitHub Releases](https://github.com/osprey74/kazahana/releases) page.

| File Name | Target |
|---|---|
| `kazahana_x.x.x_x64.dmg` | macOS (Intel) |
| `kazahana_x.x.x_aarch64.dmg` | macOS (Apple Silicon: M1 / M2 / M3 / M4) |

> To check your Mac's chip: Click the Apple menu in the top-left corner and select **"About This Mac"**.

### 2. Install the App

1. Open the downloaded `.dmg` file
2. Drag the kazahana icon to the **Applications** folder
3. Close the `.dmg` window and eject the disk image

### 3. Handling Gatekeeper Warning

On first launch, macOS Gatekeeper will display the following warning:

> **"kazahana" can't be opened because the developer cannot be verified.**

This is a standard warning for apps that are not code-signed or notarized.

#### Method A: Allow via System Settings (Recommended)

1. When the warning appears, click **"OK"** to dismiss the dialog
2. Open **System Settings** > **"Privacy & Security"**
3. At the bottom of the page, you'll see: "kazahana was blocked from use because it is not from an identified developer"
4. Click **"Open Anyway"**
5. Authenticate with your admin password or Touch ID
6. When the confirmation dialog appears, click **"Open"**

#### Method B: Open via Right-Click

1. Open the **Applications** folder in Finder
2. **Right-click** (or Control + click) on kazahana
3. Select **"Open"** from the context menu
4. When prompted "The developer cannot be verified. Are you sure you want to open it?", click **"Open"**

> Note: On some macOS versions, Method B may not work. If so, try Method A.

#### Method C: Remove Quarantine Attribute via Terminal (Advanced)

Open Terminal and run the following command:

```bash
xattr -cr /Applications/kazahana.app
```

This removes the quarantine attribute (`com.apple.quarantine`) applied to downloaded files, allowing you to bypass Gatekeeper verification.

### 4. Launch

Launch kazahana from Launchpad or the Applications folder.
After the initial permission step, it will launch normally.

---

## Uninstall

### Windows

Go to **Settings** > **Apps** > **Installed apps**, find kazahana, and click **"Uninstall"**.

### macOS

Drag kazahana from the **Applications** folder to the Trash.

---

## Troubleshooting

### The app won't launch

- Make sure your OS is updated to the latest version
- Windows: Windows 10 or later is required
- macOS: macOS 12 (Monterey) or later is required

### "kazahana is damaged and can't be opened" (macOS)

Run the following command in Terminal:

```bash
xattr -cr /Applications/kazahana.app
```

### Other Issues

If the problem persists, please contact us:

- GitHub Issues: [https://github.com/osprey74/kazahana/issues](https://github.com/osprey74/kazahana/issues)
- Email: kazahana.app@gmail.com

---

## About Security

kazahana is open-source software (MIT License). The source code is publicly available on [GitHub](https://github.com/osprey74/kazahana) and can be reviewed by anyone.

The app is not currently code-signed, which is why your OS displays security warnings. This does not mean the app is dangerous — it simply means the publisher cannot be electronically verified. Code signing is planned for the future.
