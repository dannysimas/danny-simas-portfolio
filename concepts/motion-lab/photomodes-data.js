// Compatibility and setup transcribed from the exact shared ZIP READMEs.
// See docs/photomode-compatibility.md before updating a package.
export default [
  {
    "id": "phantom-blade-zero",
    "game": "Phantom Blade Zero",
    "lines": [
      "PHANTOM",
      "BLADE ZERO"
    ],
    "downloadUrl": "https://www.dropbox.com/scl/fi/6q7w7mwszgfhw56z0zytj/PBZ-Photomode-0.5.0-preview92-Drop-In.zip?rlkey=wjqpdfq0ffh43vve8qzs0xb6g&dl=1",
    "preview": "/images/photomodes/phantom-blade-zero.jpg",
    "version": "0.5.0-preview92",
    "platform": "Windows / Steam",
    "requirements": [
      "Includes UE4SS. No separate loader or ReShade installation is needed.",
      "If another mod uses dwmapi.dll or ue4ss, do not overwrite its files."
    ],
    "installation": [
      "Close the game and extract the ZIP. Back up existing photomode files before updating.",
      "In Steam, choose Manage → Browse local files, then open platform/steam beside PBZ.exe.",
      "Copy dwmapi.dll and the ue4ss folder into that folder, then launch the game and load your save."
    ],
    "compatibility": "For Steam build 26367565 / CL-302256_JKS-17280. Other builds are unverified.",
    "controls": "F8 or L3 + R3 opens photomode. F8 or Esc exits. Disable this mod after a game update until compatibility is confirmed."
  },
  {
    "id": "kingdom-hearts-3",
    "game": "Kingdom Hearts 3",
    "lines": [
      "KINGDOM",
      "HEARTS 3"
    ],
    "downloadUrl": "https://www.dropbox.com/scl/fi/i3t0qclg4oxu6ftl4zdnm/KH3-FreeCam-PhotoMode-v1.zip?rlkey=bzh1h9mdsgy29tkuqtv9tvdsk&dl=1",
    "preview": "/images/photomodes/kingdom-hearts-3.jpg",
    "version": "3 (Test 7)",
    "platform": "Windows / Steam",
    "requirements": [
      "Keep only one FreeCam PAK active. The README documents the Steam installation path."
    ],
    "installation": [
      "Fully close KINGDOM HEARTS III and back up the previous FreeCam.pak outside the mods folder.",
      "Copy FreeCam.pak into KINGDOM HEARTS III/Content/Paks/~mods inside your game installation.",
      "Confirm only one FreeCam PAK is active, then restart the game."
    ],
    "compatibility": "The included README identifies this as v3 / Test 7, although the ZIP filename says v1. It does not specify a game build.",
    "controls": "F6 toggles freecam. On controller, hold LT + RT, then click L3. Read the README for movement, roll and zoom controls."
  },
  {
    "id": "gears-of-war-e-day",
    "game": "Gears of War E-Day",
    "lines": [
      "GEARS OF WAR",
      "E-DAY"
    ],
    "downloadUrl": "https://www.dropbox.com/scl/fi/74d24s9xos4tch6040tgf/EDayFreeCamera-v0.3.11-Final.zip?rlkey=n03d8o4a68gwcupi0x3ecmtf6&dl=1",
    "preview": "/images/photomodes/gears-of-war-e-day.jpg",
    "version": "0.3.11",
    "platform": "Windows PC",
    "requirements": [
      "Requires an existing, working Ultra+ UE4SS setup for E-Day. Loader binaries are not included.",
      "Offline solo campaign only. Use the game-specific offline launch described in the README; not multiplayer or co-op."
    ],
    "installation": [
      "Close the game and back up the old EDayFreeCamera folder outside ue4ss/Mods.",
      "Copy the complete EDayFreeCamera folder into the existing ue4ss/Mods folder for your installation.",
      "Keep all seven Lua scripts and enabled.txt together. Preserve the existing Ultra+ files and follow the README launch steps."
    ],
    "compatibility": "Tested in a solo campaign on PC Game Pass / Xbox app (WinGDK). Steam instructions are included, but Steam compatibility is unconfirmed.",
    "controls": "F6 enables freecam; F7 returns to gameplay. Insert pauses or resumes the scene. See CONTROLS.txt for the full reference.",
    "resourceLinks": [
      {
        "label": "Ultra+ loader — author’s download page",
        "url": "https://www.nexusmods.com/site/mods/1586?tab=files"
      }
    ]
  },
  {
    "id": "resonance-a-plague-tale-legacy",
    "game": "Resonance: A Plague Tale Legacy",
    "lines": [
      "RESONANCE:",
      "A PLAGUE TALE LEGACY"
    ],
    "downloadUrl": "https://www.dropbox.com/scl/fi/5ulqmwquftq0e0ns8ddx6/Photomode-v1.1.zip?rlkey=2t04ib2xsakbjpa852dwcs46s&dl=1",
    "preview": "/images/photomodes/resonance-a-plague-tale-legacy.jpg",
    "version": "1.1 / Test 7G",
    "platform": "Windows PC",
    "requirements": [
      "Extends the game’s native Photo Mode. The shortcut does not open or close Photo Mode."
    ],
    "installation": [
      "Close the game and back up any existing dinput8.dll before replacing it.",
      "Copy the included dinput8.dll beside Resonance.exe, then start the game and open Photo Mode normally."
    ],
    "compatibility": "The package contains Controller Debounce Fix Test 7G. Its README does not specify a tested game build or storefront.",
    "controls": "While Photo Mode is open, F7 or L3 + R3 toggles live/frozen motion. Release both stick buttons fully between presses."
  },
  {
    "id": "star-wars-galactic-racer",
    "game": "STAR WARS Galactic Racer",
    "lines": [
      "STAR WARS",
      "GALACTIC RACER"
    ],
    "downloadUrl": "https://www.dropbox.com/scl/fi/28wpr4h7ww69c8f0wix6e/GalacticPhotoMode-v0.1.17.zip?rlkey=p8itni0kbcn5uc1sv6ebac7h7&dl=1",
    "preview": "/images/photomodes/star-wars-galactic-racer.jpg",
    "version": "0.1.17",
    "platform": "Windows / Steam",
    "requirements": [
      "Install UE4SS Galactic Racer Edition separately. This download contains only the photomode scripts.",
      "Real-time cutscene support is experimental. The camera cannot alter prerecorded video."
    ],
    "installation": [
      "Close the game, extract the ZIP and back up any existing GalacticPhotoMode folder.",
      "Copy the extracted Griffin folder into the game folder, merging folders and updating only the packaged mod files.",
      "Keep all ten Lua files and enabled.txt together under Griffin/Binaries/Win64/ue4ss/Mods/GalacticPhotoMode."
    ],
    "compatibility": "Tested against Steam build 25880680 with UE4SS Galactic Racer Edition Open Beta V0.9.2. Other game builds and loader versions are unverified.",
    "controls": "F6 or L3 + R3 opens photomode in a playable scene. See CONTROLS.txt for the full reference.",
    "resourceLinks": [
      {
        "label": "UE4SS Galactic Racer Edition — author’s download page",
        "url": "https://www.nexusmods.com/starwarsgalacticracer/mods/2?tab=files"
      }
    ]
  },
  {
    "id": "the-sinking-city-2",
    "game": "The Sinking City 2",
    "lines": [
      "THE SINKING",
      "CITY 2"
    ],
    "downloadUrl": "https://www.dropbox.com/scl/fi/1kovl06744a2766744ohq/TSC2-PhotoMode-Unlocked-Camera.zip?rlkey=fa7ctmhijvc95mw5p4s0223wj&dl=1",
    "preview": "/images/photomodes/the-sinking-city-2.jpg",
    "version": "Test 7",
    "platform": "Windows PC",
    "requirements": [
      "Only one version.dll mod and one camera-range PAK/UCAS/UTOC set can be active.",
      "The controller shortcut requires XInput. In-game cutscene entry and recovery are not yet confirmed in the README."
    ],
    "installation": [
      "Close the game and back up conflicting mod files before making changes.",
      "Copy the bundle’s PlayGround folder into the main game folder. Keep version.dll in PlayGround/Binaries/Win64.",
      "Keep the included 500 m PAK, UCAS and UTOC files together in PlayGround/Content/Paks. Read the full setup and recovery instructions before launching."
    ],
    "compatibility": "Requires the exact executable build identified by SHA-256 in the README. The mod refuses to activate on an unknown build.",
    "controls": "L3 + R3 enters native Photo Mode. Use the game’s normal Back/Exit control to leave."
  }
];
