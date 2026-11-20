# Kabaddi live scoreboard

A two-page scoreboard for a live kabaddi stream.

The live site is [https://england-kabaddi-live.deed.page/](https://england-kabaddi-live.deed.page/). Open it, create a match, and copy the overlay and control links. Ten full designs are on the Board tab, including EKF. The free host adds a small “Published with deed.page” link in the corner of each page. The free host adds a small “Published with deed.page” link in the corner of each page.

- **Home** (`index.html`) creates a match and gives you both links.
- **Overlay** (`overlay.html?match=...`) is the scoreboard for OBS. The page background is transparent.
- **Control** (`control.html?match=...`) is the phone page with big buttons.

The phone and the stream PC do not need to be on the same Wi-Fi. Both pages talk through a free public MQTT server. There is no account and no API key.

This board is for **Punjab style (circle) kabaddi**. The first point of a match is 1.5. Every point after that is 1. New matches start with the tournament name **England Kabaddi Federation** and a red, blue, and white colour scheme (Team A red, Team B blue, white lettering, black panels). Other colour themes are still in the Board tab. Change the name any time on the control page.

## Run it on this computer

```bash
python3 -m http.server 8741 --bind 0.0.0.0
```

Open `http://127.0.0.1:8741/`.

Do not open the HTML files directly (`file://`). The pages need a small web server.

On the same Wi-Fi, the phone can use this computer’s LAN address, for example `http://192.168.1.20:8741/`. For a phone on mobile data, host the folder on the internet (see below).

## Add the overlay in OBS

1. Create a match and copy the **OBS overlay** link. Use that link, not the preview link. The preview link adds a dark background so you can check the graphic in a normal browser.
2. In OBS, click **Sources → + → Browser**.
3. Paste the overlay link.
4. Set **Width** to `1920` and **Height** to `1080`.
5. Leave **Custom CSS** empty. The page background is already transparent.
6. If you still see a black box, set Custom CSS to:

```css
body { background: transparent !important; margin: 0; overflow: hidden; }
```

Then toggle **Browser Source Hardware Acceleration** in OBS Settings → Advanced if the box is still black.

The ticker sits along the bottom of the 1920×1080 frame. The scoreboard can sit above it, or in a corner. Raid and match clocks stay hidden until you turn them on. If a clock is running, a reload does not reset it.

The free host may add a small “Published with deed.page” link in the corner. To keep it off the stream, put this in the OBS Custom CSS box as well:

```css
a[href*="deed.page"] { display: none !important; }
```

## Control the match

Open the control link on your phone. The buttons are in tabs:

- **Score** — team names, + point, − point, raiders, raids and stops, plus show or hide match stats, the raider lower third, and the top raiders and stoppers
- **Lineup** — player names, jersey numbers, a stat, a photo, Raider or Jaafi (stopper), and who is raiding or stopping now
- **Top 5** — five players, each with a first name, surname, team, stat, column colour, and a photo you upload at match time. Upload again to replace a photo. Show or hide the graphic.
- **Ticker** — three rows. Each row can be turned off. The main row has a LIVE mark, a message badge, scrolling text, a NEXT MATCHES badge, and a time and date box. Scroll speed is on this tab.
- **Board** — show or hide the scoreboard, five layouts (Classic, Stacked, Slanted, Glass, Corner), board position, five animated themes (Sheen, Pulse, Sweep, Slam, and 3D), and colour presets. The logo stays on the left, above a left-side board.
- **Colours** — a preset fills the pickers, then every colour can be changed on its own. Reset to default puts back red, blue, and white.
- **Result** — Winner / ਜੇਤੂ and Eliminated / ਬਾਹਰ, Hold, or Final with champion, prize, and player of the match
- **Logos** — tournament logo and rotating sponsor pictures (a link or a small upload)
- **Settings** — London time by default, with India and other time zones still available, optional timers, PIN, and the OBS link

The animated themes change motion, glow, and depth. They do not replace the colour pickers. 3D tilts the scoreboard in perspective, bevels the panels, and flips the scores.

Undo and Reset stay at the bottom of the phone.

A PIN is optional. It is saved in the control link. It only stops someone who opens the control page without that link. The match id is the real secret, so do not post the control link in public.

Turn on automatic date and time on the phone. Both screens use that clock.

## Put it on GitHub Pages

The pages use relative links. You do not edit a site address in the code. Open the site at whatever address GitHub gives you, then copy the overlay and control links from that page. Those links will use the same address.

1. Go to [https://github.com](https://github.com) and sign in. Create a free account if you do not have one.
2. Click the **+** at the top right, then **New repository**.
3. Name it `kabaddi-scoreboard`. Choose **Public**. Leave “Add a README” unchecked. Click **Create repository**.
4. On the new repository page, click **Add file**, then **Upload files**.
5. Unzip `kabaddi-scoreboard.zip` on your computer. Select every file and folder inside it (`index.html`, `overlay.html`, `control.html`, `css`, `js`, `vendor`, `assets`, `README.md`, and `.nojekyll`). Drag them into the upload box. Do not upload a `node_modules` folder. `.nojekyll` is a hidden empty file that tells GitHub to serve the files as they are. If you do not see it, turn on “show hidden files” in your file window, then add it too.
6. Click **Commit changes**.
7. Open **Settings**, then **Pages** (under Code and automation).
8. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
9. Set **Branch** to `main` and the folder to **/ (root)**. Click **Save**.
10. Wait one or two minutes. Refresh the Pages settings. GitHub shows a site address like `https://YOUR-NAME.github.io/kabaddi-scoreboard/`.
11. Open that address. Click **Create match**. Copy the overlay link into OBS and the control link onto your phone.

The repository must stay **Public**. GitHub’s free Pages hosting does not publish a private repository.

Cloudflare Pages and Netlify can host this same folder. Use those only if you already have an account there.

The pages use these public MQTT brokers:

- `wss://broker.emqx.io:8084/mqtt`
- `wss://broker.hivemq.com:8884/mqtt`
- `wss://test.mosquitto.org:8081`

The latest score is kept on the broker, so the overlay restores it when OBS reloads. Keep the control page open during the match. Public brokers are shared test servers: they are free, and they can disconnect. The page reconnects on its own.

Team names can be in English, Hindi, or Punjabi.

The MQTT library in `vendor/mqtt.min.js` is [MQTT.js](https://github.com/mqttjs/MQTT.js) (MIT). Outfit and Teko are loaded from Google Fonts.
