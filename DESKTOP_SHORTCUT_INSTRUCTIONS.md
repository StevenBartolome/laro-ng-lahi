
# Creating a Desktop Shortcut

Since you have successfully installed the app, you have two options to put it on your desktop:

## Option 1: Create a Shortcut (Easiest)
1.  **Right-click** on your Desktop -> **New** -> **Shortcut**.
2.  In the location field, paste this command (adjusting the path to where your project is):
    ```
    C:\Program Files\nodejs\npm.cmd start --prefix "c:\xampp\htdocs\laro_ng_lahi"
    ```
3.  Click **Next**, name it "Laro ng Lahi", and click **Finish**.
*(Note: You still need XAMPP running for this to work)*

## Option 2: Build a Standalone .exe (Professional)
This will create a real `setup.exe` or `portable.exe` file.

1.  In your terminal (inside `c:\xampp\htdocs\laro_ng_lahi`), run:
    ```powershell
    npm run dist
    ```
2.  Wait for it to finish. It will create a `dist` folder.
3.  Open the `dist` folder: `Start-Process dist`
4.  You will find an installer (e.g., `laro-ng-lahi-desktop Limitless.exe`). You can move this to your desktop or install it.

**Important Reminder:**
Even with the desktop app, **XAMPP must always be running** because your game database and PHP logic still live there. The desktop app is a "window" into your local server.
